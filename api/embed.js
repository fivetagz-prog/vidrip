const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).send('Missing ID');

  try {
    const raw = await kv.get(`video:${id}`);
    if (!raw) return res.status(404).send('Video not found');
    
    const meta = typeof raw === 'string' ? JSON.parse(raw) : raw;
    
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    return res.redirect(302, meta.url);
  } catch (err) {
    console.error('Embed error:', err);
    return res.status(500).send('Error');
  }
};
