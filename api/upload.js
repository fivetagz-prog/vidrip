const { put } = require('@vercel/blob');
const { kv } = require('@vercel/kv');
const { v4: uuidv4 } = require('uuid');
const Busboy = require('busboy');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!process.env.KV_URL && !process.env.KV_REST_API_URL) {
      return res.status(500).json({ 
        error: 'Vercel KV not configured. Go to Vercel Dashboard > Storage > Create KV Database and connect it to this project.' 
      });
    }

    const busboy = Busboy({ headers: req.headers });
    let fileBuffer = Buffer.alloc(0);
    let fileName = '';
    let mimeType = '';
    let title = '';

    busboy.on('file', (fieldname, file, info) => {
      fileName = info.filename;
      mimeType = info.mimeType || 'video/mp4';
      file.on('data', (data) => {
        fileBuffer = Buffer.concat([fileBuffer, data]);
      });
    });

    busboy.on('field', (fieldname, value) => {
      if (fieldname === 'title') title = value;
    });

    await new Promise((resolve, reject) => {
      busboy.on('finish', resolve);
      busboy.on('error', reject);
      req.pipe(busboy);
    });

    if (fileBuffer.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const ext = fileName.split('.').pop().toLowerCase();
    const allowedExts = ['mp4', 'webm', 'mov', 'mkv', 'avi', 'mpeg', 'ogv', 'm4v'];
    if (!allowedExts.includes(ext)) {
      return res.status(400).json({ error: 'Unsupported file type. Allowed: MP4, WebM, MOV, MKV, AVI, MPEG, OGV, M4V' });
    }
    if (fileBuffer.length > 500 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large. Max 500MB.' });
    }

    const id = uuidv4().replace(/-/g, '').substring(0, 12);
    const blobName = `videos/${id}.${ext}`;

    const blob = await put(blobName, fileBuffer, {
      access: 'public',
      contentType: mimeType,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    await kv.set(`video:${id}`, JSON.stringify({
      id,
      url: blob.url,
      title: title || fileName,
      filename: fileName,
      type: mimeType,
      size: fileBuffer.length,
      createdAt: Date.now()
    }), { ex: 60 * 60 * 24 * 365 });

    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
    
    return res.status(200).json({
      success: true,
      id,
      url: `${baseUrl}/v/${id}`,
      embedUrl: `${baseUrl}/embed/${id}`,
      directUrl: blob.url,
      title: title || fileName,
      size: fileBuffer.length,
      type: mimeType
    });

  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Upload failed', details: err.message });
  }
};
