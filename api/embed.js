const { list } = require('@vercel/blob');

module.exports = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).send('Missing ID');

  try {
    const { blobs: metaBlobs } = await list({
      prefix: `meta/${id}`,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      limit: 10
    });
    
    const metaBlob = metaBlobs.find(b => b.pathname === `meta/${id}.json`);
    if (!metaBlob) return res.status(404).send('Video not found');
    
    const metaRes = await fetch(metaBlob.url);
    const meta = await metaRes.json();
    
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    return res.redirect(302, meta.url);
  } catch (err) {
    console.error('Embed error:', err);
    return res.status(500).send('Error');
  }
};
