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
                // [Validation: Strict URL Check]
                const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/;
                if (!youtubeRegex.test(input)) {
                    throw new Error("Invalid YouTube URL format. Please use a standard video link.");
                }
                console.log("🎥 Valid YouTube URL detected");

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

        // [NEW] Concept Extraction
        const concepts = extractConcepts(cleanedText);
        console.log("🧠 Concepts extracted:", concepts);

        return {
            sourceType,
            rawText: cleanedText,
            chunks,
            metadata,
            concepts
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
 * Semantic Chunking: Splits text by logical sections first, then by size.
 * @param {string} text 
 * @param {number} chunkSize 
 * @param {number} overlap 
 * @returns {string[]}
 */
function chunkText(text, chunkSize = 1200, overlap = 200) {
    if (!text) return [];

    console.log("🧠 Semantic chunking enabled");

    // Safety check for parameters
    if (chunkSize <= 0) chunkSize = 1200;
    if (overlap >= chunkSize) overlap = chunkSize - 1;
    if (overlap < 0) overlap = 0;

    if (text.length <= chunkSize) return [text];

    const chunks = [];

    // 1. Split by logical boundaries (Headings, Timestamps, Double Newlines)
    // Regex matches:
    // - \n\n+ (Paragraph breaks)
    // - ^#{1,3}\s (Headings)
    // - \d{1,2}:\d{2} (Timestamps like 00:00)
    // - "Chapter" or "Section" case insensitive
    const sectionRegex = /(\n\n+|(?:\r?\n|^)#{1,3}\s|(?:\r?\n|^)(?:Chapter|Section)\s|(?:\r?\n|^)\[?\d{1,2}:\d{2}\]?)/i;

    // Split and keep delimiters to maintain context
    let rawSections = text.split(sectionRegex).filter(Boolean);

    let currentChunk = "";

    for (let i = 0; i < rawSections.length; i++) {
        const section = rawSections[i];

        // 2. Check if adding this section exceeds chunk size
        if ((currentChunk.length + section.length) > chunkSize) {

            // If current chunk has content, push it
            if (currentChunk.trim().length > 0) {
                chunks.push(currentChunk.trim());
            }

            // 3. Handle specific section being too large on its own
            if (section.length > chunkSize) {
                // Fallback to character-based splitting for this specific giant section
                let startIndex = 0;
                while (startIndex < section.length) {
                    let endIndex = startIndex + chunkSize;
                    if (endIndex < section.length) {
                        const lastSpace = section.lastIndexOf(' ', endIndex);
                        if (lastSpace > startIndex) endIndex = lastSpace;
                    }
                    chunks.push(section.slice(startIndex, endIndex).trim());
                    startIndex = endIndex - overlap;
                }
                currentChunk = ""; // Reset after processing giant section
            } else {
                // Start new chunk with this section (re-using overlap logic ideally, but keeping simple for now)
                // Integrating overlap: grab last 'overlap' chars from previous chunk
                const prevChunk = chunks[chunks.length - 1] || "";
                const overlapText = prevChunk.slice(-overlap);
                currentChunk = overlapText + "\n" + section;
            }
        } else {
            // Append to current chunk
            currentChunk += section;
        }
    }

    // Push remaining text
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

/**
 * Extracts top concepts/keywords from text based on frequency.
 * @param {string} text 
 * @returns {string[]}
 */
function extractConcepts(text) {
    if (!text) return [];

    const stopWords = new Set([
        "the", "is", "at", "which", "on", "and", "a", "an", "in", "to", "of", "for", "it",
        "this", "that", "with", "as", "by", "from", "be", "or", "are", "was", "were", "but",
        "not", "have", "has", "had", "they", "you", "we", "can", "will", "if", "your", "their",
        "about", "more", "when", "what", "who", "all", "also", "how", "why", "so", "just"
    ]);

    // Normalize: lowercase, remove punctuation (keeping hyphens for compound words occasionally useful, but simple regex is safer)
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove symbols
        .split(/\s+/);

    const frequency = {};

    words.forEach(word => {
        if (word.length > 3 && !stopWords.has(word) && !/^\d+$/.test(word)) {
            frequency[word] = (frequency[word] || 0) + 1;
        }
    });

    // Sort by frequency
    const sortedConcepts = Object.keys(frequency)
        .sort((a, b) => frequency[b] - frequency[a])
        .slice(0, 15); // Top 15

    return sortedConcepts;
}

// Development ready check
if (import.meta.env.DEV) {
    console.log("ProcessingService ready");
}
