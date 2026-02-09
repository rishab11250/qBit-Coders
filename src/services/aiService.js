// GoogleGenerativeAI import removed as we use fetch

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Helper: Encodes a File object to a Base64 string for the API.
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
 * @param {string} inputType - 'text' | 'pdf' | 'image'
 * @param {string} content - The raw text or Base64 string
 * @param {string} mimeType - (Optional) The mime type for files
 */
export async function generateStudyContent(inputType, content, mimeType = 'application/pdf') {
  let apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("API Key is missing. Set VITE_GEMINI_API_KEY in .env");
    return null;
  }

  // 1. Strict System Prompt to enforce the JSON structure required by your UI
  const systemPrompt = `
    You are an advanced AI Tutor. Analyze the provided content (text or document) and extract structured study data.
    
    RETURN ONLY RAW JSON. NO MARKDOWN. NO \`\`\`json WRAPPERS.
    
    The JSON must match this structure exactly:
    {
      "summary": "A concise 3-5 sentence executive summary of the material.",
      "topics": ["Key Topic 1", "Key Topic 2", "Key Topic 3", "Key Topic 4", "Key Topic 5"],
      "concepts": [
        { 
          "name": "Core Concept Name", 
          "related": ["Related Sub-concept A", "Related Sub-concept B"] 
        },
        { 
          "name": "Secondary Concept Name", 
          "related": ["Related Term X", "Related Term Y"] 
        }
      ],
      "quiz": [
        { 
          "question": "A challenging conceptual question?", 
          "answer": "The correct answer with a brief explanation.",
          "topic": "The specific topic this question relates to (must match one of the topics list)"
        },
        { 
          "question": "Question 2?", 
          "answer": "Answer...",
          "topic": "Topic..."
        },
        { 
          "question": "Question 3?", 
          "answer": "Answer...",
          "topic": "Topic..."
        },
        { 
          "question": "Question 4?", 
          "answer": "Answer...",
          "topic": "Topic..."
        },
        { 
          "question": "Question 5?", 
          "answer": "Answer...",
          "topic": "Topic..."
        }
      ]
    }
  `;

  // 2. Construct the payload based on input type
  const parts = [{ text: systemPrompt }];

  if (inputType === 'text') {
    parts.push({ text: `Analyze this study material:\n\n${content}` });
  } else if (inputType === 'pdf' || inputType === 'image') {
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: content // This is the Base64 string
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

    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

    const data = await response.json();
    const candidate = data.candidates?.[0];

    if (!candidate) throw new Error("No response generated.");

    let textResponse = candidate.content.parts[0].text;

    // 3. Clean markdown formatting if the model disregards instructions
    textResponse = textResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");

    return JSON.parse(textResponse);

  } catch (error) {
    console.error("AI Generation Error:", error);
    alert("Failed to generate content. Check console for details.");
    return null;
  }
}
