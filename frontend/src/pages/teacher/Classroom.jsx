import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getCourse, getCourseStudents, getCourseAssignments,
  gradeAssignment, scheduleMeet, addLesson, deleteLesson, updateLesson,
  saveAttendance, saveMeetRecording
} from '../../utils/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import './Classroom.css';

/* ── Icons (Font Awesome) ─────────────────────────────────────────────── */
const Icon = ({ name, className = '' }) => <i className={`fa-solid fa-${name} ${className}`} />;

/* ── Empty lesson form ────────────────────────────────────────────────── */
const EMPTY = {
  title:'', description:'', type:'video',
  videoUrl:'', content:'', duration:15,
  isPreview:false, points:10,
  assignmentInstructions:'', maxScore:100
};

export default function Classroom() {
  const { id }  = useParams();
  const [course,      setCourse]      = useState(null);
  const [students,    setStudents]    = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [tab,         setTab]         = useState('students');
  const [loading,     setLoading]     = useState(true);

  /* Grading */
  const [gradingId,   setGradingId]  = useState(null);
  const [gradeForm,   setGradeForm]  = useState({ grade:'', feedback:'' });

  /* Lesson editing */
  const [editLesson,  setEditLesson] = useState(null);  // lesson object being edited
  const [lessonForm,  setLessonForm] = useState(EMPTY);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [savingLesson,  setSavingLesson]  = useState(false);

  /* Meet scheduling */
  const [showMeet, setShowMeet] = useState(false);
  const [meetForm, setMeetForm] = useState({ title:'', description:'', meetUrl:'', platform:'google_meet', scheduledAt:'', duration:60 });
  const [savingMeet, setSavingMeet] = useState(false);

  /* Attendance modal */
  const [attendanceMeet, setAttendanceMeet] = useState(null);
  const [attendance,     setAttendance]     = useState({}); // {studentId: bool}

  /* Recording url for a meet */
  const [recordingMeet, setRecordingMeet] = useState(null);
  const [recordingUrl,  setRecordingUrl]  = useState('');

  useEffect(() => {
    Promise.all([getCourse(id), getCourseStudents(id), getCourseAssignments(id)])
      .then(([cRes, sRes, aRes]) => {
        setCourse(cRes.data.course);
        setStudents(sRes.data.students || []);
        setSubmissions(aRes.data.submissions || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  /* ── Grade assignment ──────────────────────────────────────────────── */
  const handleGrade = async (subId) => {
    if (!gradeForm.grade) return toast.error('Enter a grade (0–100)');
    try {
      await gradeAssignment(subId, { grade: Number(gradeForm.grade), feedback: gradeForm.feedback });
      setSubmissions(prev => prev.map(s => s._id === subId
        ? { ...s, status:'graded', grade: Number(gradeForm.grade), feedback: gradeForm.feedback }
        : s
      ));
      setGradingId(null);
      toast.success('Graded ✅');
    } catch { toast.error('Grading failed'); }
  };

  /* ── Add lesson ────────────────────────────────────────────────────── */
  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (!lessonForm.title.trim()) return toast.error('Title required');
    setSavingLesson(true);
    try {
      const r = await addLesson(id, { ...lessonForm, duration: Number(lessonForm.duration), points: Number(lessonForm.points), maxScore: Number(lessonForm.maxScore) });
      setCourse(r.data.course);
      setLessonForm(EMPTY);
      setShowAddLesson(false);
      toast.success('Lesson added ✅');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingLesson(false); }
  };

  /* ── Edit lesson ───────────────────────────────────────────────────── */
  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!lessonForm.title.trim()) return toast.error('Title required');
    setSavingLesson(true);
    try {
      const r = await updateLesson(id, editLesson._id, { ...lessonForm, duration: Number(lessonForm.duration), points: Number(lessonForm.points) });
      setCourse(r.data.course);
      setEditLesson(null);
      toast.success('Lesson updated ✅');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingLesson(false); }
  };

  /* ── Delete lesson ─────────────────────────────────────────────────── */
  const handleDeleteLesson = async (lessonId, title) => {
    if (!window.confirm(`Delete lesson "${title}"?`)) return;
    try {
      const r = await deleteLesson(id, lessonId);
      setCourse(r.data.course);
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  /* ── Schedule meet ─────────────────────────────────────────────────── */
  const handleScheduleMeet = async (e) => {
    e.preventDefault();
    if (!meetForm.title.trim() || !meetForm.scheduledAt) return toast.error('Title and date required');
    setSavingMeet(true);
    try {
      const r = await scheduleMeet(id, { ...meetForm, duration: Number(meetForm.duration) });
      setCourse(r.data.course);
      setShowMeet(false);
      setMeetForm({ title:'', description:'', meetUrl:'', platform:'google_meet', scheduledAt:'', duration:60 });
      toast.success('Live session scheduled! Students notified ✅');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingMeet(false); }
  };

  /* ── Save recording URL ────────────────────────────────────────────── */
  const handleSaveRecording = async () => {
    if (!recordingUrl.trim()) return toast.error('Enter the recording URL');
    try {
      await saveMeetRecording(id, recordingMeet, recordingUrl);
      const updatedMeets = course.meets.map(m =>
        m._id === recordingMeet ? { ...m, recordingUrl, isRecorded: true, status:'ended' } : m
      );
      setCourse(prev => ({ ...prev, meets: updatedMeets }));
      toast.success('Recording saved! Students notified ✅');
    } catch { toast.error('Failed to save recording'); }
    setRecordingMeet(null);
    setRecordingUrl('');
  };

  /* ── Attendance save ───────────────────────────────────────────────── */
  const handleSaveAttendance = async () => {
    const present = students.filter(s => attendance[s.student?._id]).map(s => s.student?._id).filter(Boolean);
    const absent  = students.filter(s => !attendance[s.student?._id]).map(s => s.student?._id).filter(Boolean);
    try {
      await saveAttendance(id, attendanceMeet._id, { present, absent });
      toast.success(`Attendance saved: ${present.length}/${students.length} present ✅`);
    } catch { toast.error('Failed to save attendance'); }
    setAttendanceMeet(null);
    setAttendance({});
  };

  if (loading) return <div className="spinner" />;

  const pendingGrades = submissions.filter(s => s.status === 'submitted').length;
  const upcomingMeets = course?.meets?.filter(m => new Date(m.scheduledAt) >= new Date()) || [];
  const pastMeets     = course?.meets?.filter(m => new Date(m.scheduledAt) < new Date())  || [];

  const TABS = [
    { id:'students',   icon:'fa-users',          label:'Students',    badge: students.length },
    { id:'lessons',    icon:'fa-book-open',       label:'Lessons',     badge: course?.lessons?.length || 0 },
    { id:'assignments',icon:'fa-clipboard-list',  label:'Submissions', badge: pendingGrades > 0 ? `${pendingGrades} pending` : (submissions.length || null) },
    { id:'meets',      icon:'fa-video',           label:'Live Sessions', badge: upcomingMeets.length > 0 ? `${upcomingMeets.length} upcoming` : null },
  ];

  return (
    <div className="classroom fade-up">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="cls-header">
        <Link to="/teacher/courses" className="cls-back">
          <i className="fa-solid fa-arrow-left" /> Back
        </Link>
        <div className="cls-header-info">
          <div className="cls-badges">
            {course?.campus && course.campus !== 'All' && <span className="cls-badge"><i className="fa-solid fa-location-dot" /> {course.campus}</span>}
            <span className="cls-badge"><i className="fa-solid fa-layer-group" /> {course?.category}</span>
            <span className="cls-badge"><i className="fa-solid fa-signal" /> {course?.level}</span>
            <span className="cls-badge cls-badge--gold"><i className="fa-solid fa-users" /> {students.length} student{students.length !== 1 ? 's' : ''} enrolled</span>
          </div>
          <h1 className="cls-title">{course?.title}</h1>
          {course?.teacher && (
            <p className="cls-subtitle">
              <i className="fa-solid fa-chalkboard-user" style={{color:'var(--gold)'}} />{' '}
              {course.teacher.firstName} {course.teacher.lastName}
              {course.teacher.specialization && ` · ${course.teacher.specialization}`}
            </p>
          )}
        </div>
        <div className="cls-header-actions">
          <button className="cls-action-btn" onClick={() => setShowMeet(true)}>
            <i className="fa-solid fa-video" /> Schedule Meet
          </button>
          <Link to={`/teacher/courses/${id}/progress`} className="cls-action-btn cls-action-btn--outline">
            <i className="fa-solid fa-chart-line" /> Progress
          </Link>
          <Link to={`/teacher/courses/${id}/quiz-review`} className="cls-action-btn cls-action-btn--outline">
            <i className="fa-solid fa-circle-question" /> Quiz Results
          </Link>
          <Link to={`/teacher/courses/${id}/edit`} className="cls-action-btn cls-action-btn--gold">
            <i className="fa-solid fa-pen-to-square" /> Edit Course
          </Link>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div className="cls-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`cls-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <i className={`fa-solid ${t.icon}`} />
            <span>{t.label}</span>
            {t.badge !== null && t.badge !== undefined && (
              <span className="cls-tab-badge">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ════════ STUDENTS TAB ════════ */}
      {tab === 'students' && (
        <div className="card cls-card">
          {students.length === 0 ? (
            <div className="empty-state" style={{padding:48}}>
              <i className="fa-solid fa-users" style={{fontSize:40,color:'var(--gray-300)'}}/>
              <h3>No students enrolled</h3>
              <p>Ask your admin to enroll students from the Classes panel</p>
            </div>
          ) : (
            <div className="cls-students">
              {students.map((s, i) => {
                const st = s.student;
                if (!st) return null;
                return (
                  <div key={i} className="cls-student-row">
                    <div className="cls-student-avatar">
                      {st.firstName?.[0]}{st.lastName?.[0]}
                    </div>
                    <div className="cls-student-info">
                      <p className="cls-student-name">{st.firstName} {st.lastName}</p>
                      <p className="cls-student-email">{st.email}</p>
                    </div>
                    <div className="cls-student-id">
                      <span className="badge badge-navy" style={{fontSize:'.68rem'}}>{st.studentId || '—'}</span>
                      <span style={{fontSize:'.72rem',color:'var(--gray-500)'}}>{st.campus}</span>
                    </div>
                    <div className="cls-student-level">
                      <span className={`badge level-${(st.level||'beginner').toLowerCase()}`}>{st.level||'Beginner'}</span>
                    </div>
                    <div className="cls-student-progress">
                      <div className="progress-track" style={{width:90}}>
                        <div className="progress-bar" style={{width:`${s.completionPercentage||0}%`}}/>
                      </div>
                      <span style={{fontSize:'.75rem',fontWeight:700,color:'var(--gold)'}}>{s.completionPercentage||0}%</span>
                    </div>
                    <div className="cls-student-pts">
                      <i className="fa-solid fa-star" style={{color:'var(--gold)',fontSize:'.7rem'}}/>{' '}
                      <span style={{fontWeight:700,color:'var(--navy)',fontSize:'.85rem'}}>{st.totalPoints||0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════ LESSONS TAB ════════ */}
      {tab === 'lessons' && (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div className="cls-tab-header">
            <div>
              <p style={{fontSize:'.85rem',color:'var(--gray-600)'}}>{course?.lessons?.length || 0} lessons · Click a lesson to edit it</p>
            </div>
            <button className="cls-action-btn" onClick={() => { setShowAddLesson(v=>!v); setEditLesson(null); setLessonForm(EMPTY); }}>
              <i className="fa-solid fa-plus" /> {showAddLesson ? 'Cancel' : 'Add Lesson'}
            </button>
          </div>

          {/* Add/Edit lesson form */}
          {(showAddLesson || editLesson) && (
            <form onSubmit={editLesson ? handleSaveLesson : handleAddLesson} className="card cls-lesson-form">
              <h3 style={{fontSize:'.95rem',color:'var(--navy)',marginBottom:16}}>
                <i className={`fa-solid ${editLesson ? 'fa-pen' : 'fa-plus'}`}/> {editLesson ? `Edit: ${editLesson.title}` : 'New Lesson'}
              </h3>
              <div className="form-row">
                <div className="form-group" style={{flex:2}}>
                  <label className="form-label">Title *</label>
                  <input type="text" className="form-input" required placeholder="Lesson title…" value={lessonForm.title} onChange={e=>setLessonForm(s=>({...s,title:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input" value={lessonForm.type} onChange={e=>setLessonForm(s=>({...s,type:e.target.value}))}>
                    <option value="video">Video</option>
                    <option value="reading">Reading / PDF</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (min)</label>
                  <input type="number" className="form-input" min="1" value={lessonForm.duration} onChange={e=>setLessonForm(s=>({...s,duration:e.target.value}))}/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" className="form-input" placeholder="Short description…" value={lessonForm.description} onChange={e=>setLessonForm(s=>({...s,description:e.target.value}))}/>
              </div>
              {lessonForm.type === 'video' && (
                <div className="form-group">
                  <label className="form-label"><i className="fa-brands fa-youtube"/> Video URL (YouTube / Vimeo)</label>
                  <input type="url" className="form-input" placeholder="https://www.youtube.com/watch?v=…" value={lessonForm.videoUrl} onChange={e=>setLessonForm(s=>({...s,videoUrl:e.target.value}))}/>
                </div>
              )}
              {lessonForm.type === 'reading' && (
                <>
                  <div className="form-group">
                    <label className="form-label"><i className="fa-solid fa-file-pdf"/> PDF URL</label>
                    <input type="url" className="form-input" placeholder="https://drive.google.com/file/d/…" value={lessonForm.videoUrl} onChange={e=>setLessonForm(s=>({...s,videoUrl:e.target.value}))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Content (Markdown)</label>
                    <textarea className="form-input" rows={6} style={{resize:'vertical',fontFamily:'monospace',fontSize:'.85rem'}} placeholder={'# Title\n\nWrite lesson content in Markdown…'} value={lessonForm.content} onChange={e=>setLessonForm(s=>({...s,content:e.target.value}))}/>
                  </div>
                </>
              )}
              {lessonForm.type === 'assignment' && (
                <div className="form-row">
                  <div className="form-group" style={{flex:2}}>
                    <label className="form-label">Assignment Instructions *</label>
                    <textarea className="form-input" rows={4} style={{resize:'vertical'}} placeholder="Write the assignment instructions…" value={lessonForm.assignmentInstructions} onChange={e=>setLessonForm(s=>({...s,assignmentInstructions:e.target.value}))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Score</label>
                    <input type="number" className="form-input" min="1" max="100" value={lessonForm.maxScore} onChange={e=>setLessonForm(s=>({...s,maxScore:e.target.value}))}/>
                  </div>
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Points</label>
                  <input type="number" className="form-input" min="0" value={lessonForm.points} onChange={e=>setLessonForm(s=>({...s,points:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Free Preview?</label>
                  <select className="form-input" value={lessonForm.isPreview?'yes':'no'} onChange={e=>setLessonForm(s=>({...s,isPreview:e.target.value==='yes'}))}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>
              <div style={{display:'flex',gap:10,paddingTop:12,borderTop:'1px solid var(--gray-200)'}}>
                <button type="submit" className="btn btn-gold" disabled={savingLesson}>
                  {savingLesson ? 'Saving…' : editLesson ? 'Save Changes' : 'Add Lesson'}
                </button>
                <button type="button" className="btn btn-outline" onClick={()=>{setEditLesson(null);setShowAddLesson(false);setLessonForm(EMPTY);}}>Cancel</button>
              </div>
            </form>
          )}

          {/* Lessons list */}
          {course?.lessons?.length === 0 && !showAddLesson && (
            <div className="empty-state card" style={{padding:40}}>
              <i className="fa-solid fa-book-open" style={{fontSize:36,color:'var(--gray-300)'}}/>
              <h3>No lessons yet</h3>
              <p>Click "Add Lesson" to create your first lesson</p>
            </div>
          )}
          {course?.lessons?.map((l, i) => (
            <div key={l._id} className="cls-lesson-row card">
              <div className="cls-lesson-num">{i+1}</div>
              <div className="cls-lesson-icon" style={{color:l.type==='video'?'#2563eb':l.type==='assignment'?'#ea580c':'#059669'}}>
                <i className={`fa-solid ${l.type==='video'?'fa-play-circle':l.type==='assignment'?'fa-clipboard':'fa-file-lines'}`}/>
              </div>
              <div className="cls-lesson-info">
                <p className="cls-lesson-title">{l.title}</p>
                <div className="cls-lesson-meta">
                  <span className={`badge ${l.type==='video'?'badge-blue':l.type==='assignment'?'badge-orange':'badge-green'}`} style={{fontSize:'.65rem'}}>{l.type}</span>
                  <span style={{fontSize:'.75rem',color:'var(--gray-500)'}}><i className="fa-regular fa-clock"/> {l.duration} min</span>
                  <span style={{fontSize:'.75rem',color:'var(--gray-500)'}}><i className="fa-solid fa-star" style={{color:'var(--gold)'}}/> {l.points} pts</span>
                  {l.isPreview && <span className="badge badge-gold" style={{fontSize:'.65rem'}}>Preview</span>}
                  {(l.videoUrl||l.content) && <span style={{fontSize:'.7rem',color:'#059669'}}><i className="fa-solid fa-circle-check"/> Content</span>}
                </div>
              </div>
              <div style={{display:'flex',gap:6,flexShrink:0}}>
                <button className="btn btn-outline btn-sm" title="Edit lesson"
                  onClick={() => { setEditLesson(l); setLessonForm({ title:l.title, description:l.description||'', type:l.type, videoUrl:l.videoUrl||'', content:l.content||'', duration:l.duration||15, isPreview:l.isPreview||false, points:l.points||10, assignmentInstructions:l.assignmentInstructions||'', maxScore:l.maxScore||100 }); setShowAddLesson(false); }}>
                  <i className="fa-solid fa-pen" style={{fontSize:12}}/>
                </button>
                <button className="btn btn-danger btn-sm" title="Delete lesson" onClick={()=>handleDeleteLesson(l._id, l.title)}>
                  <i className="fa-solid fa-trash" style={{fontSize:12}}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════ ASSIGNMENTS/SUBMISSIONS TAB ════════ */}
      {tab === 'assignments' && (
        <div className="card cls-card">
          {submissions.length === 0 ? (
            <div className="empty-state" style={{padding:48}}>
              <i className="fa-solid fa-clipboard-list" style={{fontSize:40,color:'var(--gray-300)'}}/>
              <h3>No submissions yet</h3>
              <p>When students submit assignments, they will appear here for grading</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:0}}>
              {submissions.map((s, i) => (
                <div key={i} className="cls-submission-row" style={{borderBottom:'1px solid var(--gray-200)',padding:'14px 20px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12,flex:1,minWidth:0}}>
                    <div className="cls-student-avatar" style={{width:36,height:36,fontSize:'.8rem',flexShrink:0,overflow:'hidden'}}>
                      {s.student?.avatar
                        ? <img src={s.student.avatar} alt={s.student.firstName} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        : `${s.student?.firstName?.[0]||''}${s.student?.lastName?.[0]||''}`
                      }
                    </div>
                    <div style={{minWidth:0}}>
                      <p style={{fontWeight:600,fontSize:'.875rem',color:'var(--navy)'}}>{s.student?.firstName} {s.student?.lastName}</p>
                      <p style={{fontSize:'.72rem',color:'var(--gray-400)'}}>{s.student?.studentId} · {format(new Date(s.submittedAt), 'dd MMM HH:mm')}</p>
                      {s.content && <p style={{fontSize:'.75rem',color:'var(--gray-600)',marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:260}}>✏️ {s.content.slice(0,80)}{s.content.length>80?'…':''}</p>}
                      {s.fileUrl && (
                        <a href={s.fileUrl} target="_blank" rel="noreferrer" style={{fontSize:'.75rem',color:'var(--navy)',fontWeight:600,display:'inline-flex',alignItems:'center',gap:5,marginTop:3}}>
                          <i className="fa-solid fa-file-pdf" style={{color:'#ef4444'}}/> View attached file
                        </a>
                      )}
                    </div>
                  </div>
                  <span className={`badge ${s.status==='graded'?'badge-green':'badge-orange'}`} style={{fontSize:'.7rem',flexShrink:0}}>
                    {s.status === 'graded' ? `✓ ${s.grade}/100` : 'Pending'}
                  </span>
                  {gradingId === s._id ? (
                    <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                      <input type="number" min={0} max={100} placeholder="Note /100" className="form-input" style={{width:100,padding:'7px 10px',fontSize:'.85rem'}} value={gradeForm.grade} onChange={e=>setGradeForm({...gradeForm,grade:e.target.value})}/>
                      <input type="text" placeholder="Commentaire…" className="form-input" style={{width:200,padding:'7px 10px',fontSize:'.85rem'}} value={gradeForm.feedback} onChange={e=>setGradeForm({...gradeForm,feedback:e.target.value})}/>
                      <button className="btn btn-gold btn-sm" onClick={()=>handleGrade(s._id)}><i className="fa-solid fa-check"/></button>
                      <button className="btn btn-outline btn-sm" onClick={()=>setGradingId(null)}><i className="fa-solid fa-xmark"/></button>
                    </div>
                  ) : (
                    <button className="btn btn-navy btn-sm" style={{flexShrink:0}}
                      onClick={()=>{setGradingId(s._id);setGradeForm({grade:s.grade||'',feedback:s.feedback||''});}}>
                      <i className="fa-solid fa-graduation-cap"/> {s.status==='graded'?'Re-grade':'Grade'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════ LIVE SESSIONS TAB ════════ */}
      {tab === 'meets' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="cls-tab-header">
            <p style={{fontSize:'.85rem',color:'var(--gray-600)'}}>{course?.meets?.length||0} sessions · You can add recording URLs and take attendance</p>
            <button className="cls-action-btn" onClick={()=>setShowMeet(true)}>
              <i className="fa-solid fa-video"/> Schedule New Session
            </button>
          </div>

          {course?.meets?.length === 0 ? (
            <div className="empty-state card" style={{padding:40}}>
              <i className="fa-solid fa-video-slash" style={{fontSize:36,color:'var(--gray-300)'}}/>
              <h3>No sessions yet</h3>
              <p>Schedule a live session — all enrolled students will be notified</p>
            </div>
          ) : (
            <>
              {upcomingMeets.length > 0 && (
                <div>
                  <p style={{fontSize:'.78rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'var(--gold)',marginBottom:8}}>Upcoming</p>
                  {upcomingMeets.map((m, i) => <MeetCard key={i} meet={m} students={students} onAttendance={(meet)=>{setAttendanceMeet(meet);setAttendance({});}} onRecording={(meet)=>{setRecordingMeet(meet._id);setRecordingUrl(meet.recordingUrl||'');}} />)}
                </div>
              )}
              {pastMeets.length > 0 && (
                <div>
                  <p style={{fontSize:'.78rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'var(--gray-400)',marginBottom:8}}>Past Sessions</p>
                  {pastMeets.map((m, i) => <MeetCard key={i} meet={m} students={students} onAttendance={(meet)=>{setAttendanceMeet(meet);setAttendance({});}} onRecording={(meet)=>{setRecordingMeet(meet._id);setRecordingUrl(meet.recordingUrl||'');}} />)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ════════ SCHEDULE MEET MODAL ════════ */}
      {showMeet && (
        <div className="modal-overlay" onClick={()=>setShowMeet(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fa-solid fa-video" style={{color:'var(--gold)',marginRight:8}}/> Schedule Live Session</h2>
              <button className="modal-close" onClick={()=>setShowMeet(false)}>✕</button>
            </div>
            <form onSubmit={handleScheduleMeet}>
              <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:0}}>
                <div className="form-group">
                  <label className="form-label">Session Title *</label>
                  <input type="text" className="form-input" required placeholder="e.g. Week 3 — Q&A Session" value={meetForm.title} onChange={e=>setMeetForm(s=>({...s,title:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={2} style={{resize:'vertical'}} placeholder="What will be covered?" value={meetForm.description} onChange={e=>setMeetForm(s=>({...s,description:e.target.value}))}/>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Platform</label>
                    <select className="form-input" value={meetForm.platform} onChange={e=>setMeetForm(s=>({...s,platform:e.target.value}))}>
                      <option value="google_meet">Google Meet</option>
                      <option value="zoom">Zoom</option>
                      <option value="teams">Microsoft Teams</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (min)</label>
                    <input type="number" className="form-input" min="15" value={meetForm.duration} onChange={e=>setMeetForm(s=>({...s,duration:e.target.value}))}/>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Meeting Link (optional)</label>
                  <input type="url" className="form-input" placeholder="https://meet.google.com/…" value={meetForm.meetUrl} onChange={e=>setMeetForm(s=>({...s,meetUrl:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Date & Time *</label>
                  <input type="datetime-local" className="form-input" required value={meetForm.scheduledAt} onChange={e=>setMeetForm(s=>({...s,scheduledAt:e.target.value}))}/>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={()=>setShowMeet(false)}>Cancel</button>
                <button type="submit" className="btn btn-gold" disabled={savingMeet}>
                  <i className="fa-solid fa-calendar-plus"/> {savingMeet?'Scheduling…':'Schedule & Notify Students'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════ ATTENDANCE MODAL ════════ */}
      {attendanceMeet && (
        <div className="modal-overlay" onClick={()=>setAttendanceMeet(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fa-solid fa-list-check" style={{color:'var(--gold)',marginRight:8}}/> Attendance — {attendanceMeet.title}</h2>
              <button className="modal-close" onClick={()=>setAttendanceMeet(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{fontSize:'.82rem',color:'var(--gray-600)',marginBottom:14}}>Mark which students attended this session:</p>
              {students.length === 0 && <p style={{color:'var(--gray-400)',fontStyle:'italic'}}>No students enrolled</p>}
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {students.map((s, i) => {
                  const st = s.student;
                  if (!st) return null;
                  const present = attendance[st._id] || false;
                  return (
                    <label key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,border:`1.5px solid ${present?'var(--gold)':'var(--gray-200)'}`,background:present?'rgba(208,170,49,.08)':'transparent',cursor:'pointer',transition:'all .2s'}}>
                      <input type="checkbox" checked={present} onChange={e=>setAttendance(a=>({...a,[st._id]:e.target.checked}))} style={{display:'none'}}/>
                      <div style={{width:32,height:32,borderRadius:'50%',background:present?'var(--gold)':'var(--gray-200)',color:present?'var(--navy)':'var(--gray-400)',fontWeight:700,fontSize:'.75rem',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {st.firstName?.[0]}{st.lastName?.[0]}
                      </div>
                      <div style={{flex:1}}>
                        <p style={{fontWeight:600,fontSize:'.875rem',color:'var(--navy)'}}>{st.firstName} {st.lastName}</p>
                        <p style={{fontSize:'.72rem',color:'var(--gray-400)'}}>{st.studentId}</p>
                      </div>
                      <span style={{width:26,height:26,borderRadius:'50%',border:`2px solid ${present?'var(--gold)':'var(--gray-300)'}`,background:present?'var(--gold)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}}>
                        {present && <i className="fa-solid fa-check" style={{fontSize:11,color:'var(--navy)'}}/>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <span style={{fontSize:'.85rem',color:'var(--gray-600)'}}>{Object.values(attendance).filter(Boolean).length}/{students.length} present</span>
              <button className="btn btn-gold" onClick={handleSaveAttendance}>
                <i className="fa-solid fa-save"/> Save Attendance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ RECORDING URL MODAL ════════ */}
      {recordingMeet && (
        <div className="modal-overlay" onClick={()=>setRecordingMeet(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fa-solid fa-circle-dot" style={{color:'#ef4444',marginRight:8}}/> Add Recording</h2>
              <button className="modal-close" onClick={()=>setRecordingMeet(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{fontSize:'.85rem',color:'var(--gray-600)',marginBottom:14}}>
                Paste the recording URL so students can watch the replay anytime.
              </p>
              <div className="form-group">
                <label className="form-label">Recording URL</label>
                <input type="url" className="form-input" placeholder="https://drive.google.com/file/d/… or YouTube link"
                  value={recordingUrl} onChange={e=>setRecordingUrl(e.target.value)} autoFocus/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setRecordingMeet(null)}>Cancel</button>
              <button className="btn btn-gold" onClick={handleSaveRecording}>
                <i className="fa-solid fa-link"/> Save Recording URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Meet Card component ──────────────────────────────────────────────── */
function MeetCard({ meet, students, onAttendance, onRecording }) {
  const _isPast   = new Date(meet.scheduledAt) < new Date(); // eslint-disable-line no-unused-vars
  const platIcons = { google_meet:'fa-google', zoom:'fa-video', teams:'fa-microsoft', other:'fa-video' };
  return (
    <div className="card cls-meet-card">
      <div className="cls-meet-left">
        <div className="cls-meet-icon">
          <i className={`fa-brands ${platIcons[meet.platform] || 'fa-video'}`}/>
        </div>
        <div>
          <p className="cls-meet-title">{meet.title}</p>
          <p className="cls-meet-meta">
            <i className="fa-regular fa-calendar"/> {format(new Date(meet.scheduledAt), 'dd MMM yyyy · HH:mm')}
            {' · '}<i className="fa-regular fa-clock"/> {meet.duration} min
          </p>
          {meet.description && <p style={{fontSize:'.78rem',color:'var(--gray-500)',marginTop:2}}>{meet.description}</p>}
          {meet.isRecorded && meet.recordingUrl && (
            <a href={meet.recordingUrl} target="_blank" rel="noreferrer" style={{fontSize:'.78rem',color:'var(--navy)',fontWeight:600,display:'inline-flex',alignItems:'center',gap:5,marginTop:4}}>
              <i className="fa-solid fa-circle-dot" style={{color:'#ef4444'}}/> Watch Recording
            </a>
          )}
        </div>
      </div>
      <div className="cls-meet-actions">
        {meet.meetUrl && (
          <a href={meet.meetUrl} target="_blank" rel="noreferrer" className="btn btn-gold btn-sm">
            <i className="fa-solid fa-arrow-up-right-from-square"/> Join
          </a>
        )}
        <button className="btn btn-outline btn-sm" onClick={()=>onAttendance(meet)} title="Take attendance">
          <i className="fa-solid fa-list-check"/> Attendance
        </button>
        <button className="btn btn-outline btn-sm" onClick={()=>onRecording(meet)} title="Add recording URL">
          <i className="fa-solid fa-circle-dot" style={{color:'#ef4444'}}/> Recording
        </button>
      </div>
    </div>
  );
}
