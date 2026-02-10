import { processPDF } from './pdfProcessor';
import { processVideo } from './videoProcessor';
import { cleanText, splitIntoParagraphs } from './textProcessor';

export const ProcessingService = {
    /**
     * Main entry point to process any supported content type.
     * @param {'pdf' | 'video' | 'text'} type 
     * @param {File | string} data - File object for PDF, URL string for Video, raw text for Text.
     */
    processContent: async (type, data) => {
        console.log(`[ProcessingService] Starting processing for type: ${type}`);

        let result = {
            type,
            originalData: data,
            text: '',
            chunks: [],
            metadata: {}
        };

        switch (type) {
            case 'pdf':
                const pdfData = await processPDF(data);
                result.text = pdfData.text;
                result.metadata = pdfData.metadata;
                result.chunks = splitIntoParagraphs(pdfData.text).map((p, i) => ({
                    id: i,
                    content: p,
                    type: 'text_block'
                }));
                break;

            case 'video':
                const videoData = await processVideo(data);
                result.text = videoData.text;
                result.metadata = videoData.metadata;
                result.chunks = videoData.chunks; // Already structured { timestamp, content }
                break;

            case 'text':
                const cleaned = cleanText(data);
                result.text = cleaned;
                result.chunks = splitIntoParagraphs(cleaned).map((p, i) => ({
                    id: i,
                    content: p,
                    type: 'text_block'
                }));
                break;

            default:
                throw new Error(`Unsupported content type: ${type}`);
        }

        console.log(`[ProcessingService] Complete. Text length: ${result.text.length}`);
        return result;
    }
};
