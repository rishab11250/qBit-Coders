
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
