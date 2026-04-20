import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getCourse, createCourse, updateCourse,
  addLesson, deleteLesson,
  createQuiz, uploadImage
} from '../../utils/api';
import {
  FiSave, FiArrowLeft, FiPlus, FiTrash2,
  FiVideo, FiFileText, FiClipboard, FiAward,
  FiCheck, FiChevronDown, FiChevronUp, FiBook, FiUploadCloud
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './CourseEditor.css';

/* ── Constants ──────────────────────────────────────────────────────────── */
const CATEGORIES = [
  'Business','Computer Science','Political Science','Biology',
  'English Language','Management','Engineering','Mathematics','Economics','Law'
];
const CAMPUSES = ['All','Dakar','Abidjan','Douala','Banjul'];
const LEVELS   = ['Beginner','Intermediate','Advanced'];

const EMPTY_LESSON = {
  title:'', description:'', type:'video',
  videoUrl:'', content:'', duration:15,
  isPreview:false, points:10,
  assignmentInstructions:'', maxScore:100
};

const EMPTY_QUIZ = {
  title:'', timeLimit:30, passingScore:70, maxAttempts:3, showAnswers:true
};

const EMPTY_Q = {
  text:'', type:'mcq', points:1, explanation:'',
  options:[{text:'',isCorrect:false},{text:'',isCorrect:false},{text:'',isCorrect:false},{text:'',isCorrect:false}]
};

/* ─────────────────────────────────────────────────────────────────────── */
export default function CourseEditor() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const isNew     = !id || id === 'new';

  const [course,  setCourse]  = useState(null);
  const [tab,     setTab]     = useState('info');
  const [loading, setLoading] = useState(!isNew);
  const [saving,  setSaving]  = useState(false);

  // Course info form
  const [info, setInfo] = useState({
    title:'', titleFr:'', description:'', shortDesc:'',
    category:'Business', level:'Beginner', language:'English',
    campus:'All', program:'', academicYear:'2024-2025', semester:'',
    isFree:true, price:0, duration:0, thumbnail:'',
    hasCertificate:true, passingScore:70,
    objectives:'', requirements:'', tags:''
  });

  // Lesson form
  const [lesson,  setLesson]  = useState(EMPTY_LESSON);
  const [uploading, setUploading] = useState(false);
  const pdfRef = useRef();
  const [addingL, setAddingL] = useState(false);
  const [savingL, setSavingL] = useState(false);

  // Quiz form
  const [quiz,     setQuiz]     = useState(EMPTY_QUIZ);
  const [questions,setQuestions]= useState([]);
  const [newQ,     setNewQ]     = useState(EMPTY_Q);
  const [addingQ,  setAddingQ]  = useState(false);
  const [savingQ,  setSavingQ]  = useState(false);

  /* Load existing course */
  useEffect(() => {
    if (isNew) return;
    getCourse(id)
      .then(r => {
        const c = r.data.course;
        setCourse(c);
        setInfo({
          title:        c.title       || '',
          titleFr:      c.titleFr     || '',
          description:  c.description || '',
          shortDesc:    c.shortDesc   || '',
          category:     c.category    || 'Business',
          level:        c.level       || 'Beginner',
          language:     c.language    || 'English',
          campus:       c.campus      || 'All',
          program:      c.program     || '',
          academicYear: c.academicYear|| '2024-2025',
          semester:     c.semester    || '',
          isFree:       c.isFree      ?? true,
          price:        c.price       || 0,
          duration:     c.duration    || 0,
          thumbnail:    c.thumbnail   || '',
          hasCertificate:c.hasCertificate ?? true,
          passingScore: c.passingScore|| 70,
          objectives:   (c.objectives  || []).join('\n'),
          requirements: (c.requirements|| []).join('\n'),
          tags:         (c.tags        || []).join(', '),
        });
      })
      .catch(() => toast.error('Course not found'))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  /* ── Save course info ─────────────────────────────────────────────── */
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!info.title.trim())       return toast.error('Title is required');
    if (!info.description.trim()) return toast.error('Description is required');
    setSaving(true);
    try {
      const payload = {
        ...info,
        objectives:   info.objectives.split('\n').map(s=>s.trim()).filter(Boolean),
        requirements: info.requirements.split('\n').map(s=>s.trim()).filter(Boolean),
        tags:         info.tags.split(',').map(s=>s.trim()).filter(Boolean),
        isFree:       Boolean(info.isFree),
        price:        Number(info.price) || 0,
        duration:     Number(info.duration) || 0,
        passingScore: Number(info.passingScore) || 70,
      };
      if (isNew) {
        const r = await createCourse({ ...payload, isPublished: false });
        const newId = r.data.course?._id;
        if (!newId) throw new Error('Course creation failed — no ID returned');
        toast.success('Course created! Now add lessons. ✅');
        navigate(`/teacher/courses/${newId}/edit`);
      } else {
        const r = await updateCourse(id, payload);
        setCourse(r.data.course);
        toast.success('Saved! ✅');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save. Check all required fields.');
    } finally { setSaving(false); }
  };

  /* ── Add lesson ───────────────────────────────────────────────────── */
  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (!lesson.title.trim()) return toast.error('Lesson title is required');
    setSavingL(true);
    try {
      const payload = {
        ...lesson,
        duration: Number(lesson.duration) || 0,
        points:   Number(lesson.points)   || 10,
        maxScore: Number(lesson.maxScore) || 100,
      };
      const r = await addLesson(id, payload);
      setCourse(r.data.course);
      setLesson(EMPTY_LESSON);
      setAddingL(false);
      toast.success(`Lesson "${lesson.title}" added! ✅`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add lesson');
    } finally { setSavingL(false); }
  };

  /* ── Delete lesson ────────────────────────────────────────────────── */
  const handleDeleteLesson = async (lessonId, title) => {
    if (!window.confirm(`Delete lesson "${title}"?`)) return;
    try {
      const r = await deleteLesson(id, lessonId);
      setCourse(r.data.course);
      toast.success('Lesson deleted');
    } catch { toast.error('Delete failed'); }
  };

  /* ── Add question to quiz ─────────────────────────────────────────── */
  const addQuestion = () => {
    if (!newQ.text.trim()) return toast.error('Enter the question text');
    if (newQ.type !== 'short_answer' && !newQ.options.some(o => o.isCorrect)) {
      return toast.error('Mark at least one correct answer');
    }
    if (newQ.type === 'mcq' && newQ.options.filter(o => o.text.trim()).length < 2) {
      return toast.error('Add at least 2 answer options');
    }
    setQuestions(prev => [...prev, { ...newQ }]);
    setNewQ(EMPTY_Q);
    toast.success(`Question ${questions.length + 1} added`);
  };

  /* ── Create quiz ──────────────────────────────────────────────────── */
  const handleCreateQuiz = async () => {
    if (!quiz.title.trim()) return toast.error('Quiz title is required');
    if (questions.length === 0) return toast.error('Add at least one question');
    setSavingQ(true);
    try {
      await createQuiz({
        title:        quiz.title,
        course:       id,
        timeLimit:    Number(quiz.timeLimit)    || 30,
        passingScore: Number(quiz.passingScore) || 70,
        maxAttempts:  Number(quiz.maxAttempts)  || 3,
        showAnswers:  Boolean(quiz.showAnswers),
        questions:    questions,
        isActive:     true,
      });
      setQuiz(EMPTY_QUIZ);
      setQuestions([]);
      setAddingQ(false);
      toast.success(`Quiz "${quiz.title}" created! ✅`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create quiz');
    } finally { setSavingQ(false); }
  };

  /* ── Toggle publish ───────────────────────────────────────────────── */
  const handleTogglePublish = async () => {
    try {
      const r = await updateCourse(id, { isPublished: !course.isPublished });
      setCourse(r.data.course);
      toast.success(r.data.course.isPublished ? 'Course published! 🚀' : 'Course unpublished');
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="spinner" />;

  const tabs = [
    { id:'info',    label:'📋 Course Info' },
    ...(!isNew ? [
      { id:'lessons', label:`📚 Lessons (${course?.lessons?.length || 0})` },
      { id:'quiz',    label:'🧪 Quiz' },
    ] : []),
  ];

  return (
    <div className="course-editor fade-up">

      {/* Header */}
      <div className="ce-header">
        <Link to="/teacher/courses" className="btn btn-ghost btn-sm">
          <FiArrowLeft size={15}/> My Courses
        </Link>
        <div style={{ flex:1 }}>
          <h1>{isNew ? 'Create New Course' : (info.title || 'Edit Course')}</h1>
          {!isNew && course && (
            <span className={`badge ${course.isPublished ? 'badge-green' : 'badge-orange'}`} style={{ marginTop:4, display:'inline-block' }}>
              {course.isPublished ? '● Published' : '○ Draft'}
            </span>
          )}
        </div>
        {!isNew && (
          <button className={`btn btn-sm ${course?.isPublished ? 'btn-danger' : 'btn-outline'}`} onClick={handleTogglePublish}>
            {course?.isPublished ? 'Unpublish' : '🚀 Publish'}
          </button>
        )}
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="ce-tabs">
          {tabs.map(t => (
            <button key={t.id} className={`ce-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ════════════════════ INFO TAB ════════════════════ */}
      {(tab === 'info') && (
        <form onSubmit={handleSaveInfo} className="ce-form card">

          <div className="ce-section">
            <h2>Basic Information</h2>
            <div className="form-group">
              <label className="form-label">Course Title (English) *</label>
              <input type="text" className="form-input" required
                placeholder="e.g. Introduction to Business Management"
                value={info.title} onChange={e => setInfo(s=>({...s, title:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">French Title / Sous-titre (optional)</label>
              <input type="text" className="form-input"
                placeholder="e.g. Introduction au Management des Affaires"
                value={info.titleFr} onChange={e => setInfo(s=>({...s, titleFr:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-input" rows={4} required style={{resize:'vertical'}}
                placeholder="Full course description..."
                value={info.description} onChange={e => setInfo(s=>({...s, description:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Short Description (shown on course cards)</label>
              <input type="text" className="form-input" maxLength={150}
                placeholder="One-line summary..."
                value={info.shortDesc} onChange={e => setInfo(s=>({...s, shortDesc:e.target.value}))} />
            </div>
          </div>

          <div className="ce-section">
            <h2>Classification</h2>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={info.category} onChange={e => setInfo(s=>({...s, category:e.target.value}))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Level</label>
                <select className="form-input" value={info.level} onChange={e => setInfo(s=>({...s, level:e.target.value}))}>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Campus</label>
                <select className="form-input" value={info.campus} onChange={e => setInfo(s=>({...s, campus:e.target.value}))}>
                  {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Program / Department</label>
                <input type="text" className="form-input" placeholder="e.g. BBA — Business Administration"
                  value={info.program} onChange={e => setInfo(s=>({...s, program:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Academic Year</label>
                <input type="text" className="form-input" placeholder="2024-2025"
                  value={info.academicYear} onChange={e => setInfo(s=>({...s, academicYear:e.target.value}))} />
              </div>
            </div>
          </div>

          <div className="ce-section">
            <h2>Pricing & Certificate</h2>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Free course?</label>
                <select className="form-input" value={info.isFree ? 'yes':'no'} onChange={e => setInfo(s=>({...s, isFree: e.target.value==='yes'}))}>
                  <option value="yes">Yes — Free access</option>
                  <option value="no">No — Paid</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Duration (hours)</label>
                <input type="number" className="form-input" min="0"
                  value={info.duration} onChange={e => setInfo(s=>({...s, duration:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Certificate on completion?</label>
                <select className="form-input" value={info.hasCertificate ? 'yes':'no'} onChange={e => setInfo(s=>({...s, hasCertificate: e.target.value==='yes'}))}>
                  <option value="yes">Yes — Issue certificate</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{maxWidth:300}}>
              <label className="form-label">Course Thumbnail URL</label>
              <input type="url" className="form-input" placeholder="https://... (optional)"
                value={info.thumbnail} onChange={e => setInfo(s=>({...s, thumbnail:e.target.value}))} />
            </div>
          </div>

          <div className="ce-section">
            <h2>Learning Objectives & Requirements</h2>
            <div className="form-group">
              <label className="form-label">Learning Objectives <span style={{color:'var(--gray-400)',fontWeight:400}}>(one per line)</span></label>
              <textarea className="form-input" rows={4} style={{resize:'vertical'}}
                placeholder={'Students will be able to...\nUnderstand the basics of...\nApply concepts to...'}
                value={info.objectives} onChange={e => setInfo(s=>({...s, objectives:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Prerequisites <span style={{color:'var(--gray-400)',fontWeight:400}}>(one per line)</span></label>
              <textarea className="form-input" rows={3} style={{resize:'vertical'}}
                placeholder={'No prior experience needed\nBasic English required'}
                value={info.requirements} onChange={e => setInfo(s=>({...s, requirements:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Tags <span style={{color:'var(--gray-400)',fontWeight:400}}>(comma-separated)</span></label>
              <input type="text" className="form-input" placeholder="business, management, finance"
                value={info.tags} onChange={e => setInfo(s=>({...s, tags:e.target.value}))} />
            </div>
          </div>

          <div className="ce-form-actions">
            <button type="submit" className="btn btn-gold" disabled={saving}>
              <FiSave size={15}/> {saving ? 'Saving…' : isNew ? 'Create Course' : 'Save Changes'}
            </button>
            {!isNew && (
              <Link to={`/teacher/courses/${id}`} className="btn btn-outline">
                View Class →
              </Link>
            )}
          </div>
        </form>
      )}

      {/* ════════════════════ LESSONS TAB ════════════════════ */}
      {tab === 'lessons' && !isNew && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
            <div>
              <h2 style={{fontSize:'1.05rem',color:'var(--navy)'}}>Course Lessons</h2>
              <p style={{fontSize:'.82rem',color:'var(--gray-600)'}}>{course?.lessons?.length || 0} lessons total</p>
            </div>
            <button className="btn btn-navy" onClick={() => setAddingL(v => !v)}>
              <FiPlus/> {addingL ? 'Cancel' : 'Add Lesson'}
            </button>
          </div>

          {/* ADD LESSON FORM */}
          {addingL && (
            <form onSubmit={handleAddLesson} className="card" style={{padding:24}}>
              <h3 style={{fontSize:'.95rem',color:'var(--navy)',marginBottom:18}}>➕ New Lesson</h3>
              <div className="form-row">
                <div className="form-group" style={{flex:2}}>
                  <label className="form-label">Lesson Title *</label>
                  <input type="text" className="form-input" required
                    placeholder="e.g. Introduction to Financial Statements"
                    value={lesson.title} onChange={e => setLesson(s=>({...s,title:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input" value={lesson.type} onChange={e => setLesson(s=>({...s,type:e.target.value}))}>
                    <option value="video">📹 Video</option>
                    <option value="reading">📄 Reading / PDF</option>
                    <option value="assignment">📝 Assignment</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (min)</label>
                  <input type="number" className="form-input" min="1"
                    value={lesson.duration} onChange={e => setLesson(s=>({...s,duration:e.target.value}))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input type="text" className="form-input" placeholder="Short description of this lesson"
                  value={lesson.description} onChange={e => setLesson(s=>({...s,description:e.target.value}))} />
              </div>

              {/* VIDEO URL */}
              {lesson.type === 'video' && (
                <div className="form-group">
                  <label className="form-label">📹 Video URL</label>
                  <input type="url" className="form-input"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={lesson.videoUrl} onChange={e => setLesson(s=>({...s,videoUrl:e.target.value}))} />
                  <small style={{color:'var(--gray-500)',marginTop:4,display:'block'}}>
                    Supports: YouTube, Vimeo, or any direct video URL
                  </small>
                </div>
              )}

              {/* READING: PDF URL + text content */}
              {lesson.type === 'reading' && (
                <>
                  <div className="form-group">
                    <label className="form-label">📎 PDF / Resource URL (optional)</label>
                    <input type="url" className="form-input"
                      placeholder="https://drive.google.com/file/d/..."
                      value={lesson.videoUrl} onChange={e => setLesson(s=>({...s,videoUrl:e.target.value}))} />
                    <small style={{color:'var(--gray-500)',marginTop:4,display:'block'}}>
                      Upload to Google Drive, Dropbox or any cloud storage and paste the share link
                    </small>
                  </div>
                  <div className="form-group">
                    <label className="form-label">📝 Lesson Content (Markdown supported)</label>
                    <textarea className="form-input" rows={8} style={{resize:'vertical',fontFamily:'monospace',fontSize:'.85rem'}}
                      placeholder={'# Lesson Title\n\nWrite your lesson content here...\n\n## Section 1\n\nText content, **bold**, *italic*...\n\n- Point 1\n- Point 2'}
                      value={lesson.content} onChange={e => setLesson(s=>({...s,content:e.target.value}))} />
                  </div>
                </>
              )}

              {/* ASSIGNMENT */}
              {lesson.type === 'assignment' && (
                <div className="form-row">
                  <div className="form-group" style={{flex:2}}>
                    <label className="form-label">📋 Assignment Instructions *</label>
                    <textarea className="form-input" rows={5} style={{resize:'vertical'}}
                      placeholder="Write the assignment instructions clearly. Students will read this before submitting their work."
                      value={lesson.assignmentInstructions}
                      onChange={e => setLesson(s=>({...s,assignmentInstructions:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Maximum Score</label>
                    <input type="number" className="form-input" min="1" max="100"
                      value={lesson.maxScore} onChange={e => setLesson(s=>({...s,maxScore:e.target.value}))} />
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Points awarded on completion</label>
                  <input type="number" className="form-input" min="0"
                    value={lesson.points} onChange={e => setLesson(s=>({...s,points:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Free Preview?</label>
                  <select className="form-input" value={lesson.isPreview ? 'yes':'no'} onChange={e => setLesson(s=>({...s,isPreview:e.target.value==='yes'}))}>
                    <option value="no">No — Enrolled students only</option>
                    <option value="yes">Yes — Visible to everyone</option>
                  </select>
                </div>
              </div>

              <div style={{display:'flex',gap:10,paddingTop:12,borderTop:'1px solid var(--gray-200)'}}>
                <button type="submit" className="btn btn-gold" disabled={savingL}>
                  {savingL ? 'Adding…' : '✅ Add Lesson'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => { setAddingL(false); setLesson(EMPTY_LESSON); }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* LESSON LIST */}
          {course?.lessons?.length === 0 && !addingL && (
            <div className="empty-state card" style={{padding:40}}>
              <FiBook size={36}/>
              <h3>No lessons yet</h3>
              <p>Click "Add Lesson" above to create your first lesson</p>
            </div>
          )}
          {course?.lessons?.map((l, i) => (
            <div key={l._id} className="card" style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:30,height:30,borderRadius:8,background:'var(--gold-pale)',color:'var(--gold)',fontWeight:700,fontSize:'.78rem',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                {i+1}
              </div>
              <div style={{width:32,height:32,borderRadius:8,background:
                l.type==='video'?'rgba(59,130,246,.1)':l.type==='assignment'?'rgba(249,115,22,.1)':'rgba(16,185,129,.1)',
                color:l.type==='video'?'#2563eb':l.type==='assignment'?'#ea580c':'#059669',
                display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                {l.type==='video'?<FiVideo size={15}/>:l.type==='assignment'?<FiClipboard size={15}/>:<FiFileText size={15}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontWeight:600,fontSize:'.9rem',color:'var(--navy)',marginBottom:3}}>{l.title}</p>
                <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                  <span className={`badge ${l.type==='video'?'badge-blue':l.type==='assignment'?'badge-orange':'badge-green'}`} style={{fontSize:'.65rem'}}>{l.type}</span>
                  <span style={{fontSize:'.75rem',color:'var(--gray-500)'}}>{l.duration} min</span>
                  <span style={{fontSize:'.75rem',color:'var(--gray-500)'}}>{l.points} pts</span>
                  {l.isPreview && <span className="badge badge-gold" style={{fontSize:'.65rem'}}>Free preview</span>}
                  {(l.videoUrl||l.content) && <span style={{fontSize:'.7rem',color:'var(--green)'}}>✓ Has content</span>}
                </div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteLesson(l._id, l.title)} title="Delete lesson">
                <FiTrash2 size={13}/>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════ QUIZ TAB ════════════════════ */}
      {tab === 'quiz' && !isNew && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
            <div>
              <h2 style={{fontSize:'1.05rem',color:'var(--navy)'}}>Course Quizzes</h2>
              <p style={{fontSize:'.82rem',color:'var(--gray-600)'}}>Auto-graded with timer and attempt limits</p>
            </div>
            <button className="btn btn-navy" onClick={() => { setAddingQ(v => !v); setQuestions([]); setQuiz(EMPTY_QUIZ); }}>
              <FiPlus/> {addingQ ? 'Cancel' : 'Create Quiz'}
            </button>
          </div>

          {addingQ && (
            <div className="card" style={{padding:24,display:'flex',flexDirection:'column',gap:0}}>
              <h3 style={{fontSize:'.95rem',color:'var(--navy)',marginBottom:18}}>🧪 New Quiz</h3>

              {/* Quiz settings */}
              <div className="form-row">
                <div className="form-group" style={{flex:2}}>
                  <label className="form-label">Quiz Title *</label>
                  <input type="text" className="form-input" placeholder="e.g. Chapter 1 — Assessment"
                    value={quiz.title} onChange={e => setQuiz(s=>({...s,title:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Time Limit (min)</label>
                  <input type="number" className="form-input" min="5"
                    value={quiz.timeLimit} onChange={e => setQuiz(s=>({...s,timeLimit:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Pass Score (%)</label>
                  <input type="number" className="form-input" min="1" max="100"
                    value={quiz.passingScore} onChange={e => setQuiz(s=>({...s,passingScore:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Attempts</label>
                  <input type="number" className="form-input" min="1" max="10"
                    value={quiz.maxAttempts} onChange={e => setQuiz(s=>({...s,maxAttempts:e.target.value}))} />
                </div>
              </div>

              {/* Existing questions */}
              {questions.length > 0 && (
                <div style={{marginBottom:16}}>
                  <p style={{fontSize:'.82rem',fontWeight:700,color:'var(--navy)',marginBottom:10}}>{questions.length} question{questions.length>1?'s':''} added:</p>
                  {questions.map((q,i) => (
                    <div key={i} style={{display:'flex',gap:10,padding:'10px 14px',background:'var(--gray-100)',borderRadius:8,marginBottom:6,borderLeft:'3px solid var(--gold)'}}>
                      <span style={{fontWeight:700,color:'var(--gold)',fontSize:'.78rem',flexShrink:0,marginTop:1}}>Q{i+1}</span>
                      <p style={{fontSize:'.875rem',color:'var(--navy)',flex:1}}>{q.text}</p>
                      <button type="button" className="btn btn-danger btn-sm" style={{padding:'3px 8px'}} onClick={() => setQuestions(prev=>prev.filter((_,j)=>j!==i))}>
                        <FiTrash2 size={11}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New question builder */}
              <div style={{background:'rgba(200,168,75,.05)',border:'1px solid rgba(200,168,75,.2)',borderRadius:10,padding:18,marginBottom:16}}>
                <p style={{fontSize:'.82rem',fontWeight:700,color:'var(--navy)',marginBottom:14}}>➕ Add Question</p>
                <div className="form-row">
                  <div className="form-group" style={{flex:3}}>
                    <label className="form-label">Question Text *</label>
                    <input type="text" className="form-input" placeholder="Enter your question here..."
                      value={newQ.text} onChange={e => setNewQ(s=>({...s,text:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-input" value={newQ.type} onChange={e => setNewQ(s=>({...s,type:e.target.value}))}>
                      <option value="mcq">Multiple Choice</option>
                      <option value="true_false">True / False</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Points</label>
                    <input type="number" className="form-input" min="1" style={{maxWidth:80}}
                      value={newQ.points} onChange={e => setNewQ(s=>({...s,points:e.target.value}))} />
                  </div>
                </div>

                {/* MCQ options */}
                {newQ.type === 'mcq' && (
                  <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:12}}>
                    <label className="form-label">Answer Options <span style={{color:'var(--gray-400)',fontWeight:400}}>(click ✓ to mark correct answer)</span></label>
                    {newQ.options.map((opt,i) => (
                      <div key={i} style={{display:'flex',gap:8,alignItems:'center'}}>
                        <button type="button"
                          onClick={() => setNewQ(s => ({ ...s, options: s.options.map((o,j) => ({...o, isCorrect: j===i})) }))}
                          style={{width:32,height:32,border:`2px solid ${opt.isCorrect?'#10b981':'var(--gray-200)'}`,borderRadius:8,background:opt.isCorrect?'#10b981':'transparent',color:opt.isCorrect?'white':'var(--gray-400)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .2s'}}>
                          <FiCheck size={14}/>
                        </button>
                        <input type="text" className="form-input" placeholder={`Option ${String.fromCharCode(65+i)}`}
                          value={opt.text}
                          onChange={e => { const opts=[...newQ.options]; opts[i]={...opts[i],text:e.target.value}; setNewQ(s=>({...s,options:opts})); }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* True/False options */}
                {newQ.type === 'true_false' && (
                  <div style={{display:'flex',gap:12,marginBottom:12}}>
                    {['True','False'].map((val,i) => (
                      <button key={val} type="button"
                        onClick={() => setNewQ(s => ({ ...s, options: [{text:'True',isCorrect:val==='True'},{text:'False',isCorrect:val==='False'}] }))}
                        style={{padding:'10px 28px',border:`2px solid ${newQ.options[i]?.isCorrect?'#10b981':'var(--gray-200)'}`,borderRadius:10,background:newQ.options[i]?.isCorrect?'rgba(16,185,129,.1)':'transparent',color:newQ.options[i]?.isCorrect?'#047857':'var(--gray-600)',fontFamily:'var(--font-body)',fontWeight:700,cursor:'pointer',fontSize:'.9rem',transition:'all .2s'}}>
                        {val}
                      </button>
                    ))}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Explanation <span style={{color:'var(--gray-400)',fontWeight:400}}>(shown after answer)</span></label>
                  <input type="text" className="form-input" placeholder="Explain the correct answer..."
                    value={newQ.explanation} onChange={e => setNewQ(s=>({...s,explanation:e.target.value}))} />
                </div>

                <button type="button" className="btn btn-outline" onClick={addQuestion}>
                  <FiPlus size={14}/> Add this question
                </button>
              </div>

              {/* Create quiz button */}
              <div style={{display:'flex',gap:10,paddingTop:12,borderTop:'1px solid var(--gray-200)'}}>
                <button type="button" className="btn btn-gold" disabled={savingQ} onClick={handleCreateQuiz}>
                  <FiAward size={14}/> {savingQ ? 'Creating…' : `Create Quiz (${questions.length} question${questions.length!==1?'s':''})`}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => { setAddingQ(false); setQuestions([]); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!addingQ && questions.length === 0 && (
            <div className="empty-state card" style={{padding:40}}>
              <FiAward size={36}/>
              <h3>No quizzes yet</h3>
              <p>Create a quiz to test your students' knowledge</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
