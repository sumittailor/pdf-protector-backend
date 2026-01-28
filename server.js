const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure folders exist
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('protected')) fs.mkdirSync('protected');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});
const upload = multer({ storage });

// Endpoint to protect PDF
app.post('/protect', upload.single('pdf'), (req, res) => {
  const password = req.body.password;
  const inputFile = req.file.path;
  const outputFile = path.join('protected', req.file.originalname);

  const cmd = `qpdf --encrypt ${password} ${password} 256 -- "${inputFile}" "${outputFile}"`;

  exec(cmd, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error protecting PDF');
    }
    res.download(outputFile);
  });
});

app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
