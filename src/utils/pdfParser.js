import * as pdfjsLib from 'pdfjs-dist';

// Configure worker for Vite using the standard URL constructor method
// This ensures the worker is correctly bundled and loaded
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

/**
 * Extracts all readable text from an uploaded PDF file.
 * 
 * @param {File} file - The uploaded PDF file object
 * @returns {Promise<string>} The combined text content from all pages
 */
export async function extractTextFromPDF(file) {
    // Edge case: Missing file
    if (!file) {
        return '';
    }

    try {
        // Read the File object using arrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(arrayBuffer);
        const pdf = await loadingTask.promise;

        let fullText = '';

        // Loop through all pages
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Extract text items and combine with spaces
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');

            fullText += pageText + ' ';
        }

        return fullText.trim();
    } catch (error) {
        // Handle errors gracefully without crashing functionality
        console.error('PDF Extraction Error:', error);
        return '';
    }
}

// DEV test block
if (import.meta.env.DEV) {
    console.log("PDF parser ready");
}
