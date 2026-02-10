
/**
 * Normalizes text content by removing excess whitespace and standardizing line breaks.
 * @param {string} text - The raw text to clean.
 * @returns {string} - The cleaned text.
 */
export const cleanText = (text) => {
    if (!text) return '';

    return text
        // Replace multiple spaces with single space
        .replace(/[ \t]+/g, ' ')
        // Replace multiple newlines with double newline (paragraph break)
        .replace(/\n\s*\n/g, '\n\n')
        // Trim whitespace from start and end
        .trim();
};

/**
 * Splits text into logical paragraphs.
 * @param {string} text - The cleaned text.
 * @returns {string[]} - Array of paragraph strings.
 */
export const splitIntoParagraphs = (text) => {
    if (!text) return [];

    // Split by double newline (or more)
    return text.split(/\n\n+/).filter(p => p.trim().length > 0);
};

/**
 * Estimates reading time in minutes.
 * @param {string} text 
 */
export const estimateReadingTime = (text) => {
    const words = text.split(/\s+/).length;
    const wpm = 200; // Average reading speed
    return Math.ceil(words / wpm);
};

/**
 * Semantic Chunking: Splits text by logical sections first, then by size.
 * @param {string} text 
 * @param {number} chunkSize 
 * @param {number} overlap 
 * @returns {string[]}
 */
export const chunkText = (text, chunkSize = 1200, overlap = 200) => {
    if (!text) return [];

    // Safety check for parameters
    if (chunkSize <= 0) chunkSize = 1200;
    if (overlap >= chunkSize) overlap = chunkSize - 1;
    if (overlap < 0) overlap = 0;

    if (text.length <= chunkSize) return [text];

    const chunks = [];

    // 1. Split by logical boundaries (Headings, Timestamps, Double Newlines)
    const sectionRegex = /(\n\n+|(?:\r?\n|^)#{1,3}\s|(?:\r?\n|^)(?:Chapter|Section)\s|(?:\r?\n|^)\[?\d{1,2}:\d{2}\]?)/i;

    // Split and keep delimiters
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
                currentChunk = "";
            } else {
                const prevChunk = chunks[chunks.length - 1] || "";
                const overlapText = prevChunk.slice(-overlap);
                currentChunk = overlapText + "\n" + section;
            }
        } else {
            currentChunk += section;
        }
    }

    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
};

/**
 * Extracts top concepts/keywords from text based on frequency.
 * @param {string} text 
 * @returns {string[]}
 */
export const extractConcepts = (text) => {
    if (!text) return [];

    const stopWords = new Set([
        "the", "is", "at", "which", "on", "and", "a", "an", "in", "to", "of", "for", "it",
        "this", "that", "with", "as", "by", "from", "be", "or", "are", "was", "were", "but",
        "not", "have", "has", "had", "they", "you", "we", "can", "will", "if", "your", "their",
        "about", "more", "when", "what", "who", "all", "also", "how", "why", "so", "just"
    ]);

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
};
