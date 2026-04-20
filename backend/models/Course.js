const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: String,
  url:   String,
  type:  { type: String, enum: ['pdf','link','doc','ppt','video'] }
});

const lessonSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  type:        { type: String, enum: ['video','reading','assignment','meet'], default: 'video' },
  videoUrl:    { type: String, default: '' },
  videoProvider:{ type: String, enum: ['youtube','vimeo','upload','other'], default: 'youtube' },
  content:     { type: String, default: '' },
  duration:    { type: Number, default: 0 },
  order:       { type: Number, default: 0 },
  isPreview:   { type: Boolean, default: false },
  points:      { type: Number, default: 10 },
  resources:   [resourceSchema],
  assignmentInstructions: { type: String, default: '' },
  dueDate:     { type: Date },
  maxScore:    { type: Number, default: 100 }
}, { timestamps: true });

const meetSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  description:  { type: String, default: '' },
  meetUrl:      { type: String, default: '' },
  platform:     { type: String, enum: ['google_meet','zoom','teams','other'], default: 'google_meet' },
  scheduledAt:  { type: Date, required: true },
  duration:     { type: Number, default: 60 },
  isRecorded:   { type: Boolean, default: false },
  recordingUrl: { type: String, default: '' },
  status:       { type: String, enum: ['scheduled','live','ended'], default: 'scheduled' },
  attendance:   { present: [mongoose.Schema.Types.ObjectId], absent: [mongoose.Schema.Types.ObjectId], savedAt: Date }
});

const courseSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  titleFr:     { type: String, default: '' },
  slug:        { type: String, unique: true, sparse: true },
  description: { type: String, default: '' },
  shortDesc:   { type: String, default: '' },
  teacher:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thumbnail:   { type: String, default: '' },
  category:    { type: String, default: 'Business', trim: true },
  level:        { type: String, default: 'Beginner', trim: true },
  language:     { type: String, default: 'English' },
  campus:       { type: String, default: 'All', trim: true },
  program:      { type: String, default: '' },
  semester:     { type: String, default: '' },
  academicYear: { type: String, default: '2024-2025' },
  price:        { type: Number, default: 0 },
  isFree:       { type: Boolean, default: true },
  duration:     { type: Number, default: 0 },
  lessons:      [lessonSchema],
  meets:        [meetSchema],
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  enrollmentCount:  { type: Number, default: 0 },
  rating:       { type: Number, default: 0 },
  reviewCount:  { type: Number, default: 0 },
  tags:         [String],
  objectives:   [String],
  requirements: [String],
  isPublished:  { type: Boolean, default: false },
  hasCertificate: { type: Boolean, default: true },
  passingScore: { type: Number, default: 70 }
}, { timestamps: true });

courseSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title.toLowerCase()
      .replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') + '-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);
