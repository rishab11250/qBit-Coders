// GoogleGenerativeAI import removed as we use fetch
import useStudyStore from '../store/useStudyStore';

const BASE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/** Reads current settings from the Zustand store */
const getSettings = () => useStudyStore.getState().settings;

/**
 * API Key Pool: supports multiple comma-separated keys in .env
 * Format: VITE_GEMINI_API_KEY=key1,key2,key3
 */
const API_KEYS = (import.meta.env.VITE_GEMINI_API_KEY || '')
  .split(',')
  .map(k => k.trim())
  .filter(Boolean);

let currentKeyIndex = 0;

/** Gets the next API key in rotation */
const getNextApiKey = () => {
  if (API_KEYS.length === 0) throw new Error("No API Keys configured. Add VITE_GEMINI_API_KEY to your .env file.");
  const key = API_KEYS[currentKeyIndex % API_KEYS.length];
  currentKeyIndex++;
  return key;
};

/** Resets key rotation back to the first key */
const resetKeyRotation = () => { currentKeyIndex = 0; };

/**
 * Models to try if the primary one is rate-limited.
 * Order matters: prefer newer/faster, then older/stable.
 */
const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro'];

/** Builds the API URL dynamically based on the selected model */
const getApiUrl = (model = null) => {
  const selectedModel = model || getSettings().model || 'gemini-2.5-flash';
  return `${BASE_API_URL}/${selectedModel}:generateContent`;
};

/**
 * Executes a Gemini API request with:
 * 1. API Key rotation (tries all keys before giving up)
 * 2. Model fallback on 429 errors
 */
async function executeGeminiRequest(payload) {
  if (API_KEYS.length === 0) throw new Error("No API Keys configured.");

  const preferredModel = getSettings().model || 'gemini-2.5-flash';

  // Create a list of models to try: [Preferred, ...Fallbacks]
  const modelsToTry = [
    preferredModel,
    ...FALLBACK_MODELS.filter(m => m !== preferredModel)
  ];

  let lastError = null;
  resetKeyRotation();

  for (const model of modelsToTry) {
    // For each model, try ALL available API keys
    for (let keyAttempt = 0; keyAttempt < API_KEYS.length; keyAttempt++) {
      try {
        const apiKey = getNextApiKey();
        const url = `${getApiUrl(model)}?key=${apiKey}`;

        const response = await fetchWithRetry(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }, 1, 1000);

        if (!response.ok) {
          if (response.status === 429 || response.status === 503) {
            const retryAfter = response.headers.get('Retry-After');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
            useStudyStore.getState().updateModelStatus(model, 'limited', waitTime);

            console.warn(`⚠️ Key #${((currentKeyIndex - 1) % API_KEYS.length) + 1} rate limited on ${model}. Trying next key...`);
            continue; // Try next key
          }
          const errText = await response.text();
          throw new Error(`API Error: ${response.status} - ${errText}`);
        }

        // Success!
        useStudyStore.getState().updateModelStatus(model, 'available');
        return response;

      } catch (error) {
        lastError = error;
        const isRateLimit = error.message.includes('RateLimit') || error.message.includes('429') || error.message.includes('503');

        if (isRateLimit) {
          continue; // Try next key for this model
        } else {
          throw error; // Other errors fail immediately
        }
      }
    }
    // All keys exhausted for this model, try next model
    console.warn(`⚠️ All ${API_KEYS.length} keys exhausted for ${model}. Switching model...`);
    resetKeyRotation();
  }

  throw lastError || new Error("All models and API keys exhausted.");
}

/**
 * Helper: Retries a fetch operation with exponential backoff.
 * @param {string} url 
 * @param {object} options 
 * @param {number} retries 
 * @param {number} backoff 
 */
async function fetchWithRetry(url, options, retries = 3, backoff = 1000) {
  try {
    const response = await fetch(url, options);

    // 429 (Too Many Requests) or 503 (Service Unavailable)
    if (!response.ok && (response.status === 429 || response.status === 503)) {
      if (retries > 0) {
        // Check for Retry-After header (seconds)
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : backoff;

        console.warn(`API Rate Limit/Error (${response.status}). Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Recursive retry with increased backoff (cap at 60s)
        const nextBackoff = Math.min(backoff * 2, 60000);
        return fetchWithRetry(url, options, retries - 1, nextBackoff);
      }
    }

    // Check for other server errors (500, 502, 504)
    if (!response.ok && response.status >= 500) {
      if (retries > 0) {
        console.warn(`Server Error (${response.status}). Retrying in ${backoff}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Network error. Retrying in ${backoff}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
}

/**
 * Helper: Encodes a File object to a Base64 string for the API.
 * Kept for backward compatibility if needed by other components.
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove the Data-URL prefix (e.g. "data:application/pdf;base64,") to get raw base64
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Generates structured study content from text or file input.
 * Accepts flexible arguments to support both legacy and new calls.
 * 
 * @param {string} inputType - 'text' | 'pdf' | 'image' (or the text content if called with single arg)
 * @param {string} content - The raw text or Base64 string
 * @param {string} mimeType - (Optional) The mime type for files
 */
export async function generateStudyContent(inputType, content, mimeType = 'application/pdf') {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("API Key is missing. Set VITE_GEMINI_API_KEY in .env");
    return null;
  }

  // Handle single-argument call pattern (if someone calls generateStudyContent(text))
  // This satisfies the simplified requirement while keeping compatibility
  if (arguments.length === 1 && typeof inputType === 'string') {
    content = inputType;
    inputType = 'text';
  }

  // Define the JSON structure. 
  // IMPORTANT: We include 'concepts' to support existing DashboardLayout UI.
  // Force 20 questions for all generations to allow client-side filtering
  const { difficulty } = getSettings();
  const quizCount = 20;

  const systemPrompt = `
    You are an expert AI Study Coach and Curriculum Designer.
    Your goal is to process the provided study material into a highly structured, deep, and engaging mastery plan.

    **Configuration:**
    - Difficulty Level: ${difficulty} (Adjust vocabulary, depth, and question complexity accordingly)
    - Difficulty Level: ${difficulty} (Adjust vocabulary, depth, and question complexity accordingly)
    - Quiz Question Count: ${quizCount} (Generate a comprehensive set covering all topics)

    **Required Output Format (JSON ONLY):**
    {
      "summary": "Start with a 'Simple Explanation' (EL.I5 style, 2 sentences). Then, provide a structured 'Executive Brief' (3-4 bullet points) covering the core thesis.",
      "topics": ["Topic 1 (Foundation)", "Topic 2 (Core Mechanism)", "Topic 3 (Advanced Application)", "Topic 4 (Future/Edge Cases)"],
      "concepts": [
        { 
          "name": "Main Concept", 
          "related": ["Prerequisite Concept", "Sub-component", "Real-world Example"] 
        }
      ],
      "detailed_notes": [
        {
          "topic": "Topic Name",
          "content": "Comprehensive learning material in Markdown format. Use headers, bullet points, bold text, and code blocks if relevant.",
          "key_points": ["Key takeaway 1", "Key takeaway 2"],
          "real_world_example": "A concrete analogy or application."
        }
      ],
      "quiz": [
        { 
          "question": "Scenario-based or conceptual question?", 
          "answer": "Correct answer with a *concise* explanation of WHY it is correct.", 
          "topic": "Topic tag",
          "type": "Conceptual" // or "Application", "Fact", "Analysis"
        }
      ]
    }

    **Instructions for Excellence:**
    1. **Summary (The "Hook"):** 
       - Do not just summarize. *Synthesize*. 
       - Explain *why* this matters. Connect the dots between isolated facts.
       - **Style**: Explain complex ideas simply (like Feynman). If you can't explain it simply, you don't understand it.

    2. **Concept Graph (The "Map"):** 
       - Avoid generic links like "Definition".
       - Focus on *Structural* relationships: "Part of", "Caused by", "Enables", "Contrast with".
       - Ensure a mix of high-level nodes and specific examples.

    3. **Quiz (The "Test"):** 
       - Generate exactly ${quizCount} questions.
       - **DIVERSITY IS CRITICAL**:
         - 30% **Fact Recall**: "What is X?"
         - 40% **Conceptual**: "Why does X happen when Y?"
         - 30% **Application/Scenario**: "Given situation Z, what is the best approach?"
       - **Difficulty Adjustment**:
         - '${difficulty}' == 'Hard': Focus on edge cases, trade-offs, and multi-step reasoning. Distractors should be plausible common misconceptions.
         - '${difficulty}' == 'Medium': Balance theory and practice.
         - '${difficulty}' == 'Easy': Focus on core definitions and clear examples.
       - **Do not** ask multiple questions about the same specific sentence. Spread them across the entire content.

    **Constraint:** Return ONLY the raw JSON. No markdown formatting (no \`\`\`json wrappers).
  `;

  // Construct payload
  const parts = [{ text: systemPrompt }];

  if (inputType === 'text') {
    parts.push({ text: `Analyze this study material:\n\n${content}` });
  } else if (inputType === 'images' && Array.isArray(content)) {
    // Multi-image support: each item is { mimeType, data }
    content.forEach((img, i) => {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.data
        }
      });
    });
    parts.push({ text: `Analyze these ${content.length} lecture slides/images and create a comprehensive study plan.` });
  } else if (inputType === 'multiple-pdf' && Array.isArray(content)) {
    // Multi-PDF support: each item is { mimeType, data }
    content.forEach((pdf, i) => {
      parts.push({
        inlineData: {
          mimeType: pdf.mimeType, // 'application/pdf'
          data: pdf.data
        }
      });
    });
    parts.push({ text: `Analyze these ${content.length} PDF documents comprehensively. Create a unified study plan covering all materials.` });
  } else if (inputType === 'pdf' || inputType === 'image') {
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: content
      }
    });
    parts.push({ text: "Analyze this document." });
  }

  try {
    const response = await executeGeminiRequest({
      contents: [{ parts: parts }]
    });

    if (!response.ok) {
      // Should be handled by executeGeminiRequest but safety net
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];

    if (!candidate) throw new Error("No response generated.");

    let textResponse = candidate.content.parts[0].text;

    // Clean markdown formatting
    textResponse = textResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");

    try {
      return JSON.parse(textResponse);
    } catch (parseError) {
      console.error("JSON Parsing Error:", parseError, textResponse);
      // Fallback or re-throw
      return {
        summary: "Error parsing AI response.",
        topics: [],
        concepts: [],
        quiz: []
      };
    }

  } catch (error) {
    console.error("AI Generation Error:", error);
    return null;
  }
}

/**
 * Generates study content using Google Search Grounding.
 * Used as a fallback when transcript fetching fails (e.g., YouTube blocking).
 * Gemini will search the web for video content and generate a study plan.
 *
 * @param {string} videoUrl - The YouTube video URL
 * @returns {Promise<Object|null>} Structured study data
 */
export async function generateStudyContentWithSearch(videoUrl) {
  // Force 20 questions for all generations to allow client-side filtering
  const { difficulty } = getSettings();
  const quizCount = 20;

  const systemPrompt = `
    You are an expert AI Study Coach and Curriculum Designer.
    The user wants to study a YouTube video, but we could not fetch its transcript directly.
    You MUST use Google Search to find information about this video's content, then generate a comprehensive study plan.

    **Video URL:** ${videoUrl}

    **Your Task:**
    1. Search for this video's content, topic, and key points.
    2. Generate a structured study plan based on what you find.

    **Configuration:**
    - Difficulty Level: ${difficulty}
    - Quiz Question Count: ${quizCount}

    **Required Output Format (JSON ONLY):**
    {
      "summary": "Start with a 'Simple Explanation' (ELI5 style, 2 sentences). Then, provide a structured 'Executive Brief' (3-4 bullet points) covering the core thesis.",
      "topics": ["Topic 1 (Foundation)", "Topic 2 (Core Mechanism)", "Topic 3 (Advanced Application)", "Topic 4 (Future/Edge Cases)"],
      "concepts": [
        { 
          "name": "Main Concept", 
          "related": ["Prerequisite Concept", "Sub-component", "Real-world Example"] 
        }
      ],
      "quiz": [
        { 
          "question": "Scenario-based or conceptual question?", 
          "answer": "Correct answer with a *concise* explanation of WHY it is correct.", 
          "topic": "Topic tag",
          "type": "Conceptual"
        }
      ]
    }

    **Instructions:**
    - Generate exactly ${quizCount} quiz questions.
    - Diversity: 30% Fact Recall, 40% Conceptual, 30% Application/Scenario.
    - Adjust difficulty to '${difficulty}'.
    
    **Constraint:** Return ONLY the raw JSON. No markdown formatting (no \`\`\`json wrappers).
  `;

  try {
    const response = await executeGeminiRequest({
      contents: [{ parts: [{ text: systemPrompt }] }],
      tools: [{ google_search: {} }]
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];

    if (!candidate) throw new Error("No response generated.");

    const parts = candidate.content?.parts || [];
    let textResponse = parts
      .filter(p => p.text)
      .map(p => p.text)
      .join('');

    // Clean markdown formatting
    textResponse = textResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();

    if (!textResponse) {
      console.error("AI Search returned no text. Candidate:", JSON.stringify(candidate, null, 2));
      throw new Error("AI Search returned empty text response.");
    }

    try {
      return JSON.parse(textResponse);
    } catch (parseError) {
      console.error("JSON Parsing Error (Search):", parseError, textResponse);
      return {
        summary: "Error parsing AI response.",
        topics: [],
        concepts: [],
        quiz: []
      };
    }

  } catch (error) {
    console.error("AI Search Generation Error:", error);
    return null;
  }
}

/**
 * Low-level function to call Gemini API directly.
 * Useful for intermediate processing steps.
 * 
 * @param {string} systemPrompt 
 * @param {string} userPrompt 
 * @param {object} fileData - Optional { mimeType, data (base64) }
 * @returns {Promise<string>} Raw text response
 */
export async function callGemini(systemPrompt, userPrompt, fileData = null) {
  // executeGeminiRequest handles API Key check internally

  const parts = [{ text: systemPrompt }];

  // Standard flow: inline file data (for images/PDFs/etc)
  if (fileData) {
    parts.push({
      inlineData: {
        mimeType: fileData.mimeType,
        data: fileData.data
      }
    });
  }

  // Always include the user prompt text
  parts.push({ text: userPrompt });

  try {
    const response = await executeGeminiRequest({
      contents: [{ parts: parts }]
      // No tools needed since we provided the transcript!
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  } catch (error) {
    console.error("Gemini Call Failed:", error);
    throw error;
  }
}

/**
 * Sends a chat message to the AI, maintaining context of the study material.
 * 
 * @param {Array} history - Array of { role: 'user' | 'model', parts: [{ text: string }] }
 * @param {string} newMessage - The user's new question
 * @param {Object} context - { pdfBase64, extractedText, notes } to provide context
 */
export async function sendChatMessage(history, newMessage, context) {
  // executeGeminiRequest handles API Key check internally

  // 1. Build the system instruction / context
  let contextPrompt = "You are a helpful study tutor. Answer questions based on the provided study material.";

  // [Enhanced Context Logic]
  // Prioritize structured 'processedContent' if available (from Daksh's service)
  // This allows the AI to see the structure of the document better (chunks, metadata)

  const historyParts = [];

  // 1. Handle Multi-PDF Context (Base64)
  if (context.processedContent && context.processedContent.sourceType === 'multiple-pdf' && context.processedContent.fileData) {
    contextPrompt += "\n\n[System] The user has uploaded multiple PDF documents. Use the visual/text data provided below to answer questions.";

    // Add each PDF as inlineData to the *history* (simulating previous turn or system context)
    // Gemeni Chat API expects history to be { role, parts }. We can prepend a 'user' message with the files.

    const fileParts = context.processedContent.fileData.map(file => ({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    }));

    // We'll attach these files to the *latest* message or a system message equivalent
    // Ideally, we add them to the very first message of the conversation, or a new 'user' message just before the question.
    // For simplicity and effectiveness, let's prepend a "Here are the files" message if it's the start, 
    // OR just attach them to the current request if the API supports it.
    // simpler approach: modify the `newMessage` payload to include the images? No, `sendMessage` takes string usually.
    // We need to construct the `contents` array manually.

  }

  // 2. Handle Text Context
  else if (context.processedContent && context.processedContent.text) {
    const { text, metadata } = context.processedContent;
    const title = metadata?.title ? `Title: ${metadata.title}\n` : '';
    // We limit context to ~30k chars to stay safe within Flash Lite limits
    contextPrompt += `\n\nStudy Material Context:\n${title}${text.substring(0, 40000)}...`;
  }
  // Fallback to legacy fields
  else if (context.extractedText) {
    contextPrompt += `\n\nStudy Material Context:\n${context.extractedText.substring(0, 30000)}...`;
  } else if (context.notes) {
    contextPrompt += `\n\nNotes Context:\n${context.notes}`;
  }

  // 2. Format history for Gemini API (user/model roles)
  const formattedHistory = history.map(msg => ({
    role: msg.role === 'ai' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  try {
    const payload = {
      contents: [
        ...formattedHistory
      ]
    };

    // Construct the user message part with context overlap
    const userMessageParts = [];

    // [NEW] If we have image data in context, include it!
    if (context.processedContent && context.processedContent.imageData) {
      context.processedContent.imageData.forEach(img => {
        userMessageParts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data
          }
        });
      });
      contextPrompt += "\n\n[Context: The user has uploaded images/slides. Refer to them.]";
    }

    // [NEW] If we have Multi-PDF data in context, include it!
    if (context.processedContent && context.processedContent.sourceType === 'multiple-pdf' && context.processedContent.fileData) {
      context.processedContent.fileData.forEach(file => {
        userMessageParts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: file.data
          }
        });
      });
      contextPrompt += "\n\n[Context: The user has uploaded multiple PDF documents. Refer to them for answers.]";
    }

    userMessageParts.push({ text: `${contextPrompt}\n\nStudent Question: ${newMessage}` });

    payload.contents.push({ role: 'user', parts: userMessageParts });

    const response = await executeGeminiRequest(payload);
    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate an answer.";

    return answer;

  } catch (error) {
    console.error("Chat Error:", error);
    return "Sorry, I'm having trouble connecting to the tutor right now.";
  }
}

/**
 * Generates a structured study schedule based on material and time constraints.
 * 
 * @param {string} content - The study material (summary or full text)
 * @param {string} days - Number of days until deadline
 * @param {string} hoursPerDay - Hours available per day
 */
export async function generateSchedule(content, days, hoursPerDay) {
  // executeGeminiRequest handles API Key check internally

  const systemPrompt = `
    You are an expert Study Planner.
    Create a ${days}-day study schedule (assuming ${hoursPerDay} hours/day) for the provided material.
    
    Format the output as a valid JSON object:
    {
      "schedule": [
        {
          "day": 1,
          "focus": "Topic Summary",
          "tasks": [
            { "time": "30 mins", "activity": "Read Section X" },
            { "time": "15 mins", "activity": "Quiz" }
          ]
        }
      ]
    }
  `;

  try {
    // Safe content handling: if object, stringify; else use as string
    const safeContent = typeof content === 'object' && content !== null
      ? JSON.stringify(content)
      : String(content || '');

    const response = await executeGeminiRequest({
      contents: [{
        parts: [
          { text: systemPrompt },
          { text: `Material to cover:\n${safeContent.substring(0, 5000)}...` } // Send summary/intro to save tokens
        ]
      }]
    });

    const data = await response.json();
    let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    textResponse = textResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");

    return JSON.parse(textResponse);
  } catch (error) {
    console.error("Schedule Error:", error);
    return null;
  }
}
// End of file
