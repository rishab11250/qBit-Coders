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
 * Uses a LOCAL VITE PROXY to bypass CORS and Bot Detection.
 * Fetches JSON transcript for reliability.
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
    // 1. Fetch Video Page HTML via Local Proxy
    const videoPageUrl = `/api/yt/watch?v=${videoId}`;

    console.log("⬇️ Fetching video page via Local Proxy...");
    const response = await fetch(videoPageUrl, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch video page via local proxy (Status: ${response.status}). Ensure Vite server is running.`);
    }

    const html = await response.text();

    // 2. Extract Metadata (Title)
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : 'Unknown Video';

    // 3. Extract Captions JSON
    if (!html.includes('captionTracks')) {
      throw new Error("No captions found (Video might be age-restricted, private, or lack subtitles).");
    }

    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (!captionMatch) throw new Error("Caption track data not found in page.");

    const tracks = JSON.parse(captionMatch[1]);

    const track = tracks.find(t => t.languageCode === 'en' && !t.kind)
      || tracks.find(t => t.languageCode === 'en')
      || tracks[0];

    if (!track) throw new Error("No suitable caption track found.");

    const captionUrl = track.baseUrl;
    console.log(`📝 Caption URL extracted. Preparing JSON fetch...`);

    // 4. Transform Caption URL for JSON and Proxy
    // Force JSON format (fmt=json3)
    let jsonUrl = captionUrl.replace(/fmt=[^&]+/, ''); // remove existing fmt
    if (jsonUrl.includes('?')) jsonUrl += '&fmt=json3';
    else jsonUrl += '?fmt=json3';

    // Proxy transformation
    let proxyJsonUrl = jsonUrl;
    if (jsonUrl.startsWith('https://www.youtube.com')) {
      proxyJsonUrl = jsonUrl.replace('https://www.youtube.com', '/api/yt');
    } else if (jsonUrl.startsWith('https://youtu.be')) {
      proxyJsonUrl = jsonUrl.replace('https://youtu.be', '/api/yt');
    } else if (jsonUrl.startsWith('https://www.google.com')) {
      console.warn("Caption URL is google.com, attempting proxy replace:", jsonUrl);
      proxyJsonUrl = jsonUrl.replace('https://www.google.com', '/api/yt');
    }

    console.log(`📝 Fetching JSON transcript from: ${proxyJsonUrl}`);

    // 5. Fetch Transcript JSON via Local Proxy
    const jsonResp = await fetch(proxyJsonUrl);
    if (!jsonResp.ok) throw new Error(`Failed to fetch JSON via local proxy: ${jsonResp.status}`);

    let jsonData;
    try {
      jsonData = await jsonResp.json();
    } catch (e) {
      throw new Error("Failed to parse transcript JSON. Response might be empty or invalid.");
    }

    if (!jsonData.events) throw new Error("Invalid JSON transcript format: 'events' missing.");

    // 6. Parse JSON & Group into ~30s Chunks
    const chunks = [];
    let currentChunkContent = "";
    let currentChunkStart = 0;
    let fullText = "";
    let lastEnd = 0;

    jsonData.events.forEach((event, index) => {
      // event: { tStartMs: 123, seps: [ { utf8: "text" } ] }
      if (!event.segs) return;

      const start = (event.tStartMs || 0) / 1000;
      const text = event.segs.map(s => s.utf8).join('').replace(/[\r\n]+/g, ' ');
      const cleaned = cleanText(text);

      if (!cleaned) return;

      fullText += cleaned + " ";

      if (start - currentChunkStart > 30 && currentChunkContent.length > 0) {
        chunks.push({
          timestamp: formatTimestamp(currentChunkStart),
          content: currentChunkContent.trim()
        });
        currentChunkStart = start;
        currentChunkContent = cleaned + " ";
      } else {
        currentChunkContent += cleaned + " ";
      }

      // Track duration
      const durationMs = event.dDurationMs || 0;
      lastEnd = start + (durationMs / 1000);
    });

    if (currentChunkContent.trim()) {
      chunks.push({
        timestamp: formatTimestamp(currentChunkStart),
        content: currentChunkContent.trim()
      });
    }

    console.log(`✅ Transcript processed: ${fullText.length} chars, ${chunks.length} chunks.`);

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
