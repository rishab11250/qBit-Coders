/**
 * Splits long text into smaller chunks with overlap.
 * 
 * @param {string} text - The input text to be chunked.
 * @param {number} [chunkSize=1200] - The maximum size of each chunk.
 * @param {number} [overlap=200] - The number of characters to overlap between chunks.
 * @returns {string[]} An array of text chunks.
 */
export function chunkText(text, chunkSize = 1200, overlap = 200) {
    // 1. Handle edge cases
    if (!text || typeof text !== 'string') {
        return [];
    }

    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
        return [];
    }

    // Protection against infinite loops or invalid params
    if (chunkSize <= 0) chunkSize = 1200;
    if (overlap < 0) overlap = 0;
    if (overlap >= chunkSize) {
        // If overlap is too large, reduce it to half of chunk size to ensure progress
        overlap = Math.floor(chunkSize / 2);
    }

    const chunks = [];
    let startIndex = 0;

    // 2. Loop through text
    while (startIndex < trimmedText.length) {
        // Calculate end index
        let endIndex = startIndex + chunkSize;

        // Extract the chunk
        const chunk = trimmedText.slice(startIndex, endIndex);
        chunks.push(chunk);

        // Break if we've reached the end of the text
        if (endIndex >= trimmedText.length) {
            break;
        }

        // 3. Update start index for next chunk (move forward by chunkSize - overlap)
        startIndex += (chunkSize - overlap);
    }

    return chunks;
}

// ------------------------------------------------------------------
// Verification / Test Block (Runs only during development/testing)
// ------------------------------------------------------------------
// To run this test, you can import this file or run it in a suitable environment.
// Since this is a module, self-execution guards or just commented code is common,
// but the requirement asked for a test block at the bottom.
// We will simply execute it.

try {
    const dummyText = "A".repeat(3000); // 3000 chars
    console.log("--- Text Chunker Test ---");

    // Test with default 1200/200
    const chunks = chunkText(dummyText, 1200, 200);

    console.log(`Total Text Length: ${dummyText.length}`);
    console.log(`Number of Chunks: ${chunks.length}`);

    if (chunks.length > 0) {
        console.log(`First Chunk Length: ${chunks[0].length}`);
        console.log(`Last Chunk Length: ${chunks[chunks.length - 1].length}`);
    }

    // Expected behavior for 3000 chars:
    // Chunk 1: 0-1200
    // Start 2: 1000 (1200 - 200)
    // Chunk 2: 1000-2200
    // Start 3: 2000
    // Chunk 3: 2000-3000 (Length 1000)
    // Start 4: 3000 -> break
    // Total chunks: 3

} catch (error) {
    console.error("Test Block Error:", error);
}
