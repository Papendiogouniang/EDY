const express      = require('express');
const router       = express.Router();
const SiteSettings = require('../models/SiteSettings');
const User         = require('../models/User');
const Course       = require('../models/Course');
const { Enrollment, Notification } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');

// ── SITE SETTINGS ─────────────────────────────────────────────────────────

// GET /api/site — public (used by landing page)
router.get('/', async (req, res) => {
  try {
    let settings = await SiteSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await SiteSettings.create({
        key: 'main',
        programs: [
          { title:'Computer Science', badge:'2+2', sub:'2 yrs DUNIS + 2 yrs USA', color:'#2563eb', campuses:['Dakar','Douala'], active:true },
          { title:'Business Administration', badge:'2+2', sub:'2 yrs DUNIS + 2 yrs Abroad', color:'#d0aa31', campuses:['Dakar','Abidjan','Douala'], active:true },
          { title:'BBA — FHSU', badge:'BBA-4', sub:'4 yrs Dakar → US Degree', color:'#dc2626', campuses:['Dakar'], active:true },
          { title:'MBA — Business', badge:'1+1', sub:'1 yr DUNIS + 1 yr Abroad', color:'#059669', campuses:['Dakar','Abidjan'], active:true },
          { title:'Political Science', badge:'2+2', sub:'2 yrs DUNIS + 2 yrs Abroad', color:'#7c3aed', campuses:['Dakar','Abidjan'], active:true },
          { title:'Engineering', badge:'2+2', sub:'2 yrs DUNIS + 2 yrs Abroad', color:'#0891b2', campuses:['Dakar','Douala'], active:true },
        ]
      });
    }
    res.json({ success: true, settings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/site — admin updates settings
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    const settings = await SiteSettings.findOneAndUpdate(
      { key: 'main' },
      { ...req.body, updatedBy: req.user._id },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, settings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── ADMIN CLASS MANAGEMENT ────────────────────────────────────────────────

// GET /api/site/admin/classes — all courses with teacher + student count
router.get('/admin/classes', protect, authorize('admin'), async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('teacher', 'firstName lastName email avatar specialization')
      .sort({ createdAt: -1 });

    const data = await Promise.all(courses.map(async c => {
      const enrolled = await Enrollment.countDocuments({ course: c._id });
      return { ...c.toObject(), enrolledCount: enrolled };
    }));

    res.json({ success: true, classes: data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/site/admin/enroll — admin enrolls a student in a course
router.post('/admin/enroll', protect, authorize('admin'), async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    if (!studentId || studentId === 'undefined') return res.status(400).json({ success: false, message: 'Invalid student ID' });
    if (!courseId  || courseId  === 'undefined') return res.status(400).json({ success: false, message: 'Invalid course ID' });

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(studentId)) return res.status(400).json({ success: false, message: 'Invalid student ID format' });
    if (!mongoose.Types.ObjectId.isValid(courseId))  return res.status(400).json({ success: false, message: 'Invalid course ID format' });

    const [student, course] = await Promise.all([
      User.findById(studentId),
      Course.findById(courseId),
    ]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (!course)  return res.status(404).json({ success: false, message: 'Course not found' });

    const exists = await Enrollment.findOne({ student: studentId, course: courseId });
    if (exists) return res.status(400).json({ success: false, message: `${student.firstName} is already enrolled` });

    await Enrollment.create({ student: studentId, course: courseId, enrolledBy: req.user._id });
    await Course.findByIdAndUpdate(courseId, { $addToSet: { enrolledStudents: studentId }, $inc: { enrollmentCount: 1 } });
    await User.findByIdAndUpdate(studentId, { $addToSet: { enrolledCourses: courseId } });

    await Notification.create({
      recipient: studentId, type: 'enrollment',
      title: `Enrolled: ${course.title}`,
      message: `Admin enrolled you in ${course.title}. Start learning now!`,
      link: `/student/courses/${courseId}`
    });

    res.json({ success: true, message: `${student.firstName} ${student.lastName} enrolled in ${course.title}` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/site/admin/enroll — admin removes a student from a course
router.delete('/admin/enroll', protect, authorize('admin'), async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid IDs' });
    }
    await Enrollment.findOneAndDelete({ student: studentId, course: courseId });
    await Course.findByIdAndUpdate(courseId, { $pull: { enrolledStudents: studentId }, $inc: { enrollmentCount: -1 } });
    await User.findByIdAndUpdate(studentId, { $pull: { enrolledCourses: courseId } });
    res.json({ success: true, message: 'Student removed from course' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/site/admin/classes/:courseId/students — students in a course (with unenrolled list)
router.get('/admin/classes/:courseId/students', protect, authorize('admin'), async (req, res) => {
  try {
    const enrolled = await Enrollment.find({ course: req.params.courseId })
      .populate('student', 'firstName lastName email studentId campus avatar level');
    const allStudents = await User.find({ role: 'student', isActive: true })
      .select('firstName lastName email studentId campus avatar level');
    const enrolledIds = new Set(enrolled.map(e => e.student?._id?.toString()));
    const notEnrolled = allStudents.filter(s => !enrolledIds.has(s._id.toString()));
    res.json({ success: true, enrolled, notEnrolled });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/site/admin/courses/:id/teacher — assign/change teacher
router.put('/admin/courses/:id/teacher', protect, authorize('admin'), async (req, res) => {
  try {
    const { teacherId } = req.body;
    const course = await Course.findByIdAndUpdate(req.params.id, { teacher: teacherId }, { new: true })
      .populate('teacher', 'firstName lastName email');
    // Update teacher's teaching courses list
    await User.findByIdAndUpdate(teacherId, { $addToSet: { teachingCourses: req.params.id } });
    res.json({ success: true, course });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
