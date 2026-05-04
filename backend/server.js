const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const compression= require('compression');
const rateLimit  = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ── Security & Performance ────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'https://edy-9vfmt1von-pape-ndiogou-niangs-projects.vercel.app',
    'https://edy-omega.vercel.app'
  ],
  credentials: true
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: { success:false, message:'Too many requests' } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// ── MongoDB ───────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => console.log(`✅ MongoDB Atlas connected [${process.env.NODE_ENV}]`))
  .catch(err => { console.error('❌ MongoDB connection failed:', err.message); process.exit(1); });

// ── Guard against undefined/invalid ObjectId in params ──────────────────
app.use((req, res, next) => {
  const id = req.params.id || req.params.courseId || req.params.quizId;
  if (id && id !== 'new' && !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: `Invalid ID: ${id}` });
  }
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/courses',   require('./routes/courses'));
app.use('/api',           require('./routes/learning'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/chatbot',   require('./routes/chatbot'));
app.use('/api/media',     require('./routes/media'));
app.use('/api/site',      require('./routes/site'));

// Serve uploaded files statically
const path = require('path');
const fs   = require('fs');
// Create upload directories on startup
['uploads/images','uploads/files'].forEach(dir => {
  const p = path.join(__dirname, dir);
  if (!fs.existsSync(p)) { fs.mkdirSync(p, { recursive: true }); }
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({
  status: 'ok',
  platform: 'DUNIS Africa E-Learning v3',
  environment: process.env.NODE_ENV,
  timestamp: new Date().toISOString()
}));

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));

// ── Global error handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({ success: false, message: err.message || 'Internal Server Error' });
});

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DUNIS E-Learning API running on port ${PORT}`);
  console.log(`🌍 Allowed email domain: @${process.env.ALLOWED_EMAIL_DOMAIN || 'dunis.africa'}`);
});

module.exports = app;
