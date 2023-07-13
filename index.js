const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/public', express.static(`${process.cwd()}/public`));

const urls = [];

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your API endpoint to shorten a URL
app.post('/api/shorturl', function(req, res) {
  const url = req.body.url;

  // Check if the URL is valid (you can use a library like 'valid-url' for more robust validation)
  if (!url || !url.startsWith('http')) {
    res.json({ error: "Invalid URL" });
    return;
  }

  // Generate a random short URL
  const shortUrl = Math.random().toString(36).substring(7);

  // Store the original and short URL in the array
  urls.push({ original_url: url, short_url: shortUrl });

  res.json({ original_url: url, short_url: shortUrl });
});

// Redirect to the original URL when the short URL is accessed
app.get('/api/shorturl/:shortUrl', function(req, res) {
  const shortUrl = req.params.shortUrl;

  // Find the corresponding URL in the array
  const urlDoc = urls.find(url => url.short_url === shortUrl);

  if (!urlDoc) {
    res.json({ error: "Invalid short URL" });
    return;
  }

  res.redirect(urlDoc.original_url);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
