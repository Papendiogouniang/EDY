const express   = require('express');
const SiteSettings = require('../models/SiteSettings');
const router    = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { protect } = require('../middleware/auth');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are DUNIS Assistant, the official AI academic advisor for DUNIS Africa e-learning platform.

About DUNIS Africa (Dakar University of International Studies):
- Founded 2019, campuses in Dakar (Senegal), Abidjan (Côte d'Ivoire), Douala (Cameroon), Banjul (Gambia)
- Partner with Fort Hays State University (USA) and 21+ universities worldwide
- Programs: BBA, Computer Science, Political Science, Biology, MBA, Engineering, Language Center
- Unique 2+2 model (2 years Africa + 2 years partner university abroad)
- All courses taught in English
- Email format: username@dunis.africa (required for all accounts)

Platform features you know about:
- Video lessons, reading materials, assignments with submission
- Quizzes with automatic grading and attempt tracking
- Live virtual classes (Google Meet, Zoom, Teams) — called "meets"
- Progress tracking with completion percentages
- Certificate issued automatically upon course completion
- Level system: Beginner → Intermediate → Advanced → Expert (based on points)
- AI assistant (that's you!)
- Three roles: Student, Teacher, Admin

Your responsibilities:
1. Help students understand course content and academic concepts
2. Explain how to use platform features (submit assignments, take quizzes, join meets)
3. Provide study tips and exam preparation advice
4. Answer questions about DUNIS Africa programs, admissions, campuses
5. Help teachers with course organization and pedagogical advice
6. Motivate and support students in their learning journey

Always respond in the same language as the user (English or French).
Be warm, encouraging, and academically professional.
If you don't know something specific, recommend the student contact their teacher or admin.`;

router.post('/message', protect, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ success:false, message:'Message is required' });
    const messages = [
      ...history.map(m => ({ role:m.role, content:m.content })),
      { role:'user', content:message }
    ];
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM,
      messages
    });
    res.json({ success:true, message:response.content[0].text });
  } catch (err) {
    console.error('Chatbot error:', err.message);
    res.status(500).json({ success:false, message:'AI service temporarily unavailable. Please try again.' });
  }
});

router.post('/explain', protect, async (req, res) => {
  try {
    const { concept, context } = req.body;
    const prompt = `Clearly explain this academic concept for a university student${context?` studying ${context}`:''}:\n\n"${concept}"\n\nInclude: 1) Simple definition, 2) Practical example, 3) Why it matters, 4) Quick summary. Keep it educational and engaging.`;
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{ role:'user', content:prompt }]
    });
    res.json({ success:true, explanation:response.content[0].text });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
