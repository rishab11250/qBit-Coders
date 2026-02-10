import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
// TRIGGER RELOAD

const transcriptMiddleware = () => ({
  name: 'configure-server',
  configureServer(server) {
    server.middlewares.use('/api/transcript', async (req, res, next) => {
      try {
        const urlObj = new URL(req.url, 'http://localhost');
        const videoId = urlObj.searchParams.get('videoId');

        if (!videoId) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing videoId parameter' }));
          return;
        }

        console.log(`[Vite Middleware] Fetching transcript for: ${videoId}`);

        // Strategy 3: Use @distube/ytdl-core (The Gold Standard)
        let transcriptXml = null; // This will be used by Invidious and Direct Scrape
        let ytdlCoreAttempted = false;

        try {
          // Dynamically import to avoid load-time errors if not fully installed yet
          const { createRequire } = await import('module');
          const require = createRequire(import.meta.url);

          let ytdl;
          try {
            ytdl = require('@distube/ytdl-core');
          } catch (e) {
            console.error("Failed to load @distube/ytdl-core", e);
            throw new Error("Dependency missing: @distube/ytdl-core");
          }

          ytdlCoreAttempted = true;
          const info = await ytdl.getInfo(videoId);
          const tracks = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;

          if (tracks && tracks.length > 0) {
            const track = tracks.find(t => t.languageCode === 'en') || tracks[0];
            console.log(`[Middleware] Found track via ytdl-core: ${track.name.simpleText}`);

            const xmlResp = await fetch(track.baseUrl);
            const xmlText = await xmlResp.text();

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/xml');
            res.end(xmlText);
            return; // Successfully handled by ytdl-core
          } else {
            // No captions found in video info
            console.warn("[Middleware] No captions found via ytdl-core.");

            // Fallback to Description from Info
            const description = info.videoDetails.description || info.videoDetails.shortDescription;
            if (description) {
              console.log("[Middleware] Returning description as fallback from ytdl-core.");
              const xml = `<?xml version="1.0" encoding="utf-8" ?><transcript><text start="0" dur="0">Video Transcript Unavailable. Summary from Description: ${description}</text></transcript>`;
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/xml');
              res.end(xml);
              return; // Successfully handled by ytdl-core with description
            }
          }
        } catch (ytdlError) {
          console.error("[Middleware] ytdl-core failed:", ytdlError.message);
          // Do not throw here, proceed to backups (Invidious)
          ytdlCoreAttempted = true;
        }

        // If ytdl-core didn't return, try Invidious.
        // Strategy 1: Invidious API (Most robust fallback for blocked IPs)
        // Public instances that proxy YouTube data as JSON
        const instances = [
          'https://inv.tux.pizza',
          'https://vid.puffyan.us',
          'https://invidious.projectsegfau.lt'
        ];

        for (const instance of instances) {
          try {
            console.log(`[Middleware] Trying Invidious instance: ${instance}`);
            const apiUrl = `${instance}/api/v1/videos/${videoId}`;
            const resp = await fetch(apiUrl);
            if (!resp.ok) continue;

            const data = await resp.json();
            const captions = data.captions; // Array of { label, languageCode, url }

            if (captions && captions.length > 0) {
              const track = captions.find(t => t.languageCode === 'en') || captions[0];
              // Invidious returns VTT url usually via /api/v1/captions/...
              // But we want XML format if possible for our parser?
              // videoProcessor expects XML or we can return the VTT text and handle it?
              // Actually current videoProcessor expects XML.
              // IMPORTANT: Invidious URL returns VTT.
              // We can fetch the VTT text and return it.
              // BUT videoProcessor parses XML. 
              // Let's stick to Direct Scrape first? 
              // NO, Direct Scrape failed. 

              // Let's TRY Direct Scrape AGAIN with better logic, then Fallback.
              // Actually, let's keep the user's "Hardened Direct" as Primary, Invidious as Secondary?
              // User said "Same problem". Primary is dead.

              // I will Return text/vtt content if I use Invidious.
              // videoProcessor needs update to handle VTT?
              // Or I can return a minimal XML wrapper around VTT?
              // <transcript><text start=".." dur="..">...</text></transcript>

              // Let's Convert JSON/VTT to XML on the fly!
              // Invidious API keys: url is the caption file.
              const subUrl = `${instance}${track.url}`; // usually /api/v1/captions/...
              const subResp = await fetch(subUrl);
              const subText = await subResp.text(); // VTT content

              // Convert VTT to XML to satisfy videoProcessor
              transcriptXml = vttToXml(subText);
              console.log("[Middleware] Successfully fetched and converted VTT from Invidious.");
              break;
            }
          } catch (e) {
            console.warn(`[Middleware] Instance ${instance} failed:`, e.message);
          }
        }

        if (transcriptXml) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/xml');
          res.end(transcriptXml);
          return;
        }

        // Strategy 2: Direct Scrape (Original Logic as Backup)
        console.log("[Middleware] Invidious failed. Trying direct scrape...");

        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': `https://www.youtube.com/watch?v=${videoId}`,
          'Accept-Language': 'en-US,en;q=0.9',
          'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+417;'
        };

        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const htmlResp = await fetch(videoUrl, { headers });
        const html = await htmlResp.text();

        if (!html.includes('captionTracks')) {
          // Fallback: If no captions, try to extract description.
          console.warn(`[Middleware] No captionTracks found. Attempting to extract description.`);
          const descMatch = html.match(/"shortDescription":\s*"(.+?)"/) ||
            html.match(/"description":\s*\{\s*"simpleText":\s*"(.+?)"/);

          if (descMatch) {
            const description = descMatch[1].replace(/\\n/g, ' ');
            console.log(`[Middleware] Extracted description as fallback: ${description.substring(0, 50)}...`);
            const xml = `<?xml version="1.0" encoding="utf-8" ?><transcript><text start="0" dur="0">Video Transcript Unavailable. Summary from Description: ${description}</text></transcript>`;
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/xml');
            res.end(xml);
            return;
          }

          throw new Error("No captions found and no description available (Blocked by YouTube & Invidious failed).");
        }

        const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
        if (!captionMatch) throw new Error("Could not parse captionTracks.");
        const tracks = JSON.parse(captionMatch[1]);
        const track = tracks.find(t => t.languageCode === 'en' && !t.kind) || tracks.find(t => t.languageCode === 'en') || tracks[0];

        if (!track) throw new Error("No usable subtitle track found.");

        console.log(`[Middleware] Found track: ${track.name.simpleText} (${track.languageCode})`);

        // 3. Fetch XML (With Referer to avoid empty response)
        const xmlResp = await fetch(track.baseUrl, { headers });

        if (!xmlResp.ok) throw new Error(`XML Fetch failed: ${xmlResp.status}`);
        const xmlText = await xmlResp.text();

        if (!xmlText || xmlText.trim().length === 0) {
          throw new Error("YouTube returned empty XML.");
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/xml');
        res.end(xmlText);

      } catch (error) {
        console.error('[Vite Middleware] Error:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: error.message || 'Server error' }));
      }
    });
  }
});

// Helper to convert WebVTT to Youtube-like XML
function vttToXml(vttContent) {
  // Basic parser for VTT to <text start="" dur=""> format
  const lines = vttContent.split('\n');
  let xml = '<?xml version="1.0" encoding="utf-8" ?><transcript>';
  let currentStart = null;
  let currentEnd = null;
  let buffer = [];

  // Regex for VTT timestamp: 00:00:00.000
  const timeRegex = /(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/;

  for (const line of lines) {
    if (line.includes('-->')) {
      const match = line.match(timeRegex);
      if (match) {
        // Flash buffer
        if (currentStart !== null && buffer.length > 0) {
          const dur = parseTime(currentEnd) - parseTime(currentStart);
          xml += `<text start="${parseTime(currentStart)}" dur="${dur}">${buffer.join(' ')}</text>`;
        }
        currentStart = match[1];
        currentEnd = match[2];
        buffer = [];
      }
    } else if (line.trim() && !line.startsWith('WEBVTT') && isNaN(line.trim())) {
      buffer.push(line.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
    }
  }
  // Last chunk
  if (currentStart !== null && buffer.length > 0) {
    const dur = parseTime(currentEnd) - parseTime(currentStart);
    xml += `<text start="${parseTime(currentStart)}" dur="${dur}">${buffer.join(' ')}</text>`;
  }

  xml += '</transcript>';
  return xml;
}

function parseTime(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const secParts = parts[2].split('.');
  return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(secParts[0]) + parseFloat('0.' + secParts[1]);
}

export default defineConfig({
  plugins: [
    react(),
    transcriptMiddleware()
  ],
  server: {
    proxy: {
      // Keep local proxy for metadata logic in client if needed
      '/api/yt': {
        target: 'https://www.youtube.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/yt/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.youtube.com/'
        }
      }
    }
  }
})