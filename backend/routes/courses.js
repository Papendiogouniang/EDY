const express  = require('express');
const router   = express.Router();
const Course   = require('../models/Course');
const User     = require('../models/User');
const { Enrollment, Progress, Notification } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');

// GET /api/courses — public catalog
router.get('/', protect, async (req, res) => {
  try {
    const { category, level, campus, program, search } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (level)    filter.level    = level;
    if (campus)   filter.campus   = { $in: [campus, 'All'] };
    if (program)  filter.program  = { $regex: program, $options: 'i' };
    if (search)   filter.$or = [
      { title:       { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
    const courses = await Course.find(filter)
      .populate('teacher','firstName lastName avatar specialization')
      .select('-lessons.content -meets')
      .sort({ enrollmentCount: -1 });
    res.json({ success: true, count: courses.length, courses });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/courses/my — Teacher's courses
router.get('/my', protect, authorize('teacher','admin'), async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user._id })
      .populate('teacher','firstName lastName avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, courses });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/courses/enrolled — Student's enrolled courses (with progress)
router.get('/enrolled', protect, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id, status:{$ne:'dropped'} })
      .populate({
        path: 'course',
        select: 'title description shortDesc category level language campus thumbnail duration lessons meets enrollmentCount rating isFree hasCertificate academicYear program',
        populate: { path:'teacher', select:'firstName lastName avatar specialization' }
      });

    // Enrich with completionPercentage
    const enriched = await Promise.all(enrollments.map(async enr => {
      if (!enr.course) return enr.toObject();
      const totalLessons = enr.course.lessons?.length || 0;
      if (totalLessons === 0) return { ...enr.toObject(), completionPercentage: 0, completedLessons: 0, totalLessons: 0 };
      const done = await Progress.countDocuments({ student: req.user._id, course: enr.course._id, completed: true });
      const pct  = Math.round(done / totalLessons * 100);
      return { ...enr.toObject(), completionPercentage: pct, completedLessons: done, totalLessons };
    }));

    res.json({ success: true, enrollments: enriched });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/courses/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher','firstName lastName avatar bio specialization officeHours')
      .populate('enrolledStudents','firstName lastName avatar studentId campus');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, course });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/courses
router.post('/', protect, authorize('teacher','admin'), async (req, res) => {
  try {
    const course = await Course.create({ ...req.body, teacher: req.user._id });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { teachingCourses: course._id } });
    res.status(201).json({ success: true, course });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/courses/:id
router.put('/:id', protect, authorize('teacher','admin'), async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, teacher: req.user._id };
    const course = await Course.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found or unauthorized' });
    res.json({ success: true, course });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/courses/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Course deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/courses/:id/lessons
router.post('/:id/lessons', protect, authorize('teacher','admin'), async (req, res) => {
  try {
    // Admin can add lessons to any course; teacher only to their own
    const query = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, teacher: req.user._id };
    const course = await Course.findOne(query);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found or unauthorized' });
    course.lessons.push({ ...req.body, order: course.lessons.length + 1 });
    await course.save();
    res.status(201).json({ success: true, course });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/courses/:id/lessons/:lessonId
router.put('/:id/lessons/:lessonId', protect, authorize('teacher','admin'), async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, teacher: req.user._id };
    const course = await Course.findOne(query);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found or unauthorized' });
    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    Object.assign(lesson, req.body);
    await course.save();
    res.json({ success: true, course });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/courses/:id/lessons/:lessonId
router.delete('/:id/lessons/:lessonId', protect, authorize('teacher','admin'), async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, teacher: req.user._id };
    const course = await Course.findOne(query);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found or unauthorized' });
    course.lessons.pull({ _id: req.params.lessonId });
    await course.save();
    res.json({ success: true, course });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/courses/:id/meets — Schedule live session
router.post('/:id/meets', protect, authorize('teacher','admin'), async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, teacher: req.user._id };
    const course = await Course.findOne(query);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found or unauthorized' });
    course.meets.push(req.body);
    await course.save();
    const notifications = course.enrolledStudents.map(sid => ({
      recipient: sid, type: 'new_meet',
      title: `New live class: ${req.body.title}`,
      message: `${course.title} — ${new Date(req.body.scheduledAt).toLocaleString()}`,
      link: `/student/courses/${course._id}`
    }));
    if (notifications.length) await Notification.insertMany(notifications);
    res.status(201).json({ success: true, course });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/courses/:id/students — Teacher class roster
router.get('/:id/students', protect, authorize('teacher','admin'), async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ course: req.params.id })
      .populate('student','firstName lastName email avatar studentId campus program level totalPoints');
    const course = await Course.findById(req.params.id).select('lessons');
    const data = await Promise.all(enrollments.map(async enr => {
      const total = course.lessons.length;
      const done  = await Progress.countDocuments({ student: enr.student?._id, course: req.params.id, completed: true });
      return { ...enr.toObject(), completionPercentage: total>0?Math.round(done/total*100):0, completedLessons: done, totalLessons: total };
    }));
    res.json({ success: true, students: data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/courses/:id/enroll — Enroll a student
router.post('/:id/enroll', protect, async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.body.studentId || req.user._id;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    const exists = await Enrollment.findOne({ student: studentId, course: courseId });
    if (exists) return res.status(400).json({ success: false, message: 'Already enrolled' });
    const enrollment = await Enrollment.create({ student: studentId, course: courseId, enrolledBy: req.user._id });
    await Course.findByIdAndUpdate(courseId, { $addToSet:{enrolledStudents:studentId}, $inc:{enrollmentCount:1} });
    await User.findByIdAndUpdate(studentId, { $addToSet:{enrolledCourses:courseId} });
    await Notification.create({
      recipient: studentId, type: 'enrollment',
      title: `Enrolled: ${course.title}`,
      message: `Welcome to ${course.title}!`,
      link: `/student/courses/${courseId}`
    });
    res.status(201).json({ success: true, enrollment });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/courses/:id/enrollment-check
router.get('/:id/enrollment-check', protect, async (req, res) => {
  try {
    const enr = await Enrollment.findOne({ student: req.user._id, course: req.params.id });
    res.json({ success: true, isEnrolled: !!enr, enrollment: enr });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;

// POST /api/courses/:id/meets/:meetId/attendance — Save meet attendance
router.post('/:id/meets/:meetId/attendance', protect, authorize('teacher','admin'), async (req, res) => {
  try {
    const query  = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, teacher: req.user._id };
    const course = await Course.findOne(query);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    const meet   = course.meets.id(req.params.meetId);
    if (!meet)   return res.status(404).json({ success: false, message: 'Session not found' });

    const { present = [], absent = [] } = req.body;
    // Store attendance data
    meet.attendance = { present, absent, savedAt: new Date() };
    meet.status = 'ended';
    await course.save();

    // Optionally notify absent students
    if (absent.length > 0) {
      const { Notification } = require('../models/index');
      const notifications = absent.map(sid => ({
        recipient: sid, type: 'course_update',
        title: `Missed class: ${meet.title}`,
        message: `You were absent from "${meet.title}" on ${new Date(meet.scheduledAt).toLocaleDateString()}. Check for a recording.`,
        link: `/student/courses/${course._id}`
      }));
      await Notification.insertMany(notifications).catch(() => {});
    }

    res.json({ success: true, meet, presentCount: present.length, absentCount: absent.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/courses/:id/meets/:meetId/recording — Save recording URL
router.put('/:id/meets/:meetId/recording', protect, authorize('teacher','admin'), async (req, res) => {
  try {
    const query  = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, teacher: req.user._id };
    const course = await Course.findOne(query);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    const meet   = course.meets.id(req.params.meetId);
    if (!meet)   return res.status(404).json({ success: false, message: 'Session not found' });
    meet.recordingUrl = req.body.recordingUrl;
    meet.isRecorded   = true;
    meet.status       = 'ended';
    await course.save();

    // Notify enrolled students about recording
    const { Notification } = require('../models/index');
    const notifications = course.enrolledStudents.map(sid => ({
      recipient: sid, type: 'course_update',
      title: `Recording available: ${meet.title}`,
      message: `The recording of "${meet.title}" is now available. Watch it anytime!`,
      link: `/student/courses/${course._id}`
    }));
    if (notifications.length) await Notification.insertMany(notifications).catch(() => {});

    res.json({ success: true, meet });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
