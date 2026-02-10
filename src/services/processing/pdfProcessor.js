import * as pdfjsLib from 'pdfjs-dist';
import { cleanText } from './textProcessor';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extracts and cleans text from a PDF file.
 * @param {File} file - The PDF file object.
 * @returns {Promise<{text: string, pages: number, metadata: object}>}
 */
export const processPDF = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;
        let fullText = '';
        const pageTexts = [];

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Basic join
            let pageStr = textContent.items.map((item) => item.str).join(' ');

            // Basic cleaning of this page
            pageStr = cleanText(pageStr);

            pageTexts.push(pageStr);
            fullText += `\n\n[Page ${i}]\n${pageStr}`;
        }

        // Advanced: Identify and remove repeating headers/footers
        // Heuristic: If the first/last 50 chars of every page are identical, strip them.
        // For Hackathon MVP, we stick to the `cleanText` utility which handles whitespace.

        return {
            text: fullText,
            pages: totalPages,
            metadata: await pdf.getMetadata()
        };

    } catch (error) {
        console.error("PDF Processing Error:", error);
        throw new Error("Failed to process PDF.");
    }
};
