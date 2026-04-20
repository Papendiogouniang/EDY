const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'dunis.africa';

const userSchema = new mongoose.Schema({
  firstName:  { type: String, required: true, trim: true },
  lastName:   { type: String, required: true, trim: true },
  email: {
    type: String, required: true, unique: true, lowercase: true, trim: true,
    validate: {
      validator: v => v.endsWith(`@${DOMAIN}`),
      message:   props => `${props.value} is not a valid @${DOMAIN} address`
    }
  },
  password:   { type: String, required: true, minlength: 6, select: false },
  role:       { type: String, enum: ['student','teacher','admin'], default: 'student' },
  avatar:     { type: String, default: '' },
  campus:     { type: String, enum: ['Dakar','Abidjan','Douala','Banjul','Online'], default: 'Dakar' },
  program:    { type: String, default: '' },
  studentId:  { type: String, default: '' },
  bio:        { type: String, default: '' },
  language:   { type: String, enum: ['en','fr'], default: 'en' },
  isActive:   { type: Boolean, default: true },

  // ── Student fields ────────────────────────────────────────────────────
  enrolledCourses:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  completedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  certificates:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' }],
  totalPoints:  { type: Number, default: 0 },
  level:        { type: String, enum: ['Beginner','Intermediate','Advanced','Expert'], default: 'Beginner' },
  levelProgress:{ type: Number, default: 0 },
  streak:       { type: Number, default: 0 },
  badges: [{
    name: String, icon: String, description: String,
    earnedAt: { type: Date, default: Date.now }
  }],

  // ── Teacher fields ────────────────────────────────────────────────────
  teachingCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  specialization:  { type: String, default: '' },
  officeHours:     { type: String, default: '' },

  lastLogin: { type: Date },
  passwordChangedAt: { type: Date }
}, { timestamps: true });

// ── Hash password ─────────────────────────────────────────────────────────
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date();
  next();
});

// ── Compare password ──────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ── Update level from points ──────────────────────────────────────────────
userSchema.methods.updateLevel = function() {
  const pts = this.totalPoints;
  if      (pts >= 5000) { this.level = 'Expert';       this.levelProgress = Math.min(100, Math.round((pts-5000)/50)); }
  else if (pts >= 2000) { this.level = 'Advanced';     this.levelProgress = Math.round((pts-2000)/3000*100); }
  else if (pts >= 500)  { this.level = 'Intermediate'; this.levelProgress = Math.round((pts-500)/1500*100); }
  else                  { this.level = 'Beginner';     this.levelProgress = Math.round(pts/500*100); }
};

userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set('toJSON', { virtuals: true });
module.exports = mongoose.model('User', userSchema);
