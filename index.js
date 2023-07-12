const express = require('express');
const dns = require('dns');
const { MongoClient } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

const client = new MongoClient(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(express.json());

// Connect to the MongoDB database
client.connect(err => {
  if (err) {
    console.error('Failed to connect to the database');
    process.exit(1);
  }
  
  console.log('Connected to the database');
  
  const db = client.db('urlshortener');
  const urls = db.collection('urls');
  
  // Route to handle URL shortening
  app.post('/api/shorturl', async (req, res) => {
    const { url } = req.body;
    
    // Validate the URL format
    const urlPattern = /^https?:\/\/(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+(\/\S*)?$/;
    if (!urlPattern.test(url)) {
      return res.json({ error: 'invalid url' });
    }
    
    try {
      // Check if the URL already exists in the database
      const existingUrl = await urls.findOne({ original_url: url });
      if (existingUrl) {
        return res.json({
          original_url: existingUrl.original_url,
          short_url: existingUrl.short_url
        });
      }
      
      // Insert the new URL into the database
      const urlCount = await urls.countDocuments();
      const newUrl = { original_url: url, short_url: urlCount + 1 };
      await urls.insertOne(newUrl);
      
      res.json({
        original_url: newUrl.original_url,
        short_url: newUrl.short_url
      });
    } catch (error) {
      console.error('Error while shortening the URL:', error);
      res.status(500).json({ error: 'internal server error' });
    }
  });
  
  // Route to handle URL redirection
  app.get('/api/shorturl/:short_url', async (req, res) => {
    const { short_url } = req.params;
    
    try {
      const urlDoc = await urls.findOne({ short_url: parseInt(short_url) });
      
      if (!urlDoc) {
        return res.json({ error: 'url not found' });
      }
      
      res.redirect(urlDoc.original_url);
    } catch (error) {
      console.error('Error while redirecting to the original URL:', error);
      res.status(500).json({ error: 'internal server error' });
    }
  });
  
  // Start the server
  app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
});
