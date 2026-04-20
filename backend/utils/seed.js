require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('../models/User');
const Course   = require('../models/Course');
const { Quiz, Enrollment } = require('../models/index');

const DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'dunis.africa';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Clean up
  await User.deleteMany({});
  await Course.deleteMany({});
  await Quiz.deleteMany({});
  await Enrollment.deleteMany({});
  console.log('🗑  Cleared existing data');

  // Create Admin
  const admin = await User.create({
    firstName:'Admin', lastName:'DUNIS', email:`admin@${DOMAIN}`,
    password:'Admin@2024', role:'admin', campus:'Dakar', isActive:true
  });

  // Create Teachers
  const teacher1 = await User.create({
    firstName:'Fatou', lastName:'Diallo', email:`fatou.diallo@${DOMAIN}`,
    password:'Teacher@2024', role:'teacher', campus:'Dakar',
    specialization:'Business Management & Economics', officeHours:'Mon-Wed 14:00-16:00', isActive:true
  });
  const teacher2 = await User.create({
    firstName:'Moussa', lastName:'Koné', email:`moussa.kone@${DOMAIN}`,
    password:'Teacher@2024', role:'teacher', campus:'Abidjan',
    specialization:'Computer Science & Engineering', officeHours:'Tue-Thu 10:00-12:00', isActive:true
  });

  // Create Students
  const students = await User.insertMany([
    { firstName:'Aminata', lastName:'Sarr',  email:`aminata.sarr@${DOMAIN}`,  password:'Student@2024', role:'student', campus:'Dakar',   program:'BBA - Business Administration', studentId:`DUNIS-2024-0001`, totalPoints:350, level:'Beginner', levelProgress:70 },
    { firstName:'Ibrahima',lastName:'Balde', email:`ibrahima.balde@${DOMAIN}`,password:'Student@2024', role:'student', campus:'Dakar',   program:'Computer Science', studentId:`DUNIS-2024-0002`, totalPoints:1200, level:'Intermediate', levelProgress:47 },
    { firstName:'Mariama', lastName:'Diop',  email:`mariama.diop@${DOMAIN}`,  password:'Student@2024', role:'student', campus:'Abidjan', program:'BBA - Business Administration', studentId:`DUNIS-2024-0003`, totalPoints:2800, level:'Advanced', levelProgress:53 },
    { firstName:'Oumar',   lastName:'Sy',    email:`oumar.sy@${DOMAIN}`,      password:'Student@2024', role:'student', campus:'Douala',  program:'MBA', studentId:`DUNIS-2024-0004`, totalPoints:600, level:'Intermediate', levelProgress:6 },
  ]);

  // Create Courses
  const course1 = await Course.create({
    title: 'Introduction to Business Management',
    description: 'A comprehensive introduction to core business management principles. This course covers organizational behavior, strategic planning, financial fundamentals, and leadership in the modern business environment.',
    shortDesc: 'Master the fundamentals of business management and organizational leadership.',
    teacher: teacher1._id,
    category: 'Business', level: 'Beginner', language: 'English',
    campus: 'All', program: 'BBA - Business Administration',
    academicYear: '2024-2025', isFree: true, hasCertificate: true,
    objectives: ['Understand organizational structures','Apply strategic planning frameworks','Analyze business environments','Lead effective teams','Make data-driven decisions'],
    requirements: ['No prior experience needed','Basic English proficiency'],
    tags: ['business','management','leadership','strategy'],
    isPublished: true, duration: 20,
    lessons: [
      { title:'What is Business Management?', type:'video', videoUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description:'Introduction to the field of business management.', duration:20, order:1, isPreview:true, points:10 },
      { title:'Organizational Structures', type:'video', videoUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description:'Types of organizations and their structures.', duration:25, order:2, points:10 },
      { title:'Strategic Planning Fundamentals', type:'reading', content:`# Strategic Planning\n\nStrategic planning is the process of defining an organization's direction and making decisions to allocate resources.\n\n## Key Components\n\n1. **Vision Statement** — Where do you want to be?\n2. **Mission Statement** — Why do you exist?\n3. **SWOT Analysis** — Strengths, Weaknesses, Opportunities, Threats\n4. **Strategic Objectives** — Measurable goals\n\n## The SWOT Framework\n\n| Internal | External |\n|----------|----------|\n| Strengths | Opportunities |\n| Weaknesses | Threats |\n\n## Conclusion\nEffective strategic planning aligns organizational resources with long-term goals.`, duration:30, order:3, points:15 },
      { title:'Assignment: Business Plan Outline', type:'assignment', assignmentInstructions:'Create a 1-page business plan outline for a hypothetical company of your choice. Include: Vision, Mission, Target market, 3 key objectives, and a brief SWOT analysis.', dueDate:new Date(Date.now()+14*24*60*60*1000), duration:60, order:4, maxScore:100, points:20 },
    ],
    meets: [
      { title:'Week 1 — Introduction Q&A', description:'Live discussion on course overview and expectations.', meetUrl:'https://meet.google.com/abc-defg-hij', platform:'google_meet', scheduledAt:new Date(Date.now()+2*24*60*60*1000), duration:60, status:'scheduled' },
      { title:'Week 3 — Strategic Planning Deep Dive', description:'Interactive session on SWOT and strategic frameworks.', meetUrl:'https://meet.google.com/xyz-abcd-efg', platform:'google_meet', scheduledAt:new Date(Date.now()+16*24*60*60*1000), duration:90, status:'scheduled' }
    ]
  });

  const course2 = await Course.create({
    title: 'Computer Science Fundamentals',
    description: 'A solid foundation in computer science covering algorithms, data structures, programming paradigms, and problem-solving techniques.',
    shortDesc: 'Build strong foundations in algorithms, data structures, and programming.',
    teacher: teacher2._id,
    category: 'Computer Science', level: 'Beginner', language: 'English',
    campus: 'All', academicYear: '2024-2025', isFree: true, hasCertificate: true,
    objectives: ['Understand algorithms and complexity','Work with core data structures','Apply problem-solving strategies','Write clean, efficient code'],
    requirements: ['Basic math skills','Logical thinking ability'],
    isPublished: true, duration: 25,
    lessons: [
      { title:'Introduction to Algorithms', type:'video', videoUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description:'What is an algorithm? Why do they matter?', duration:22, order:1, isPreview:true, points:10 },
      { title:'Big-O Notation & Complexity', type:'reading', content:`# Big-O Notation\n\nBig-O notation describes algorithm performance as input size grows.\n\n## Common Complexities\n\n| Notation | Name | Example |\n|----------|------|---------|\n| O(1) | Constant | Array access |\n| O(log n) | Logarithmic | Binary search |\n| O(n) | Linear | Linear search |\n| O(n²) | Quadratic | Bubble sort |\n\n## Why It Matters\nChoosing the right algorithm can make programs millions of times faster.`, duration:35, order:2, points:15 },
      { title:'Arrays and Linked Lists', type:'video', videoUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description:'Understanding fundamental data structures.', duration:28, order:3, points:10 },
    ],
    meets: [
      { title:'Coding Workshop — Arrays', meetUrl:'https://zoom.us/j/123456789', platform:'zoom', scheduledAt:new Date(Date.now()+5*24*60*60*1000), duration:120, status:'scheduled', description:'Hands-on coding exercises with arrays and linked lists.' }
    ]
  });

  // Create Quiz
  await Quiz.create({
    title: 'Business Management Quiz 1',
    course: course1._id,
    teacher: teacher1._id,
    timeLimit: 20,
    passingScore: 70,
    maxAttempts: 3,
    isActive: true,
    showAnswers: true,
    questions: [
      { text:'What does SWOT stand for in strategic planning?', type:'mcq', points:1, options:[{ text:'Speed, Wealth, Options, Timing', isCorrect:false },{ text:'Strengths, Weaknesses, Opportunities, Threats', isCorrect:true },{ text:'Systems, Work, Operations, Technology', isCorrect:false },{ text:'Strategy, Workflow, Objectives, Tasks', isCorrect:false }], explanation:'SWOT stands for Strengths, Weaknesses, Opportunities, and Threats — a framework for strategic analysis.' },
      { text:'A mission statement describes WHERE a company wants to be in the future.', type:'true_false', points:1, options:[{ text:'True', isCorrect:false },{ text:'False', isCorrect:true }], explanation:'A mission statement describes WHY the company exists. A vision statement describes where it wants to be.' },
      { text:'Which of the following is an example of an internal factor in SWOT analysis?', type:'mcq', points:1, options:[{ text:'Market trends', isCorrect:false },{ text:'Competitor strategy', isCorrect:false },{ text:'Employee expertise', isCorrect:true },{ text:'Economic conditions', isCorrect:false }], explanation:'Employee expertise is internal. Market trends, competitor strategy, and economic conditions are external factors.' },
      { text:'Strategic planning is only relevant for large corporations.', type:'true_false', points:1, options:[{ text:'True', isCorrect:false },{ text:'False', isCorrect:true }], explanation:'Strategic planning is valuable for organizations of all sizes — startups, SMEs, and large corporations alike.' },
    ]
  });

  // Enroll students
  await Enrollment.create({ student:students[0]._id, course:course1._id, enrolledBy:teacher1._id });
  await Enrollment.create({ student:students[1]._id, course:course1._id, enrolledBy:teacher1._id });
  await Enrollment.create({ student:students[1]._id, course:course2._id, enrolledBy:teacher2._id });
  await Enrollment.create({ student:students[2]._id, course:course1._id, enrolledBy:teacher1._id });
  await Enrollment.create({ student:students[3]._id, course:course2._id, enrolledBy:teacher2._id });
  await Course.findByIdAndUpdate(course1._id, { $addToSet:{ enrolledStudents:{ $each:[students[0]._id,students[1]._id,students[2]._id] } }, enrollmentCount:3 });
  await Course.findByIdAndUpdate(course2._id, { $addToSet:{ enrolledStudents:{ $each:[students[1]._id,students[3]._id] } }, enrollmentCount:2 });

  console.log('\n✅ Seed complete!\n');
  console.log('─'.repeat(50));
  console.log('DEMO ACCOUNTS (all @' + DOMAIN + ')');
  console.log('─'.repeat(50));
  console.log(`Admin:    admin@${DOMAIN}           / Admin@2024`);
  console.log(`Teacher1: fatou.diallo@${DOMAIN}  / Teacher@2024`);
  console.log(`Teacher2: moussa.kone@${DOMAIN}   / Teacher@2024`);
  console.log(`Student1: aminata.sarr@${DOMAIN}  / Student@2024`);
  console.log(`Student2: ibrahima.balde@${DOMAIN}/ Student@2024`);
  console.log('─'.repeat(50));
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
