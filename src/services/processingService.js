import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { processVideo } from './processing/videoProcessor';
import { cleanText, chunkText, extractConcepts } from './processing/textProcessor';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Main entry point for processing study materials.
 * 
 * @param {File|string} input - The file or text content to process
 * @returns {Promise<{ sourceType: string, rawText: string, chunks: any[] }>}
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
                const result = await extractTextFromPDF(input);
                rawText = result.rawText;
                chunks = result.chunks; // chunks are strings here

            } else {
                sourceType = 'text';
                rawText = await input.text();
            }
        } else if (typeof input === 'string') {
            // Check for YouTube URL
            if (input.includes('youtube.com') || input.includes('youtu.be')) {
                console.log("🎥 Detecting YouTube URL...");

                // Delegate to videoProcessor
                const videoData = await processVideo(input);

                sourceType = 'video';
                rawText = videoData.text;
                chunks = videoData.chunks; // chunks are objects {timestamp, content}
                metadata = videoData.metadata; // { intitle, url, duration }

            } else {
                sourceType = 'text';
                rawText = input;
            }
        } else {
            throw new Error("Unsupported input type");
        }

        // 2. Clean and Normalize (only if not already processed by videoProcessor)
        // Video processor already cleans text.
        if (sourceType !== 'video') {
            rawText = cleanText(rawText);
        }

        // 3. Chunk (only if not already processed)
        // Video processor already chunks.
        if (sourceType !== 'video' && (!chunks || chunks.length === 0)) {
            chunks = chunkText(rawText);
        }

        // 4. Calculate Common Metadata (Word Count, Study Time)
        const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;
        const estimatedStudyTimeMinutes = Math.ceil(wordCount / 200);

        metadata = {
            ...metadata,
            wordCount,
            estimatedStudyTimeMinutes,
            chunkCount: chunks.length
        };

        console.log("📊 Metadata:", metadata);

        // 5. Concept Extraction
        const concepts = extractConcepts(rawText);
        console.log("🧠 Concepts extracted:", concepts);

        return {
            sourceType,
            rawText,
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
            const pageText = textContent.items.map(item => item.str).join(' ');
            const cleanedPage = cleanText(pageText);

            if (cleanedPage.length > 0) {
                const pageChunks = chunkText(cleanedPage);
                allChunks.push(...pageChunks);
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
