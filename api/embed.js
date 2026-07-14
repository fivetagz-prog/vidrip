const { head } = require('@vercel/blob');

module.exports = async (req, res) => {
  const { id } = req.query;

  // Try to find the blob by listing or using a known pattern
  // Since we can't list easily, we redirect to the blob URL
  // In production you'd store the mapping in a DB

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=31536000');

  // Return a minimal HTML with video that Discord can parse
  res.status(200).send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta property="og:type" content="video.other">
  <meta property="og:video" content="${req.url}">
  <meta property="og:video:type" content="video/mp4">
  <meta property="og:video:width" content="1280">
  <meta property="og:video:height" content="720">
  <style>body{margin:0;background:#000;}video{width:100vw;height:100vh;}</style>
</head>
<body>
  <video controls autoplay playsinline src="${req.url}"></video>
</body>
</html>`);
};
