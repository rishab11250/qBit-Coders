import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";

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

        // 1. Determine input type and extract raw text
        if (input instanceof File) {
            if (input.type === 'application/pdf') {
                sourceType = 'pdf';
                rawText = await extractTextFromPDF(input);
            } else {
                // Determine if it's text-based enough to read
                // (For safety, we'll try reading as text)
                sourceType = 'text'; // Treating plain text file as text
                rawText = await input.text();
            }
        } else if (typeof input === 'string') {
            sourceType = 'text';
            rawText = input;
        } else {
            throw new Error("Unsupported input type");
        }

        // 2. Clean and Normalize
        const cleanedText = cleanText(rawText);

        // 3. Chunk
        const chunks = chunkText(cleanedText);

        return {
            sourceType,
            rawText: cleanedText,
            chunks
        };

    } catch (error) {
        console.error("ProcessingService Error:", error);
        throw error; // Re-throw for UI handling
    }
}

/**
 * Extracts text from a PDF file using pdfjs-dist.
 * @param {File} file 
 * @returns {Promise<string>}
 */
async function extractTextFromPDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Join items with space, but preserve some structure if needed
            const pageText = textContent.items.map(item => item.str).join(' ');

            // Add a discrete separator or just content
            fullText += pageText + '\n\n';
        }

        return fullText;
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
