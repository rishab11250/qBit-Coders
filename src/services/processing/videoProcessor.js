import { callGemini } from '../aiService';

/**
 * Simulates video processing by asking Gemini to analyze the URL and return a transcript.
 * @param {string} url - YouTube URL.
 * @returns {Promise<{text: string, chunks: Array}>}
 */
export const processVideo = async (url) => {
    try {
        const systemPrompt = `
        You are a video analysis engine.
        Your task is to generate a time-stamped transcript and topic breakdown for the provided YouTube Video URL.
        
        Strictly return the output in this JSON format:
        {
          "title": "Video Title",
          "chunks": [
            { "timestamp": "00:00", "topic": "Intro", "content": "Summary of what is said..." },
            { "timestamp": "02:30", "topic": "Main Concept", "content": "Deep dive into..." }
          ]
        }
        `;

        const userPrompt = `Analyze this video: ${url}`;

        const rawResponse = await callGemini(systemPrompt, userPrompt);

        // Clean JSON
        const jsonStr = rawResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        const data = JSON.parse(jsonStr);

        // Convert to linear text for the main AI to use later
        const linearText = data.chunks.map(c => `[${c.timestamp}] ${c.topic}: ${c.content}`).join('\n\n');

        return {
            text: linearText,
            metadata: { title: data.title, url },
            chunks: data.chunks
        };

    } catch (error) {
        console.error("Video Processing Error:", error);
        throw new Error("Failed to process video. Ensure the video has captions or is popular enough for the AI to know.");
    }
};
