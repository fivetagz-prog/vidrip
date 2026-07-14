const { list } = require('@vercel/blob');

module.exports = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).send('Missing ID');

  try {
    const { blobs } = await list({
      prefix: `videos/${id}`,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      limit: 10
    });

    const videoBlob = blobs.find(b => b.pathname.startsWith(`videos/${id}`));
    if (!videoBlob) return res.status(404).send('Video not found');

    res.setHeader('Cache-Control', 'public, max-age=31536000');
    return res.redirect(302, videoBlob.url);
  } catch (err) {
    console.error('Embed error:', err);
    return res.status(500).send('Error');
  }
};
