// GoogleGenerativeAI import removed as we use fetch

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

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
  const systemPrompt = `
    You are an AI Study Coach.
    From the given content:
    - Generate short structured notes (5–8 points)
    - Extract key topics (array)
    - Identify core concepts and their related terms (for concept map)
    - Generate 5 quiz questions with answers.
    
    Return ONLY valid JSON in this format:
    {
      "summary": "Concise summary of the material",
      "topics": ["Topic 1", "Topic 2", "Topic 3"],
      "concepts": [
        { "name": "Concept Name", "related": ["Related 1", "Related 2"] }
      ],
      "quiz": [
        { "question": "Question?", "answer": "Answer", "topic": "Related Topic" }
      ]
    }
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
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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
