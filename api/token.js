const { generateClientTokenFromReadWriteToken } = require('@vercel/blob');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let body = '';
    req.on('data', chunk => body += chunk);
    await new Promise((resolve, reject) => {
      req.on('end', resolve);
      req.on('error', reject);
    });

    const { id, filename } = JSON.parse(body || '{}');
    if (!id || !filename) {
      return res.status(400).json({ error: 'Missing id or filename' });
    }

    const ext = filename.split('.').pop().toLowerCase();
    const pathname = `videos/${id}.${ext}`;

    const token = await generateClientTokenFromReadWriteToken({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      pathname,
      maxSizeInBytes: 500 * 1024 * 1024,
      allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/avi', 'video/mpeg', 'video/ogg', 'video/x-msvideo'],
    });

    res.json({ token, pathname });
  } catch (err) {
    console.error('Token error:', err);
    res.status(500).json({ error: err.message, details: err.stack });
  }
};
