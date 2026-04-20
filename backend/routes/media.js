const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { protect, authorize } = require('../middleware/auth');

// ── Storage config ────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'files');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const imgTypes = /jpeg|jpg|png|gif|webp/;
  const pdfTypes = /pdf/;
  const extname  = path.extname(file.originalname).toLowerCase().replace('.','');
  const isImage  = imgTypes.test(extname) && imgTypes.test(file.mimetype);
  const isPdf    = pdfTypes.test(extname) && (file.mimetype === 'application/pdf');
  if (isImage || isPdf) return cb(null, true);
  cb(new Error('Only images (jpg, png, gif, webp) and PDFs are allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB for PDFs

// ── Routes ────────────────────────────────────────────────────────────────

// POST /api/media/upload — Admin uploads an image
router.post('/upload', protect, authorize('admin', 'teacher'), upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const url = `${req.protocol}://${req.get('host')}/uploads/files/${req.file.filename}`;
  res.json({ success: true, url, filename: req.file.filename, size: req.file.size });
});

// GET /api/media/images — List all uploaded images
router.get('/images', protect, authorize('admin'), (req, res) => {
  try {
    const dir = path.join(__dirname, '..', 'uploads', 'files');
    if (!fs.existsSync(dir)) return res.json({ success: true, images: [] });
    const files = fs.readdirSync(dir)
      .filter(f => /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(f))
      .map(f => ({
        filename: f,
        url: `${req.protocol}://${req.get('host')}/uploads/files/${f}`,
        size: fs.statSync(path.join(dir, f)).size,
        createdAt: fs.statSync(path.join(dir, f)).birthtime
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, images: files });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/media/:filename
router.delete('/:filename', protect, authorize('admin'), (req, res) => {
  try {
    const filePath = path.join(__dirname, '..', 'uploads', 'files', req.params.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ success: true, message: 'Image deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
