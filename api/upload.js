const { handleUpload } = require('@vercel/blob/client');

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

    const jsonBody = JSON.parse(body || '{}');

    const jsonResponse = await handleUpload({
      body: jsonBody,
      request: req,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname, clientPayload, multipart) => {
        const ext = pathname.split('.').pop().toLowerCase();
        const allowed = ['mp4', 'webm', 'mov', 'mkv', 'avi', 'mpeg', 'ogv', 'm4v'];
        if (!allowed.includes(ext)) {
          throw new Error('Unsupported file type. Allowed: MP4, WebM, MOV, MKV, AVI, MPEG, OGV, M4V');
        }

        return {
          allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/avi', 'video/mpeg', 'video/ogg', 'video/x-m4v'],
          maximumSizeInBytes: 500 * 1024 * 1024,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({ originalName: pathname, uploadedAt: Date.now() }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload completed:', blob.url);
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(400).json({ error: err.message });
  }
};
