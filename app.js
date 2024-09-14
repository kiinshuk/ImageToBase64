const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files (CSS, HTML)
app.use(express.static('public'));

// Increase body size limits for large base64 strings
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb' }));

// Multer for file uploads, storing in 'uploads/' directory
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }  // 50MB file size limit
});

// ========== Routes ==========

// Route for serving the upload page
app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// Route for handling file upload and converting to base64
app.post('/upload', upload.single('file'), (req, res) => {
  const filePath = req.file.path;

  // Read the file and convert to base64
  fs.readFile(filePath, (err, data) => {
    if (err) return res.status(500).send('File reading failed.');

    const base64String = Buffer.from(data).toString('base64');
    const fileType = req.file.mimetype;

    // Send page with base64 image, textarea, and navigation buttons
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

    // Delete the temporary file after processing
    fs.unlink(filePath, () => console.log('Temp file deleted'));
  });
});

// Route for serving the convert-back page (Base64 to File conversion)
app.get('/convert-back', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'convert.html'));
});

// Route for converting base64 back to a file and downloading it
app.post('/convert-back', (req, res) => {
  const { base64String, fileName } = req.body;
  const fileBuffer = Buffer.from(base64String, 'base64');
  const filePath = path.join(__dirname, 'uploads', fileName);

  // Write the decoded base64 file and send it as a download
  fs.writeFile(filePath, fileBuffer, (err) => {
    if (err) return res.status(500).send('Failed to write file.');

    res.download(filePath, fileName, () => {
      // Delete the file after the download completes
      fs.unlink(filePath, () => console.log('Temp file deleted after download'));
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
