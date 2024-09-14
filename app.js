const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Use environment port if available

// Serve static files (CSS, HTML)
app.use(express.static('public'));

// Increase body size limits for large base64 strings
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb' }));

// Multer for file uploads, storing in 'uploads/' directory
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB file size limit
});

// ========== Routes ==========

// Route for serving the upload page
app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// Route for handling file upload and converting to base64
app.post('/upload', upload.single('file'), (req, res) => {
  const filePath = req.file.path;

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error('File reading failed:', err);
      return res.status(500).send('File reading failed.');
    }

    const base64String = Buffer.from(data).toString('base64');
    const fileType = req.file.mimetype;

    res.send(`
      <html>
      <head><link rel="stylesheet" href="/style.css"></head>
      <body>
      <div class="container">
        <h3>File uploaded successfully!</h3>
        <img src="data:${fileType};base64,${base64String}" alt="Uploaded Image" />
        <textarea rows="10" cols="50">${base64String}</textarea>
        <br/>
        <a href="/convert-back">Convert Base64 back to File</a><br/><br/>
        <button onclick="window.location.href='/upload';">Upload Another File</button>
      </div>
      </body>
      </html>
    `);

    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) console.error('Failed to delete temp file:', unlinkErr);
      else console.log('Temp file deleted');
    });
  });
});

// Route for serving the convert-back page (Base64 to File conversion)
app.get('/convert-back', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'convert.html'));
});

// Route for converting base64 back to a file and downloading it
app.post('/convert-back', (req, res) => {
  const { base64String, fileName } = req.body;

  if (!base64String || !fileName) {
    console.error('Base64 string or file name missing.');
    return res.status(400).send('Base64 string or file name missing.');
  }

  const fileBuffer = Buffer.from(base64String, 'base64');
  const filePath = path.join(__dirname, 'uploads', fileName);

  fs.writeFile(filePath, fileBuffer, (err) => {
    if (err) {
      console.error('Failed to write file:', err);
      return res.status(500).send('Failed to write file.');
    }

    res.download(filePath, fileName, () => {
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error('Failed to delete temp file after download:', unlinkErr);
        else console.log('Temp file deleted after download');
      });
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
