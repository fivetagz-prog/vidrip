const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).send('Missing video ID');

  try {
    const raw = await kv.get(`video:${id}`);
    if (!raw) return res.status(404).send('Video not found or expired');
    
    const meta = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
    const shareUrl = `${baseUrl}/v/${id}`;
    const embedUrl = `${baseUrl}/embed/${id}`;
    const videoUrl = meta.url;
    const title = meta.title || 'Video on VidRip';

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — VidRip</title>
  <meta property="og:type" content="video.other">
  <meta property="og:site_name" content="VidRip">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="Watch this video on VidRip">
  <meta property="og:video" content="${videoUrl}">
  <meta property="og:video:type" content="${meta.type || 'video/mp4'}">
  <meta property="og:video:width" content="1280">
  <meta property="og:video:height" content="720">
  <meta property="twitter:card" content="player">
  <meta property="twitter:site" content="@vidrip">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:player" content="${embedUrl}">
  <meta property="twitter:player:width" content="1280">
  <meta property="twitter:player:height" content="720">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%236366f1' rx='20' width='100' height='100'/><text x='50' y='68' font-size='55' font-weight='bold' text-anchor='middle' fill='white'>V</text></svg>">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0f; color: #e2e8f0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 24px; }
    .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; text-decoration: none; }
    .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 22px; color: white; }
    .logo-text { font-size: 26px; font-weight: 800; background: linear-gradient(90deg, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .player-container { width: 100%; max-width: 900px; background: #111118; border-radius: 20px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    video { width: 100%; display: block; background: #000; }
    .info { padding: 24px; }
    .info h2 { font-size: 20px; margin-bottom: 8px; }
    .info p { color: #64748b; font-size: 14px; }
    .url-box { margin-top: 20px; background: #0f0f16; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; }
    .url-box label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px; }
    .url-row { display: flex; gap: 8px; }
    .url-row input { flex: 1; background: #1a1a24; border: 1px solid #334155; border-radius: 8px; padding: 10px 14px; color: #e2e8f0; font-size: 13px; font-family: monospace; }
    .url-row button { background: linear-gradient(135deg, #6366f1, #a855f7); border: none; color: white; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; transition: all 0.15s; }
    .url-row button:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,0.4); }
    .copied { color: #22c55e; font-size: 12px; margin-top: 6px; opacity: 0; transition: opacity 0.3s; }
    .copied.show { opacity: 1; }
    .footer { margin-top: 40px; color: #475569; font-size: 13px; }
    .footer a { color: #818cf8; text-decoration: none; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-in { animation: fadeIn 0.5s ease-out; }
  </style>
</head>
<body>
  <a href="/" class="logo animate-in">
    <div class="logo-icon">V</div>
    <span class="logo-text">VidRip</span>
  </a>
  <div class="player-container animate-in">
    <video controls autoplay playsinline>
      <source src="${videoUrl}" type="${meta.type || 'video/mp4'}">
      Your browser does not support the video tag.
    </video>
    <div class="info">
      <h2>🎬 ${title}</h2>
      <p>Share this link anywhere — Discord, Twitter, anywhere.</p>
      <div class="url-box">
        <label>🔗 Share URL</label>
        <div class="url-row">
          <input type="text" id="shareUrl" value="${shareUrl}" readonly>
          <button onclick="copy('shareUrl','c1')">Copy</button>
        </div>
        <div class="copied" id="c1">✓ Copied!</div>
      </div>
      <div class="url-box" style="margin-top:12px;">
        <label>📺 Direct Video URL</label>
        <div class="url-row">
          <input type="text" id="directUrl" value="${videoUrl}" readonly>
          <button onclick="copy('directUrl','c2')">Copy</button>
        </div>
        <div class="copied" id="c2">✓ Copied!</div>
      </div>
    </div>
  </div>
  <div class="footer animate-in">Powered by <a href="/">VidRip</a></div>
  <script>
    async function copy(id, tid) {
      await navigator.clipboard.writeText(document.getElementById(id).value);
      const el = document.getElementById(tid);
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), 2000);
    }
  </script>
</body>
</html>`);
  } catch (err) {
    console.error('Video page error:', err);
    res.status(500).send('Error loading video');
  }
};
