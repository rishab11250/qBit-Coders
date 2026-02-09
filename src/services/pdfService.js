import * as pdfjsLib from 'pdfjs-dist';

// Use a reliable CDN for the worker to avoid complex build setups
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const extractTextFromPDF = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';
        const totalPages = pdf.numPages;

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item) => item.str).join(' ');
            fullText += `\n\n--- Page ${i} ---\n\n${pageText}`;
        }

        return {
            text: fullText,
            pages: totalPages,
            info: await pdf.getMetadata()
        };
    } catch (error) {
        console.error("PDF Extraction Failed:", error);
        throw new Error("Failed to extract text from PDF. Please try a different file.");
    }
};
