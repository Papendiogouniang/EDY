const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User     = require('../models/User');
const { protect } = require('../middleware/auth');

const DOMAIN   = process.env.ALLOWED_EMAIL_DOMAIN || 'dunis.africa';
const genToken = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const sanitize = u => ({
  id: u._id, firstName: u.firstName, lastName: u.lastName,
  email: u.email, role: u.role, campus: u.campus, program: u.program,
  avatar: u.avatar, studentId: u.studentId, bio: u.bio,
  level: u.level, levelProgress: u.levelProgress, totalPoints: u.totalPoints,
  specialization: u.specialization, officeHours: u.officeHours,
  badges: u.badges, streak: u.streak, isActive: u.isActive
});

// POST /api/auth/register
router.post('/register', [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().custom(v => {
    if (!v.toLowerCase().endsWith(`@${DOMAIN}`))
      throw new Error(`Only @${DOMAIN} emails are allowed (e.g. yourname@${DOMAIN})`);
    return true;
  }),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['student','teacher'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });

  try {
    const { firstName, lastName, email, password, role, campus, program, specialization } = req.body;
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const count = await User.countDocuments({ role: 'student' });
    const studentId = (role || 'student') === 'student'
      ? `DUNIS-${new Date().getFullYear()}-${String(count + 1).padStart(4,'0')}` : '';

    const user  = await User.create({ firstName, lastName, email: email.toLowerCase(), password, role: role||'student', campus, program, specialization, studentId });
    const token = genToken(user._id);
    res.status(201).json({ success: true, token, user: sanitize(user) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Manual validation - no express-validator
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }
    if (typeof password !== 'string' || password.length < 1) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account suspended. Contact your administrator.' });
    }
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, token: genToken(user._id), user: sanitize(user) });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json({ success: true, user: sanitize(req.user) }));

// PUT /api/auth/update-profile
router.put('/update-profile', protect, async (req, res) => {
  try {
    const allowed = ['firstName','lastName','bio','campus','program','avatar','specialization','officeHours','language'];
    const update  = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
    res.json({ success: true, user: sanitize(user) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/auth/change-password
router.put('/change-password', protect, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = req.body.newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
