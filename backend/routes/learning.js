const express  = require('express');
const router   = express.Router();
const Course   = require('../models/Course');
const User     = require('../models/User');
const { Quiz, QuizAttempt, Submission, Certificate, Enrollment, Progress, Notification } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// ── PROGRESS ──────────────────────────────────────────────────────────────
router.post('/progress', protect, async (req, res) => {
  try {
    const { courseId, lessonId, watchedTime = 0 } = req.body;
    let prog = await Progress.findOne({ student: req.user._id, course: courseId, lesson: lessonId });
    if (!prog) prog = await Progress.create({ student:req.user._id, course:courseId, lesson:lessonId, completed:true, watchedTime, completedAt:new Date() });
    else { prog.completed=true; prog.watchedTime=watchedTime; prog.completedAt=new Date(); await prog.save(); }

    const course = await Course.findById(courseId);
    const total  = course.lessons.length;
    const done   = await Progress.countDocuments({ student:req.user._id, course:courseId, completed:true });
    const pct    = total > 0 ? Math.round(done/total*100) : 0;

    if (done >= total) {
      await Enrollment.findOneAndUpdate({ student:req.user._id, course:courseId }, { status:'completed', completedAt:new Date() });
      const user = await User.findById(req.user._id);
      user.totalPoints += 100;
      user.updateLevel();
      await user.save({ validateBeforeSave:false });
      // Auto-issue certificate
      if (!await Certificate.findOne({ student:req.user._id, course:courseId })) {
        const cert = await Certificate.create({
          student:req.user._id, course:courseId, teacher:course.teacher,
          certificateId: `DUNIS-CERT-${uuidv4().substring(0,8).toUpperCase()}`,
          finalScore: pct
        });
        await User.findByIdAndUpdate(req.user._id, { $addToSet:{ certificates:cert._id, completedCourses:courseId } });
        await Notification.create({
          recipient:req.user._id, type:'certificate_issued',
          title:`Certificate issued: ${course.title}`,
          message:`Your certificate ID: ${cert.certificateId}`,
          link:`/student/certificates`
        });
      }
    }
    res.json({ success:true, prog, completionPercentage:pct, completedLessons:done, totalLessons:total });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/progress/:courseId', protect, async (req, res) => {
  try {
    const list   = await Progress.find({ student:req.user._id, course:req.params.courseId });
    const course = await Course.findById(req.params.courseId);
    const total  = course ? course.lessons.length : 0;
    const done   = list.filter(p=>p.completed).length;
    res.json({ success:true, progressList:list, completionPercentage:total>0?Math.round(done/total*100):0, completedLessons:done, totalLessons:total });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// ── ASSIGNMENTS ───────────────────────────────────────────────────────────
router.post('/assignments/submit', protect, async (req, res) => {
  try {
    const { courseId, lessonId, content, fileUrl, links } = req.body;
    let sub = await Submission.findOne({ student:req.user._id, course:courseId, lessonId });
    if (sub) { sub.content=content; sub.fileUrl=fileUrl; sub.links=links; sub.status='submitted'; sub.submittedAt=new Date(); await sub.save(); }
    else { sub = await Submission.create({ student:req.user._id, course:courseId, lessonId, content, fileUrl, links }); }
    const course = await Course.findById(courseId).select('teacher title');
    await Notification.create({
      recipient:course.teacher, type:'message',
      title:`New assignment submission`,
      message:`${req.user.firstName} ${req.user.lastName} submitted for ${course.title}`,
      link:`/teacher/courses/${courseId}`
    });
    res.status(201).json({ success:true, submission:sub });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/assignments/course/:courseId', protect, authorize('teacher','admin'), async (req, res) => {
  try {
    const subs = await Submission.find({ course:req.params.courseId })
      .populate('student','firstName lastName avatar studentId email');
    res.json({ success:true, submissions:subs });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/assignments/my/:courseId', protect, async (req, res) => {
  try {
    const subs = await Submission.find({ student:req.user._id, course:req.params.courseId });
    res.json({ success:true, submissions:subs });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.put('/assignments/:id/grade', protect, authorize('teacher','admin'), async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const sub = await Submission.findByIdAndUpdate(req.params.id,
      { grade, feedback, status:'graded', gradedBy:req.user._id, gradedAt:new Date() },
      { new:true }
    ).populate('student','firstName lastName');
    const course = await Course.findById(sub.course).select('title');
    await Notification.create({
      recipient:sub.student._id, type:'assignment_graded',
      title:`Assignment graded: ${grade}/100`,
      message:`Your work in "${course.title}" was graded. ${feedback?`Feedback: ${feedback}`:''}`,
      link:`/student/courses/${sub.course}`
    });
    if (grade >= 50) {
      const user = await User.findById(sub.student._id);
      user.totalPoints += Math.round(grade/10);
      user.updateLevel();
      await user.save({ validateBeforeSave:false });
    }
    res.json({ success:true, submission:sub });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// ── QUIZZES ───────────────────────────────────────────────────────────────
router.get('/quizzes/course/:courseId', protect, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ course:req.params.courseId, isActive:true });
    res.json({ success:true, quizzes });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/quizzes/:id', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success:false, message:'Quiz not found' });
    res.json({ success:true, quiz });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post('/quizzes', protect, authorize('teacher','admin'), async (req, res) => {
  try {
    const quiz = await Quiz.create({ ...req.body, teacher:req.user._id });
    res.status(201).json({ success:true, quiz });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.put('/quizzes/:id', protect, authorize('teacher','admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new:true });
    res.json({ success:true, quiz });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post('/quizzes/:id/submit', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success:false, message:'Quiz not found' });
    const attempts = await QuizAttempt.countDocuments({ quiz:quiz._id, student:req.user._id });
    if (attempts >= quiz.maxAttempts) return res.status(400).json({ success:false, message:`Max ${quiz.maxAttempts} attempts reached` });
    const { answers, timeTaken } = req.body;
    let total=0, earned=0;
    const graded = quiz.questions.map((q,i) => {
      total += q.points;
      const correct = q.type!=='short_answer' && answers[i] === q.options.findIndex(o=>o.isCorrect);
      if (correct) earned += q.points;
      return { questionId:q._id, selectedOption:answers[i], isCorrect:correct };
    });
    const score  = Math.round(earned/total*100);
    const passed = score >= quiz.passingScore;
    const attempt = await QuizAttempt.create({ quiz:quiz._id, student:req.user._id, answers:graded, score, passed, timeTaken });
    if (passed) {
      const user = await User.findById(req.user._id);
      user.totalPoints += Math.round(score/5);
      user.updateLevel();
      await user.save({ validateBeforeSave:false });
    }
    res.json({ success:true, attempt, score, passed, earnedPoints:earned, totalPoints:total });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/quizzes/:id/attempts', protect, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ quiz:req.params.id, student:req.user._id }).sort({ createdAt:-1 });
    res.json({ success:true, attempts });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/quizzes/:id/all-attempts', protect, authorize('teacher','admin'), async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ quiz:req.params.id })
      .populate('student','firstName lastName studentId avatar').sort({ completedAt:-1 });
    res.json({ success:true, attempts });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// ── CERTIFICATES ──────────────────────────────────────────────────────────
router.get('/certificates/my', protect, async (req, res) => {
  try {
    const certs = await Certificate.find({ student:req.user._id, status:'issued' })
      .populate('course','title category level thumbnail')
      .populate('teacher','firstName lastName');
    res.json({ success:true, certificates:certs });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/certificates/verify/:certId', async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateId:req.params.certId, status:'issued' })
      .populate('student','firstName lastName studentId campus')
      .populate('course','title category level')
      .populate('teacher','firstName lastName');
    if (!cert) return res.status(404).json({ success:false, message:'Certificate not found or revoked' });
    res.json({ success:true, certificate:cert });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────
router.get('/notifications', protect, async (req, res) => {
  try {
    const notifs = await Notification.find({ recipient:req.user._id }).sort({ createdAt:-1 }).limit(30);
    const unread = await Notification.countDocuments({ recipient:req.user._id, isRead:false });
    res.json({ success:true, notifications:notifs, unreadCount:unread });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.put('/notifications/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ recipient:req.user._id, isRead:false }, { isRead:true });
    res.json({ success:true });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;

// GET /api/certificates/generate/:certId — Generate HTML certificate for printing/PDF
router.get('/certificates/generate/:certId', async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certId, status: 'issued' })
      .populate('student','firstName lastName studentId campus')
      .populate('course','title category level')
      .populate('teacher','firstName lastName');
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>DUNIS Certificate — ${cert.certificateId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #fff; }
    .cert { width:297mm; min-height:210mm; padding:20mm 24mm; border:3px solid #c8a84b; position:relative; overflow:hidden; background:#fff; }
    .cert::before { content:''; position:absolute; top:8mm; left:8mm; right:8mm; bottom:8mm; border:1px solid rgba(200,168,75,.3); pointer-events:none; }
    .header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10mm; }
    .logo-text { font-family:'Cormorant Garamond',serif; font-size:36pt; font-weight:800; letter-spacing:-1px; }
    .logo-text span { color:#c8a84b; }
    .logo-sub { font-size:9pt; color:#666; text-transform:uppercase; letter-spacing:2px; margin-top:2px; }
    .divider { height:2px; background:linear-gradient(90deg,#c8a84b,transparent); margin-bottom:10mm; }
    .cert-type { text-align:center; margin-bottom:8mm; }
    .cert-type p { font-size:11pt; color:#888; text-transform:uppercase; letter-spacing:3px; margin-bottom:4mm; }
    .cert-type h1 { font-family:'Cormorant Garamond',serif; font-size:42pt; font-weight:700; color:#0b1e3d; }
    .recipient { text-align:center; margin-bottom:8mm; }
    .recipient p { font-size:11pt; color:#666; margin-bottom:3mm; }
    .recipient h2 { font-family:'Cormorant Garamond',serif; font-size:34pt; font-weight:600; color:#c8a84b; border-bottom:2px solid #c8a84b; display:inline-block; padding-bottom:2mm; }
    .course { text-align:center; margin-bottom:8mm; }
    .course p { font-size:11pt; color:#666; margin-bottom:2mm; }
    .course h3 { font-family:'Cormorant Garamond',serif; font-size:22pt; color:#0b1e3d; font-weight:700; }
    .meta { display:flex; justify-content:space-around; margin-bottom:10mm; padding:6mm 0; border-top:1px solid #eee; border-bottom:1px solid #eee; }
    .meta-item { text-align:center; }
    .meta-item .label { font-size:8pt; text-transform:uppercase; letter-spacing:2px; color:#999; }
    .meta-item .value { font-size:12pt; font-weight:600; color:#0b1e3d; margin-top:1mm; }
    .footer { display:flex; justify-content:space-between; align-items:flex-end; }
    .sig-block { text-align:center; }
    .sig-line { width:50mm; border-bottom:1px solid #333; margin-bottom:2mm; }
    .sig-name { font-weight:600; font-size:10pt; color:#0b1e3d; }
    .sig-title { font-size:9pt; color:#888; }
    .cert-id-block { text-align:right; }
    .cert-id-label { font-size:8pt; color:#999; text-transform:uppercase; letter-spacing:1px; }
    .cert-id-value { font-family:monospace; font-size:11pt; font-weight:700; color:#c8a84b; }
    .watermark { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-30deg); font-family:'Cormorant Garamond',serif; font-size:80pt; font-weight:800; color:rgba(200,168,75,.05); pointer-events:none; white-space:nowrap; z-index:0; }
    .content { position:relative; z-index:1; }
  </style>
</head>
<body>
<div class="cert">
  <div class="watermark">DUNIS AFRICA</div>
  <div class="content">
    <div class="header">
      <div>
        <div class="logo-text">DU<span>N</span>IS</div>
        <div class="logo-sub">Dakar University of International Studies</div>
      </div>
      <div style="text-align:right;font-size:9pt;color:#888;">
        <div>Campuses: Dakar · Abidjan · Douala · Banjul</div>
        <div style="margin-top:2mm;">www.dunis.africa</div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="cert-type">
      <p>Certificate of Completion</p>
      <h1>CERTIFICATE</h1>
    </div>
    <div class="recipient">
      <p>This is to certify that</p>
      <h2>${cert.student.firstName} ${cert.student.lastName}</h2>
      ${cert.student.studentId ? `<p style="margin-top:3mm;font-size:10pt;">Student ID: <strong>${cert.student.studentId}</strong> · Campus: <strong>${cert.student.campus}</strong></p>` : ''}
    </div>
    <div class="course">
      <p>has successfully completed the course</p>
      <h3>${cert.course.title}</h3>
      <p style="margin-top:2mm;font-size:10pt;color:#888;">${cert.course.category} · ${cert.course.level}</p>
    </div>
    <div class="meta">
      <div class="meta-item">
        <div class="label">Final Score</div>
        <div class="value">${cert.finalScore}%</div>
      </div>
      <div class="meta-item">
        <div class="label">Date Issued</div>
        <div class="value">${new Date(cert.issuedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}</div>
      </div>
      <div class="meta-item">
        <div class="label">Status</div>
        <div class="value" style="color:#10b981;">✓ Verified</div>
      </div>
    </div>
    <div class="footer">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">${cert.teacher?.firstName || 'DUNIS'} ${cert.teacher?.lastName || 'Africa'}</div>
        <div class="sig-title">Course Instructor</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">Dr. Papa Madicke DIOP</div>
        <div class="sig-title">Founder & President, DUNIS Africa</div>
      </div>
      <div class="cert-id-block">
        <div class="cert-id-label">Certificate ID</div>
        <div class="cert-id-value">${cert.certificateId}</div>
        <div style="font-size:8pt;color:#aaa;margin-top:2mm;">Verify at dunis.africa/verify</div>
      </div>
    </div>
  </div>
</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
