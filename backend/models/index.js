const mongoose = require('mongoose');

// ── Quiz ──────────────────────────────────────────────────────────────────
const questionSchema = new mongoose.Schema({
  text:        { type: String, required: true },
  type:        { type: String, enum: ['mcq','true_false','short_answer'], default: 'mcq' },
  options:     [{ text: String, isCorrect: Boolean }],
  explanation: { type: String, default: '' },
  points:      { type: Number, default: 1 },
  imageUrl:    { type: String, default: '' }
});

const quizSchema = new mongoose.Schema({
  title:         { type: String, required: true },
  course:        { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions:     [questionSchema],
  timeLimit:     { type: Number, default: 30 },
  passingScore:  { type: Number, default: 70 },
  maxAttempts:   { type: Number, default: 3 },
  isActive:      { type: Boolean, default: true },
  showAnswers:   { type: Boolean, default: true },
  availableFrom: { type: Date },
  availableUntil:{ type: Date }
}, { timestamps: true });

const quizAttemptSchema = new mongoose.Schema({
  quiz:      { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  student:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers:   [{ questionId: mongoose.Schema.Types.ObjectId, selectedOption: Number, answerText: String, isCorrect: Boolean }],
  score:     { type: Number, default: 0 },
  passed:    { type: Boolean, default: false },
  timeTaken: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// ── Assignment Submission ─────────────────────────────────────────────────
const submissionSchema = new mongoose.Schema({
  student:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:      { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  lessonId:    { type: mongoose.Schema.Types.ObjectId, required: true },
  content:     { type: String, default: '' },
  fileUrl:     { type: String, default: '' },
  links:       [String],
  status:      { type: String, enum: ['submitted','graded','returned'], default: 'submitted' },
  grade:       { type: Number, default: null },
  feedback:    { type: String, default: '' },
  gradedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt:    { type: Date },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// ── Certificate ───────────────────────────────────────────────────────────
const certificateSchema = new mongoose.Schema({
  student:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:        { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  certificateId: { type: String, unique: true, required: true },
  finalScore:    { type: Number, default: 0 },
  issuedAt:      { type: Date, default: Date.now },
  validUntil:    { type: Date },
  status:        { type: String, enum: ['issued','revoked'], default: 'issued' }
}, { timestamps: true });

// ── Enrollment ────────────────────────────────────────────────────────────
const enrollmentSchema = new mongoose.Schema({
  student:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:     { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  enrolledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status:     { type: String, enum: ['active','completed','dropped','suspended'], default: 'active' },
  finalGrade: { type: Number, default: null },
  enrolledAt: { type: Date, default: Date.now },
  completedAt:{ type: Date }
}, { timestamps: true });
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// ── Progress ──────────────────────────────────────────────────────────────
const progressSchema = new mongoose.Schema({
  student:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:      { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  lesson:      { type: mongoose.Schema.Types.ObjectId, required: true },
  completed:   { type: Boolean, default: false },
  watchedTime: { type: Number, default: 0 },
  completedAt: { type: Date }
}, { timestamps: true });
progressSchema.index({ student: 1, course: 1, lesson: 1 }, { unique: true });

// ── Notification ──────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['assignment_graded','new_meet','quiz_available','course_update',
           'certificate_issued','message','enrollment','system'],
    required: true
  },
  title:   { type: String, required: true },
  message: { type: String, default: '' },
  link:    { type: String, default: '' },
  isRead:  { type: Boolean, default: false },
  data:    { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = {
  Quiz:         mongoose.model('Quiz', quizSchema),
  QuizAttempt:  mongoose.model('QuizAttempt', quizAttemptSchema),
  Submission:   mongoose.model('Submission', submissionSchema),
  Certificate:  mongoose.model('Certificate', certificateSchema),
  Enrollment:   mongoose.model('Enrollment', enrollmentSchema),
  Progress:     mongoose.model('Progress', progressSchema),
  Notification: mongoose.model('Notification', notificationSchema),
};
