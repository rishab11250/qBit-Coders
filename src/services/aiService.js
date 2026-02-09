
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

/**
 * Generates study content from the provided text using Gemini API.
 * @param {string} text - The input text to generate content from.
 * @returns {Promise<{summary: string, topics: string[], quiz: {question: string, answer: string}[]}>}
 */
export async function generateStudyContent(text) {
  let apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    apiKey = prompt("Please enter your Gemini API Key:");
    if (!apiKey) {
      throw new Error("API Key is required to generate study content.");
    }
  }

  const promptText = `
    Analyze the following text and generate study material in strict JSON format.
    The JSON should have this exact structure:
    {
      "summary": "A concise summary of the text",
      "topics": ["Key topic 1", "Key topic 2", ...],
      "quiz": [
        { "question": "Question 1?", "answer": "Answer 1" },
        { "question": "Question 2?", "answer": "Answer 2" },
        { "question": "Question 3?", "answer": "Answer 3" },
        { "question": "Question 4?", "answer": "Answer 4" },
        { "question": "Question 5?", "answer": "Answer 5" }
      ]
    }
    
    Do not include markdown code blocks (like \`\`\`json). Just return the raw JSON string.

    Text to analyze:
    "${text}"
  `;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptText }],
          },
        ],
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    
    if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts.length) {
        throw new Error("No content generated from Gemini API.");
    }

    const textResponse = candidate.content.parts[0].text;
    
    // Clean up potential markdown formatting if the model disregards instructions
    const cleanJson = textResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");

    try {
        return JSON.parse(cleanJson);
    } catch (parseError) {
        console.error("Failed to parse JSON response:", textResponse);
        throw new Error("Failed to parse AI response as JSON.");
    }

  } catch (error) {
    console.error("Error generating study content:", error);
    throw error;
  }
}
