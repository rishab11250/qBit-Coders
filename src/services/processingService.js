import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { callGemini } from './aiService'; // [NEW] Import for YouTube processing

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Main entry point for processing study materials.
 * 
 * @param {File|string} input - The file or text content to process
 * @returns {Promise<{ sourceType: string, rawText: string, chunks: string[] }>}
 */
export async function processInput(input) {
    try {
        let sourceType = 'text';
        let rawText = '';
        let chunks = [];
        let metadata = {};

        // 1. Determine input type and extract raw text
        if (input instanceof File) {
            if (input.type === 'application/pdf') {
                sourceType = 'pdf';
                // [CHANGED] optimized page-by-page processing
                const result = await extractTextFromPDF(input);
                rawText = result.rawText;
                chunks = result.chunks;

                // Calculate metadata
                const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;
                const estimatedStudyTimeMinutes = Math.ceil(wordCount / 200);
                const chunkCount = chunks.length;

                metadata = { wordCount, estimatedStudyTimeMinutes, chunkCount };
                console.log("📊 Metadata:", metadata);

                // Return early since we already have chunks and cleaned text
                return {
                    sourceType,
                    rawText,
                    chunks,
                    metadata
                };
            } else {
                sourceType = 'text';
                rawText = await input.text();
            }
        } else if (typeof input === 'string') {
            // Check for YouTube URL
            if (input.includes('youtube.com') || input.includes('youtu.be')) {
                console.log("🎥 Processing YouTube transcript...");
                // [Enhanced Prompt for Long Videos & Error Handling]
                const systemPrompt = `
You are an expert Video Analyzer and Transcriber. 
Your goal is to extract a highly structured educational summary from this video.

**CRITICAL INSTRUCTION FOR LONG VIDEOS (>1 HOUR):**
If the video is a "Full Course" or >1 hour, **DO NOT** just summarize the first 10 minutes.
Instead, provide a **SYLLABUS** style overview of the ENTIRE video content.
List the major modules/chapters in order (e.g. Intro -> Concepts -> Advanced -> Conclusion).

**CRITICAL CONSTRAINT - INCOMPLETE CONTENT:**
If you cannot access or process the FULL content of the video (e.g., if you only see the first few minutes), respond immediately with: "ERROR: INCOMPLETE_CONTENT".
Do NOT try to fake a summary.

**ERROR HANDLING:**
- If captions/subtitles are unavailable/missing, respond with: "ERROR: NO_CAPTIONS"
- If the video is private or inaccessible, respond with: "ERROR: ACCESS_DENIED"

**Output Format (if successful):**
1. **Executive Summary** (2-3 sentences)
2. **Key Concepts** (List of 5-7 core topics discussed)
3. **Structured Transcript/Chapters**:
   - [00:00 - Intro] ...
   - [Middle Section] ...
   - [Conclusion] ...

Focus on capturing *definitions*, *causal relationships*, and *examples*.
`;
                const userPrompt = `Analyze this video URL: ${input}`;

                rawText = await callGemini(systemPrompt, userPrompt);

                // [Validation: Deterministic & Strict] - Validates ONLY the returned transcript text.

                // 1. Check for explicit error codes from the AI prompt logic
                const errorMap = {
                    "ERROR: INCOMPLETE_CONTENT": "Video is too long to process fully. Please try a shorter video or paste the transcript.",
                    "ERROR: NO_CAPTIONS": "This video has no captions/subtitles, which are required for analysis.",
                    "ERROR: ACCESS_DENIED": "Unable to access this video. It might be private or region-locked."
                };

                for (const [key, msg] of Object.entries(errorMap)) {
                    if (rawText.includes(key)) {
                        throw new Error(msg);
                    }
                }

                // 2. Check for generic failure phrases (Case-insensitive)
                const failurePhrases = [
                    "cannot access",
                    "unable to access",
                    "text-based ai",
                    "don't have access",
                    "no transcript",
                    "no subtitles",
                    "caption unavailable"
                ];

                if (failurePhrases.some(phrase => rawText.toLowerCase().includes(phrase))) {
                    throw new Error("Unable to process video: Transcript unavailable or access restricted.");
                }

                // 3. Strict Length Check (must be substantially descriptive)
                if (!rawText || rawText.length < 100) {
                    throw new Error("Transcript too short or unavailable. Please try a different video.");
                }

                console.log("🎥 Transcript validated successfully");

                sourceType = 'video';
            } else {
                sourceType = 'text';
                rawText = input;
            }
        } else {
            throw new Error("Unsupported input type");
        }

        // 2. Clean and Normalize (for non-PDF inputs)
        const cleanedText = cleanText(rawText);

        // 3. Chunk (for non-PDF inputs)
        chunks = chunkText(cleanedText);

        // Calculate metadata
        const wordCount = cleanedText.trim() ? cleanedText.trim().split(/\s+/).length : 0;
        const estimatedStudyTimeMinutes = Math.ceil(wordCount / 200);
        const chunkCount = chunks.length;

        metadata = { wordCount, estimatedStudyTimeMinutes, chunkCount };
        console.log("📊 Metadata:", metadata);

        return {
            sourceType,
            rawText: cleanedText,
            chunks,
            metadata
        };

    } catch (error) {
        console.error("ProcessingService Error:", error);
        throw error; // Re-throw for UI handling
    }
}

/**
 * Extracts text from a PDF file using pdfjs-dist.
 * Optimized to chunk page-by-page to prevent UI freezing.
 * @param {File} file 
 * @returns {Promise<{rawText: string, chunks: string[]}>}
 */
async function extractTextFromPDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';
        const allChunks = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Join items with space
            const pageText = textContent.items.map(item => item.str).join(' ');

            // [NEW] Process this page immediately
            // 1. Clean
            const cleanedPage = cleanText(pageText);

            // 2. Chunk (if page has content)
            if (cleanedPage.length > 0) {
                const pageChunks = chunkText(cleanedPage);
                allChunks.push(...pageChunks);

                // 3. Accumulate full text (optional, but good for reference)
                fullText += cleanedPage + '\n\n';
            }
        }

        return {
            rawText: fullText,
            chunks: allChunks
        };
    } catch (error) {
        console.error("PDF Extraction Internal Error:", error);
        throw new Error("Failed to parse PDF content.");
    }
}

/**
 * Cleans and normalizes raw text.
 * @param {string} text 
 * @returns {string}
 */
function cleanText(text) {
    if (!text) return '';
    return text
        .replace(/\s+/g, ' ') // Collapse multiple whitespace to single space
        .trim();              // Remove leading/trailing whitespace
}

/**
 * Splits text into overlapping chunks.
 * @param {string} text 
 * @param {number} chunkSize 
 * @param {number} overlap 
 * @returns {string[]}
 */
function chunkText(text, chunkSize = 1200, overlap = 200) {
    if (!text) return [];

    // Safety check for parameters
    if (chunkSize <= 0) chunkSize = 1200;
    if (overlap >= chunkSize) overlap = chunkSize - 1;
    if (overlap < 0) overlap = 0;

    if (text.length <= chunkSize) return [text];

    const chunks = [];
    let startIndex = 0;

    while (startIndex < text.length) {
        let endIndex = startIndex + chunkSize;

        // Ensure we don't cut words in half if possible (look for space)
        if (endIndex < text.length) {
            // Look for the last space within the limit to break cleanly
            const lastSpace = text.lastIndexOf(' ', endIndex);
            if (lastSpace > startIndex) {
                endIndex = lastSpace;
            }
        }

        const chunk = text.slice(startIndex, endIndex).trim();
        if (chunk) chunks.push(chunk);

        // Move forward, subtracting overlap
        startIndex = endIndex - overlap;

        // Prevent infinite loop if overlap >= chunk size (shouldn't happen with defaults)
        if (startIndex >= endIndex) startIndex = endIndex;
    }

    return chunks;
}

// Development ready check
if (import.meta.env.DEV) {
    console.log("ProcessingService ready");
}
