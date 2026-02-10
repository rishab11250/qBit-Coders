import { cleanText } from './textProcessor';

/**
 * Validates if the input string is a YouTube URL.
 * @param {string} url 
 * @returns {boolean}
 */
export const isValidYoutubeUrl = (url) => {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/.test(url);
};

/**
 * Extracts Video ID from URL.
 * @param {string} url 
 * @returns {string|null}
 */
export const extractVideoId = (url) => {
  const match = url.match(/^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
  return match ? match[4] : null;
};

/**
 * Fetches and processes YouTube video transcript.
 * Uses VITE MIDDLEWARE (/api/transcript) which runs custom server-side scraping.
 * Returns XML string. Client parses it.
 * 
 * @param {string} url - YouTube URL.
 * @returns {Promise<{text: string, metadata: {title: string, url: string, duration: number}, chunks: Array<{timestamp: string, content: string}>}>}
 */
export const processVideo = async (url) => {
  if (!isValidYoutubeUrl(url)) {
    throw new Error("Invalid YouTube URL provided.");
  }

  const videoId = extractVideoId(url);
  console.log(`🎥 Processing Video ID: ${videoId}`);

  try {
    // 1. Fetch XML via Vite Middleware (Server-side)
    const middlewareUrl = `/api/transcript?videoId=${videoId}`;
    console.log(`⬇️ Fetching XML via Middleware: ${middlewareUrl}`);

    const transcriptResp = await fetch(middlewareUrl);

    if (!transcriptResp.ok) {
      const errText = await transcriptResp.text();
      console.error("Middleware Error:", errText);
      throw new Error(`Transcript Fetch Failed: ${errText}`);
    }

    const rawResponseText = await transcriptResp.text();

    if (!rawResponseText || rawResponseText.trim().length === 0) {
      throw new Error("Transcript is empty.");
    }

    // Check for JSON error from middleware (if content-type json?)
    if (rawResponseText.startsWith('{') && rawResponseText.includes('"error"')) {
      try {
        const errJson = JSON.parse(rawResponseText);
        if (errJson.error) throw new Error(errJson.error);
      } catch (e) { }
    }

    console.log(`✅ XML fetched. Parsing...`);

    // 2. Parse XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rawResponseText, "text/xml");

    const textNodes = Array.from(xmlDoc.getElementsByTagName("text"));

    if (textNodes.length === 0) {
      // Fallback: check parsing errors
      if (rawResponseText.trim().startsWith('<!DOCTYPE html>')) {
        throw new Error("Received HTML instead of XML (Middleware might have failed).");
      }
      console.warn("XML parsed but no <text> nodes found.");
      return { text: "", metadata: { title: "Unknown", url, duration: 0 }, chunks: [] };
    }

    // 3. Fetch Metadata (Title) via Local Proxy HTML
    let title = "YouTube Video";
    try {
      const videoPageUrl = `/api/yt/watch?v=${videoId}`;
      const htmlResp = await fetch(videoPageUrl);
      if (htmlResp.ok) {
        const html = await htmlResp.text();
        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        if (titleMatch) {
          title = titleMatch[1].replace(' - YouTube', '');
        }
      }
    } catch (e) {
      console.warn("Failed to fetch video metadata, using default title.", e);
    }

    // 4. Process Transcript into Chunks
    const chunks = [];
    let currentChunkContent = "";
    let currentChunkStart = 0;
    let fullText = "";
    let lastEnd = 0;

    textNodes.forEach((node) => {
      const start = parseFloat(node.getAttribute("start") || "0");
      const dur = parseFloat(node.getAttribute("dur") || "0");

      let text = node.textContent;
      text = cleanText(text); // decode entities and trim
      if (!text) return;

      fullText += text + " ";

      if (start - currentChunkStart > 30 && currentChunkContent.length > 0) {
        chunks.push({
          timestamp: formatTimestamp(currentChunkStart),
          content: currentChunkContent.trim()
        });
        currentChunkStart = start;
        currentChunkContent = text + " ";
      } else {
        currentChunkContent += text + " ";
      }

      lastEnd = start + dur;
    });

    if (currentChunkContent.trim()) {
      chunks.push({
        timestamp: formatTimestamp(currentChunkStart),
        content: currentChunkContent.trim()
      });
    }

    return {
      text: fullText.trim(),
      metadata: {
        title,
        url,
        duration: lastEnd
      },
      chunks
    };

  } catch (error) {
    console.error("VideoProcessor Error:", error);
    throw error;
  }
};

/**
 * Formats seconds into MM:SS
 * @param {number} seconds 
 * @returns {string}
 */
const formatTimestamp = (seconds) => {
  const date = new Date(0);
  date.setSeconds(seconds);
  const timeString = date.toISOString().substr(14, 5); // MM:SS
  return timeString;
};
