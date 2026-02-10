// GoogleGenerativeAI import removed as we use fetch
import useStudyStore from '../store/useStudyStore';

const BASE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/** Reads current settings from the Zustand store */
const getSettings = () => useStudyStore.getState().settings;

/** Builds the API URL dynamically based on the selected model */
const getApiUrl = () => {
  const model = getSettings().model || 'gemini-2.5-flash-lite';
  return `${BASE_API_URL}/${model}:generateContent`;
};

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
  const { difficulty, quizCount } = getSettings();

  const systemPrompt = `
    You are an expert AI Study Coach and Curriculum Designer.
    Your goal is to process the provided study material into a structured mastery plan.

    **Configuration:**
    - Difficulty Level: ${difficulty} (Adjust vocabulary and concept depth accordingly)
    - Quiz Question Count: ${quizCount}

    **Required Output Format (JSON ONLY):**
    {
      "summary": "High-level executive summary (3-4 sentences). Then, a bulleted list of 5-7 key takeaways.",
      "topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"],
      "concepts": [
        { 
          "name": "Main Concept", 
          "related": ["Sub-concept 1", "Sub-concept 2", "Application A"] 
        }
      ],
      "quiz": [
        { 
          "question": "Clear, specific question?", 
          "answer": "Correct answer with brief explanation why.", 
          "topic": "Topic tag" 
        }
      ]
    }

    **Instructions for Quality:**
    1. **Summary:** Do not just regurgitate. Synthesize the "Big Idea" first, then break down the details.
    2. **Concept Graph:** Focus on relationships. "Related" terms should be sub-components, examples, or prerequisites of the "Main Concept". Avoid generic terms like "Definition" or "Importance".
    3. **Quiz:** 
       - Generate exactly ${quizCount} questions.
       - Questions must strictly match the '${difficulty}' level.
       - ${difficulty === 'Hard' ? 'Focus on application, analysis, and edge cases.' : difficulty === 'Medium' ? 'Mix conceptual understanding with basic application.' : 'Focus on definitions and basic recall.'}
       - VARY the topics. Do not ask 5 questions about the same paragraph.

    **Constraint:** Return ONLY the raw JSON. No markdown formatting (no \`\`\`json wrappers).
  `;

  // Construct payload
  const parts = [{ text: systemPrompt }];

  if (inputType === 'text') {
    parts.push({ text: `Analyze this study material:\n\n${content}` });
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
    const response = await fetch(`${getApiUrl()}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: parts }]
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errText}`);
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
 * Low-level function to call Gemini API directly.
 * Useful for intermediate processing steps (like video transcription or OCR).
 * 
 * @param {string} systemPrompt 
 * @param {string} userPrompt 
 * @param {object} fileData - Optional { mimeType, data (base64) }
 * @returns {Promise<string>} Raw text response
 */
export async function callGemini(systemPrompt, userPrompt, fileData = null) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key Missing");

  const parts = [{ text: systemPrompt }];

  if (fileData) {
    parts.push({
      inlineData: {
        mimeType: fileData.mimeType,
        data: fileData.data
      }
    });
  }

  parts.push({ text: userPrompt });

  try {
    const response = await fetch(`${getApiUrl()}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: parts }]
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
    }

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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  // 1. Build the system instruction / context
  let contextPrompt = "You are a helpful study tutor. Answer questions based on the provided study material.";

  if (context.extractedText) {
    contextPrompt += `\n\nStudy Material Context:\n${context.extractedText.substring(0, 30000)}...`; // Limit context size
  } else if (context.notes) {
    contextPrompt += `\n\nNotes Context:\n${context.notes}`;
  }

  // 2. Format history for Gemini API (user/model roles)
  // The store uses 'ai', Gemini uses 'model'. We map it here.
  const formattedHistory = history.map(msg => ({
    role: msg.role === 'ai' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // 3. Add the initial context as a system instruction (or just the first user message for Flash model)
  // Gemini 1.5 Flash supports system instructions, but for simplicity/robustness with older keys,
  // we can prepend it to the first message or send it as a separate block.
  // For chat, it's best to start a session.

  try {
    const payload = {
      contents: [
        ...formattedHistory,
        { role: 'user', parts: [{ text: `${contextPrompt}\n\nStudent Question: ${newMessage}` }] }
      ]
    };

    // If there is a PDF, we might need to send it again if it's not "cached" in the chat session.
    // But Gemini 1.5 is stateless via REST unless using the specialized ChatSession object.
    // To keep it simple for this "Logic Domain" task:
    // We attach the PDF data to the LATEST message if it's the FIRST message, or relies on text context.
    // Optimization: For now, we rely on the text context extracted earlier. 
    // If we want full PDF chat, we'd need to re-send the inlineData every time or use the File API.
    // Let's stick to text context for the "Logic MVP" as requested.

    const response = await fetch(`${getApiUrl()}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Chat Loop Failed");

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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

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
    const response = await fetch(`${getApiUrl()}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: systemPrompt },
            { text: `Material to cover:\n${content.substring(0, 5000)}...` } // Send summary/intro to save tokens
          ]
        }]
      }),
    });

    if (!response.ok) throw new Error("Schedule Gen Failed");

    const data = await response.json();
    let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    textResponse = textResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");

    return JSON.parse(textResponse);
  } catch (error) {
    console.error("Schedule Error:", error);
    return null;
  }
}
