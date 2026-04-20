const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },

  // Hero section
  heroTitle:    { type: String, default: 'Learn Without Borders' },
  heroSubtitle: { type: String, default: 'The official e-learning platform of DUNIS Africa — connecting students and teachers across Dakar, Abidjan, Douala and Banjul. All courses in English.' },
  heroImage:    { type: String, default: '' },

  // Logo
  logoUrl: { type: String, default: '' },

  // About / Campus section
  aboutTitle:   { type: String, default: 'Dakar University of International Studies' },
  aboutText:    { type: String, default: 'Founded in 2019 in partnership with Fort Hays State University (USA), DUNIS Africa offers world-class education with a uniquely African perspective. Study locally, graduate globally.' },
  campusImage:  { type: String, default: '' },

  // Per-campus images
  campusDakarImage:   { type: String, default: '' },
  campusAbidjanImage: { type: String, default: '' },
  campusDoualaImage:  { type: String, default: '' },
  campusBanjulImage:  { type: String, default: '' },
  ctaBgImage:   { type: String, default: '' },  // CTA section background

  // Stats bar
  stat1Val:   { type: String, default: '4' },
  stat1Label: { type: String, default: 'Campuses' },
  stat2Val:   { type: String, default: '21+' },
  stat2Label: { type: String, default: 'Partner Universities' },
  stat3Val:   { type: String, default: '500+' },
  stat3Label: { type: String, default: 'Students' },
  stat4Val:   { type: String, default: '2+2' },
  stat4Label: { type: String, default: 'Study Model' },

  // Gallery images (up to 6)
  galleryImages: [{ url: String, caption: String, alt: String }],

  // Announcement banner (optional)
  announcementText:    { type: String, default: '' },
  announcementActive:  { type: Boolean, default: false },
  announcementColor:   { type: String, default: '#c8a84b' },

  // Programs managed by admin
  programs: [{
    title:    String,
    badge:    String,
    sub:      String,
    imageUrl: String,
    color:    { type: String, default: '#d0aa31' },
    campuses: [String],
    active:   { type: Boolean, default: true },
    applyLink:String,
  }],

  // Contact info
  contactDakar:   { type: String, default: '+221 77 864 94 94' },
  contactAbidjan: { type: String, default: '+225 07 69 12 02 47' },
  contactDouala:  { type: String, default: '+237 6 95 56 37 37' },
  contactBanjul:  { type: String, default: '+220 401 2475' },

  // Footer tagline
  footerTagline: { type: String, default: 'Beyond Boundaries, Go Further' },

  // FAQ / Chatbot Knowledge Base
  faqItems: [{
    question: { type: String },
    answer:   { type: String },
    category: { type: String, default: 'general' },
    active:   { type: Boolean, default: true },
  }],
  
  // Chatbot system prompt override
  chatbotSystemPrompt: { type: String, default: '' },
  
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
