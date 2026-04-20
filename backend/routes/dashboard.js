const express  = require('express');
const router   = express.Router();
const Course   = require('../models/Course');
const User     = require('../models/User');
const { Enrollment, Progress, Certificate, QuizAttempt, Submission } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');

// GET /api/dashboard/student
router.get('/student', protect, async (req, res) => {
  try {
    const uid = req.user._id;
    const enrollments = await Enrollment.find({ student:uid })
      .populate({ path:'course', populate:{ path:'teacher', select:'firstName lastName avatar' } });

    const active    = enrollments.filter(e=>e.status==='active').length;
    const completed = enrollments.filter(e=>e.status==='completed').length;
    const certs     = await Certificate.countDocuments({ student:uid, status:'issued' });
    const recent    = await QuizAttempt.find({ student:uid }).sort({createdAt:-1}).limit(5);
    const avgScore  = recent.length ? Math.round(recent.reduce((s,a)=>s+a.score,0)/recent.length) : 0;

    const courseProgress = await Promise.all(enrollments.slice(0,6).map(async enr => {
      if (!enr.course) return null;
      const total = enr.course.lessons ? enr.course.lessons.length : 0;
      const done  = await Progress.countDocuments({ student:uid, course:enr.course._id, completed:true });
      return { course:enr.course, completionPercentage:total>0?Math.round(done/total*100):0, completedLessons:done, totalLessons:total, status:enr.status };
    }));

    const now = new Date();
    const myCourseIds = enrollments.map(e=>e.course?._id).filter(Boolean);
    const coursesWithMeets = await Course.find({ _id:{$in:myCourseIds}, 'meets.scheduledAt':{$gte:now} })
      .select('title meets').populate('teacher','firstName lastName');
    const upcomingMeets = [];
    coursesWithMeets.forEach(c => {
      c.meets?.filter(m=>m.scheduledAt>=now && m.status!=='ended').forEach(m => {
        upcomingMeets.push({ ...m.toObject(), courseTitle:c.title, teacher:c.teacher });
      });
    });
    upcomingMeets.sort((a,b)=>new Date(a.scheduledAt)-new Date(b.scheduledAt));

    res.json({
      success:true,
      stats:{ totalEnrolled:enrollments.length, activeCourses:active, completedCourses:completed, certificates:certs, avgQuizScore:avgScore, totalPoints:req.user.totalPoints },
      courseProgress: courseProgress.filter(Boolean),
      upcomingMeets: upcomingMeets.slice(0,5),
      recentAttempts: recent,
      user:{ level:req.user.level, levelProgress:req.user.levelProgress, totalPoints:req.user.totalPoints }
    });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /api/dashboard/teacher
router.get('/teacher', protect, authorize('teacher','admin'), async (req, res) => {
  try {
    const uid = req.user._id;
    const myCourses = await Course.find({ teacher:uid });
    const courseIds = myCourses.map(c=>c._id);
    const totalStudents   = await Enrollment.distinct('student', { course:{$in:courseIds} });
    const pendingGrades   = await Submission.countDocuments({ course:{$in:courseIds}, status:'submitted' });
    const totalEnrollments= await Enrollment.countDocuments({ course:{$in:courseIds} });

    const coursesWithStats = await Promise.all(myCourses.map(async c => {
      const enrolled  = await Enrollment.countDocuments({ course:c._id });
      const completed = await Enrollment.countDocuments({ course:c._id, status:'completed' });
      return { _id:c._id, title:c.title, category:c.category, thumbnail:c.thumbnail, enrolled, completed, isPublished:c.isPublished, lessonCount:c.lessons.length };
    }));

    const now = new Date();
    const upcomingMeets = [];
    myCourses.forEach(c => {
      c.meets?.filter(m=>m.scheduledAt>=now && m.status!=='ended').forEach(m => {
        upcomingMeets.push({ ...m.toObject(), courseTitle:c.title, courseId:c._id });
      });
    });
    upcomingMeets.sort((a,b)=>new Date(a.scheduledAt)-new Date(b.scheduledAt));

    const recentSubmissions = await Submission.find({ course:{$in:courseIds} })
      .populate('student','firstName lastName avatar studentId')
      .populate('course','title')
      .sort({ submittedAt:-1 }).limit(8);

    res.json({
      success:true,
      stats:{ totalCourses:myCourses.length, totalStudents:totalStudents.length, totalEnrollments, pendingGrades },
      courses: coursesWithStats,
      upcomingMeets: upcomingMeets.slice(0,5),
      recentSubmissions
    });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /api/dashboard/admin
router.get('/admin', protect, authorize('admin'), async (req, res) => {
  try {
    const [students,teachers,courses,enrollments,certs] = await Promise.all([
      User.countDocuments({ role:'student' }),
      User.countDocuments({ role:'teacher' }),
      Course.countDocuments({ isPublished:true }),
      Enrollment.countDocuments(),
      Certificate.countDocuments({ status:'issued' })
    ]);
    const recentUsers = await User.find().sort({createdAt:-1}).limit(10)
      .select('firstName lastName email role campus createdAt isActive');
    const popularCourses = await Course.find({ isPublished:true }).sort({enrollmentCount:-1}).limit(5)
      .select('title enrollmentCount category').populate('teacher','firstName lastName');

    res.json({
      success:true,
      stats:{ students, teachers, courses, enrollments, certificates:certs },
      recentUsers, popularCourses
    });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
