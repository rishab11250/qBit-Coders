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
 * Removed slow models: gemini-2.5-pro (thinking model)
 */
const FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-flash'];

/** Builds the API URL dynamically based on the selected model */
const getApiUrl = (model = null, stream = false) => {
  const selectedModel = model || getSettings().model || 'gemini-2.0-flash';
  const action = stream ? 'streamGenerateContent' : 'generateContent';
  return `${BASE_API_URL}/${selectedModel}:${action}`;
};

/**
 * Executes a Gemini API request with:
 * 1. API Key rotation (tries all keys before giving up)
 * 2. Model fallback on 429 errors
 */
async function executeGeminiRequest(payload, stream = false) {
  if (API_KEYS.length === 0) throw new Error("No API Keys configured.");

  const preferredModel = getSettings().model || 'gemini-2.0-flash';

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
        const baseUrl = getApiUrl(model, stream);
        const url = `${baseUrl}?key=${apiKey}${stream ? '&alt=sse' : ''}`;

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

  const { difficulty } = getSettings();

  const systemPrompt = `You are an expert AI Study Coach. Process the study material into a structured study plan.

Difficulty: ${difficulty}

Return JSON ONLY (no markdown wrappers):
{
  "summary": "2-sentence simple explanation + 3-4 bullet Executive Brief",
  "topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"],
  "concepts": [{"name": "Concept", "related": ["Related1", "Related2"]}],
  "detailed_notes": [{"topic": "Topic", "content": "Markdown notes", "key_points": ["Point1"], "real_world_example": "Example"}]
}

Keep summary concise. For concepts, focus on structural relationships. For detailed_notes, be thorough but efficient.
Return ONLY raw JSON.`;

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
    parts.push({ text: `Analyze this document and create a comprehensive study plan.` });
  }

  // Debug payload
  // console.log("Gemini Payload:", JSON.stringify(parts, null, 2));

  try {
    const response = await executeGeminiRequest({
      contents: [{ parts }]
    });

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) throw new Error("Empty response from AI");

    const cleanedJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedJson);

  } catch (error) {
    console.error("AI Generation Error:", error);
    // Fallback Mock Data
    return {
      summary: "Error generating content. Please try again.",
      topics: [],
      concepts: [],
      detailed_notes: []
    };
  }
}

/**
 * Generates quiz ON-DEMAND when user clicks "Start Quiz".
 * Accepts weak areas to focus on after the user has taken 1-2 quizzes.
 * 
 * @param {string} summary - The study plan summary
 * @param {string[]} topics - The study plan topics
 * @param {number} questionCount - Number of questions to generate (5/10/15/20)
 * @param {string[]} weakAreas - Topics the user is weak in (from previous quizzes)
 */
export async function generateQuizOnly(summary, topics, questionCount = 10, weakAreas = []) {
  const { difficulty } = getSettings();

  const weakAreaInstruction = weakAreas.length > 0
    ? `\n    **IMPORTANT - Weak Area Focus:**
    The student has previously struggled with these topics: ${weakAreas.join(', ')}.
    Dedicate ~50% of your questions to these weak areas to help them improve.
    The remaining questions should cover other topics for balanced learning.`
    : '';

  const systemPrompt = `
    You are an expert Examiner.
    Generate a challenging and comprehensive quiz based on the provided summary and topics.

    **Configuration:**
    - Difficulty: ${difficulty}
    - Question Count: ${questionCount}
    ${weakAreaInstruction}

    **Required Output Format (JSON ONLY):**
    {
      "quiz": [
        { 
          "question": "Scenario-based or conceptual question?", 
          "answer": "Correct answer with a *concise* explanation.", 
          "topic": "Topic tag",
          "type": "Conceptual"
        }
      ]
    }

    **Instructions:**
    - YOU MUST generate EXACTLY ${questionCount} questions. Not ${questionCount - 1}, not ${questionCount + 1}. EXACTLY ${questionCount}.
    - **DIVERSITY**:
      - 30% Fact Recall
      - 40% Conceptual
      - 30% Application
    - **Avoid** simple definitions. Test deep understanding.

    **Constraint:** Return ONLY the raw JSON. No markdown formatting.
  `;

  const userPrompt = `
    **Context:**
    Summary: ${summary}
    Topics: ${topics.join(', ')}

    Generate EXACTLY ${questionCount} quiz questions now.
  `;

  const parts = [
    { text: systemPrompt },
    { text: userPrompt }
  ];

  try {
    const response = await executeGeminiRequest({
      contents: [{ parts }]
    });

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) throw new Error("Empty response from AI");

    const cleanedJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedJson);

    // Ensure we have the exact number of questions
    if (parsed.quiz && parsed.quiz.length < questionCount) {
      console.warn(`AI returned ${parsed.quiz.length}/${questionCount} questions. Padding with duplicates.`);
      // Duplicate existing questions to fill the gap
      while (parsed.quiz.length < questionCount && parsed.quiz.length > 0) {
        const randomQ = parsed.quiz[Math.floor(Math.random() * parsed.quiz.length)];
        parsed.quiz.push({ ...randomQ });
      }
    }

    // Trim if AI gave too many
    if (parsed.quiz && parsed.quiz.length > questionCount) {
      parsed.quiz = parsed.quiz.slice(0, questionCount);
    }

    return parsed;

  } catch (error) {
    console.error("Quiz Generation Error:", error);
    return { quiz: [] };
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

/**
 * Streams a chat message response from the AI.
 */
export async function streamChatMessage(history, newMessage, context, onUpdate) {
  // 1. Build the system instruction / context (Reuse logic)
  let contextPrompt = "You are a helpful study tutor. Answer questions based on the provided study material.";

  // [Enhanced Context Logic]
  const historyParts = [];

  // Handle Text/File Context (Same logic as sendChatMessage)
  if (context.processedContent && context.processedContent.sourceType === 'multiple-pdf' && context.processedContent.fileData) {
    contextPrompt += "\n\n[System] The user has uploaded multiple PDF documents. Use the visual/text data provided below to answer questions.";
  }
  else if (context.processedContent && context.processedContent.text) {
    const { text, metadata } = context.processedContent;
    const title = metadata?.title ? `Title: ${metadata.title}\n` : '';
    contextPrompt += `\n\nStudy Material Context:\n${title}${text.substring(0, 40000)}...`;
  }
  // Fallback
  else if (context.extractedText) {
    contextPrompt += `\n\nStudy Material Context:\n${context.extractedText.substring(0, 30000)}...`;
  } else if (context.notes) {
    contextPrompt += `\n\nNotes Context:\n${context.notes}`;
  }

  // 2. Format history
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

    const userMessageParts = [];

    // [NEW] Image/PDF Data injection (Same logic as sendChatMessage)
    if (context.processedContent && context.processedContent.imageData) {
      context.processedContent.imageData.forEach(img => {
        userMessageParts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
      });
      contextPrompt += "\n\n[Context: User uploaded images. Refer to them.]";
    }
    if (context.processedContent && context.processedContent.sourceType === 'multiple-pdf' && context.processedContent.fileData) {
      context.processedContent.fileData.forEach(file => {
        userMessageParts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
      });
    }

    userMessageParts.push({ text: `${contextPrompt}\n\nStudent Question: ${newMessage}` });
    payload.contents.push({ role: 'user', parts: userMessageParts });

    // 3. Execute Streaming Request
    const response = await executeGeminiRequest(payload, true);

    // 4. Read the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulatedText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line

      for (const line of lines) {
        if (line.trim().startsWith('data: ')) {
          const jsonStr = line.trim().slice(6);
          if (jsonStr === '[DONE]') continue;

          try {
            const data = JSON.parse(jsonStr);
            const chunk = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (chunk) {
              accumulatedText += chunk;
              onUpdate(accumulatedText);
            }
          } catch (e) {
            // Check if it's a "UsageMetadata" chunk or keep-alive
          }
        }
      }
    }

    return accumulatedText;

  } catch (error) {
    console.error("Streaming Chat Error:", error);
    onUpdate("Sorry, I encountered an error. Please try again.");
    return "Error";
  }
}


/**
 * Sends a chat message to the AI, maintaining context of the study material.
 * (Legacy non-streaming version - kept for backward compatibility)
 */
export async function sendChatMessage(history, newMessage, context) {
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

// Cache for health check results (timestamp of last check)
let lastHealthCheckTime = 0;
const HEALTH_CHECK_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Proactive Health Check: Tests all models with all API keys to pre-identify rate limits.
 * This runs in the background when the app loads to optimize the first user request.
 * 
 * Strategy:
 * 1. For each model, try a minimal request with each API key
 * 2. Mark models as 'available' or 'limited' in the store
 * 3. If a model is rate-limited, extract the Retry-After time
 * 4. Cache results for 5 minutes to avoid redundant checks on page refresh
 * 
 * Benefits:
 * - Faster first request (no wasted attempts on rate-limited models)
 * - Better model auto-selection
 * - Improved UX with visual feedback in ModelSelector
 * - Smart caching saves tokens on frequent page refreshes
 */
export async function runHealthCheck() {
  if (API_KEYS.length === 0) {
    console.warn('⚠️ Health Check skipped: No API keys configured');
    return;
  }

  // Smart caching: Skip if we checked recently (within 5 minutes)
  const now = Date.now();
  if (now - lastHealthCheckTime < HEALTH_CHECK_CACHE_DURATION) {
    console.log('⚡ Health check skipped: Recent check still valid');
    return;
  }

  const MODELS_TO_CHECK = ['gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-flash'];

  console.log('🔍 Running background health check on models and API keys...');
  lastHealthCheckTime = now; // Update cache timestamp

  // Test each model with a lightweight request
  for (const model of MODELS_TO_CHECK) {
    let modelAvailable = false;
    let retryAfterMs = 0;

    // Try each API key for this model until we find one that works
    for (let i = 0; i < API_KEYS.length && !modelAvailable; i++) {
      const apiKey = API_KEYS[i];
      const url = `${BASE_API_URL}/${model}:generateContent?key=${apiKey}`;

      try {
        // Minimal test payload (just 3 words to minimize token usage)
        const testPayload = {
          contents: [{
            parts: [{ text: "Say hi" }]
          }]
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload),
          signal: AbortSignal.timeout(5000) // 5s timeout
        });

        if (response.ok) {
          // Success! This model+key combo works
          modelAvailable = true;
          useStudyStore.getState().updateModelStatus(model, 'available');
          console.log(`✅ ${model} - Available (Key #${i + 1})`);
          break;
        } else if (response.status === 429 || response.status === 503) {
          // Rate limited
          const retryAfter = response.headers.get('Retry-After');
          retryAfterMs = Math.max(retryAfterMs, retryAfter ? parseInt(retryAfter) * 1000 : 60000);
          console.log(`⏳ ${model} - Rate limited on Key #${i + 1}`);
        } else {
          // Other error (invalid key, model not found, etc.)
          console.warn(`⚠️ ${model} - Error ${response.status} on Key #${i + 1}`);
        }
      } catch (error) {
        // Network error or timeout
        console.warn(`⚠️ ${model} - Failed on Key #${i + 1}:`, error.message);
      }
    }

    // If all keys failed for this model, mark it as limited
    if (!modelAvailable) {
      useStudyStore.getState().updateModelStatus(model, 'limited', retryAfterMs);
      console.log(`❌ ${model} - All keys rate-limited (retry in ${retryAfterMs / 1000}s)`);
    }
  }

  console.log('✅ Health check complete');
}

// End of file
