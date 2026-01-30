const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const app = express();
const PORT = process.env.PORT || 1000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload folder
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer setup
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// API: Protect PDF with password
app.post("/protect", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No PDF uploaded");

    const password = req.body.password;
    if (!password) return res.status(400).send("Password required");

    const inputPath = req.file.path;
    const pdfBytes = fs.readFileSync(inputPath);

    const pdfDoc = await PDFDocument.load(pdfBytes);

    pdfDoc.encrypt({
      userPassword: password,
      ownerPassword: password,
      permissions: {
        printing: "highResolution",
        modifying: false,
        copying: false,
        annotating: false
      }
    });

    const protectedPdf = await pdfDoc.save();

    // Cleanup uploaded file
    fs.unlinkSync(inputPath);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="protected.pdf"`
    });

    res.send(Buffer.from(protectedPdf));
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to protect PDF");
  }
});

app.listen(PORT, () => {
  console.log(`✅ PDF Protector running on port ${PORT}`);
});

