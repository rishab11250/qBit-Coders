import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

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
