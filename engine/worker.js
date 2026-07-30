// Cloudflare Worker — SensyCilva API
// Environment variables needed:
// - YOUTUBE_API_KEY   : Your YouTube Data API key
// - SMALLEST_API_KEY  : Your Smallest.ai API key

// ─── VOICE MAP (language → { male, female }) ──────────────────
const VOICE_MAP = {
  'en-US': {
    male: 'daniel',      // Male English
    female: 'emily'      // Female English (default)
  },
  'hi-IN': {
    male: 'yuvika',      // Male Hindi
    female: 'meher'      // Female Hindi (Pro model)
  },
  'te-IN': {
    male: 'yuvika',      // Telugu maps to Hindi male (update when available)
    female: 'meher'      // Telugu maps to Hindi female
  },
  'ta-IN': {
    male: 'yuvika',      // Tamil maps to Hindi male
    female: 'meher'      // Tamil maps to Hindi female
  },
  'kn-IN': {
    male: 'yuvika',      // Kannada maps to Hindi male
    female: 'meher'      // Kannada maps to Hindi female
  }
};

// Pro voices (meher) require 'lightning_v3.1_pro', others use 'lightning_v3.1'
const PRO_VOICES = ['meher'];

// ─── RSS FEEDS ──────────────────────────────────────────────────
const RSS_FEEDS = {
  news: 'https://news.google.com/rss/search?q=india+news&hl=en',
  entertainment: 'https://news.google.com/rss/search?q=bollywood+gossip&hl=en',
  anime: 'https://www.animenewsnetwork.com/news/feed.xml',
  tech: 'https://news.google.com/rss/search?q=technology+india&hl=en'
};

// ─── RSS PARSER (no external libraries) ──────────────────────
function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title = (content.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
    const link = (content.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
    const pubDate = (content.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
    const description = (content.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || '';
    items.push({
      title: title.replace(/<[^>]*>/g, '').trim(),
      link: link.trim(),
      pubDate: pubDate.trim(),
      description: description.replace(/<[^>]*>/g, '').trim().slice(0, 150) + '...'
    });
  }
  return items;
}

// ─── CORS HEADERS ──────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ─── OPTIONS preflight ──────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // ─── 1. YOUTUBE SEARCH ──────────────────────────────────────
    if (path === '/api/youtube/search' && request.method === 'GET') {
      const query = url.searchParams.get('q');
      if (!query) {
        return new Response(
          JSON.stringify({ error: 'Missing "q" query parameter' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
        );
      }

      const apiKey = env.YOUTUBE_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'YOUTUBE_API_KEY not set' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
        );
      }

      const ytUrl = new URL('https://www.googleapis.com/youtube/v3/search');
      ytUrl.searchParams.set('part', 'snippet');
      ytUrl.searchParams.set('type', 'video');
      ytUrl.searchParams.set('videoCategoryId', '10'); // Music
      ytUrl.searchParams.set('maxResults', '5');
      ytUrl.searchParams.set('q', query);
      ytUrl.searchParams.set('key', apiKey);

      try {
        const response = await fetch(ytUrl.toString());
        const data = await response.json();
        if (data.error) {
          return new Response(
            JSON.stringify({ error: data.error.message }),
            { status: response.status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
          );
        }

        const results = (data.items || []).map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          thumb: item.snippet.thumbnails?.default?.url || null
        }));

        return new Response(
          JSON.stringify({ success: true, items: results }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Proxy error: ' + error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
        );
      }
    }

    // ─── 2. TTS (Smallest.ai) ──────────────────────────────────
    if (path === '/api/tts' && request.method === 'POST') {
      const { text, language, gender } = await request.json();

      if (!text || !language) {
        return new Response(
          JSON.stringify({ error: 'Missing text or language' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
        );
      }

      const apiKey = env.SMALLEST_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'SMALLEST_API_KEY not set' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
        );
      }

      const voiceMap = VOICE_MAP[language];
      if (!voiceMap) {
        return new Response(
          JSON.stringify({ error: 'Unsupported language' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
        );
      }

      const voiceId = gender === 'male' ? voiceMap.male : voiceMap.female;
      const model = PRO_VOICES.includes(voiceId) ? 'lightning_v3.1_pro' : 'lightning_v3.1';

      const payload = {
        text: text,
        voice_id: voiceId,
        model: model,
        format: 'mp3',
        speed: 1.0,
        pitch: 1.0
      };

      try {
        const response = await fetch('https://api.smallest.ai/v1/tts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          return new Response(
            JSON.stringify({ error: `Smallest.ai error: ${errorText}` }),
            { status: response.status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
          );
        }

        const audioBuffer = await response.arrayBuffer();
        return new Response(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            ...CORS_HEADERS,
            'Content-Length': audioBuffer.byteLength
          }
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'TTS proxy error: ' + error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
        );
      }
    }

    // ─── 3. RSS NEWS ────────────────────────────────────────────
    if (path === '/api/news' && request.method === 'GET') {
      const category = url.searchParams.get('category') || 'news';
      const feedUrl = RSS_FEEDS[category];
      if (!feedUrl) {
        return new Response(
          JSON.stringify({ error: 'Invalid news category' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
        );
      }

      try {
        const response = await fetch(feedUrl);
        const xml = await response.text();
        const items = parseRSS(xml);
        return new Response(
          JSON.stringify({ success: true, items: items.slice(0, 5) }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch news: ' + error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
        );
      }
    }

    // ─── 404 ─────────────────────────────────────────────────────
    return new Response('Not Found', { status: 404 });
  }
};
