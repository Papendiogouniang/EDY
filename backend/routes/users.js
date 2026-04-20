// routes/users.js
const express  = require('express');
const router   = express.Router();
const User     = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, campus, search } = req.query;
    const filter = {};
    if (role)   filter.role   = role;
    if (campus) filter.campus = campus;
    if (search) filter.$or = [
      { firstName:{ $regex:search, $options:'i' } },
      { lastName:{ $regex:search, $options:'i' } },
      { email:{ $regex:search, $options:'i' } }
    ];
    const users = await User.find(filter).select('-password').sort({ createdAt:-1 });
    res.json({ success:true, users });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/teachers/list', protect, async (req, res) => {
  try {
    const teachers = await User.find({ role:'teacher', isActive:true })
      .select('firstName lastName email avatar specialization campus');
    res.json({ success:true, teachers });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success:false, message:'User not found' });
    res.json({ success:true, user });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.put('/:id/role', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role:req.body.role }, { new:true }).select('-password');
    res.json({ success:true, user });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.put('/:id/toggle-active', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave:false });
    res.json({ success:true, user, message:`User ${user.isActive?'activated':'suspended'}` });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success:true, message:'User deleted' });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// POST /api/users — Admin creates a new user
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, campus, program, specialization } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: 'firstName, lastName, email and password are required' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });
    
    const count = await User.countDocuments({ role: role || 'student' });
    const studentId = (role || 'student') === 'student'
      ? 'DUNIS-' + new Date().getFullYear() + '-' + String(count + 1).padStart(4, '0')
      : null;
    
    const user = await User.create({
      firstName, lastName,
      email: email.toLowerCase(),
      password,
      role: role || 'student',
      campus: campus || 'Dakar',
      program: program || '',
      specialization: specialization || '',
      studentId,
      isActive: true,
    });
    res.status(201).json({ success: true, user: { _id: user._id, firstName, lastName, email: user.email, role: user.role, campus: user.campus, studentId: user.studentId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
