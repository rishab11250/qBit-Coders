import { extractTextFromPDF } from './pdfParser';
import { chunkText } from './textChunker';

/**
 * Orchestrates the processing of a study file.
 * extracting text, cleaning it, and chunking it for AI consumption.
 * 
 * @param {File} file - The uploaded file object.
 * @returns {Promise<{rawText: string, chunks: string[]}>}
 */
export async function processStudyFile(file) {
    // Edge case: Missing file
    if (!file) {
        return { rawText: '', chunks: [] };
    }

    try {
        let rawText = '';

        // 1. Detect type and extract text
        if (file.type === 'application/pdf') {
            rawText = await extractTextFromPDF(file);
        } else {
            // Fallback for text-based files (txt, md, etc.)
            // Note: This assumes the file is readable as text.
            try {
                rawText = await file.text();
            } catch (e) {
                console.warn('Failed to read file as text:', e);
                rawText = '';
            }
        }

        // 2. Clean the text
        // Normalize whitespace: replace newlines/tabs with spaces, collapse multiple spaces
        const cleanedText = rawText
            .replace(/\s+/g, ' ')
            .trim();

        // 3. Chunk the text
        const chunks = chunkText(cleanedText);

        return {
            rawText: cleanedText,
            chunks: chunks
        };

    } catch (error) {
        console.error('File Pipeline Error:', error);
        // Return safe fallback
        return { rawText: '', chunks: [] };
    }
}

// DEV test block
if (import.meta.env.DEV) {
    console.log("File pipeline ready");
}
