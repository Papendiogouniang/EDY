import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API, { getCourse, getCourseProgress, markComplete, submitAssignment, getMyAssignments } from '../../utils/api';
import ReactPlayer from 'react-player';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import './LessonPage.css';

/* ── Icon helper ─────────────────────────────────────────────────────── */
const FA = ({ name, style }) => <i className={`fa-solid fa-${name}`} style={style}/>;

export default function LessonPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const [course,     setCourse]     = useState(null);
  const [lesson,     setLesson]     = useState(null);
  const [progress,   setProgress]   = useState({ progressList:[], completionPercentage:0 });
  const [completed,  setCompleted]  = useState(false);
  const [marking,    setMarking]    = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [sidebarOpen,setSidebarOpen]= useState(true);
  const [assignmentText, setAssignmentText] = useState('');
  const [mySubmission,   setMySubmission]   = useState(null);
  const [submitting,     setSubmitting]     = useState(false);
  const [uploadingFile,  setUploadingFile]  = useState(false);
  const [attachedFile,   setAttachedFile]   = useState(null);  // {name, url}
  const fileRef = useRef();

  const isLessonDone = useCallback((lId, pList) => {
    return (pList || progress.progressList)?.some(
      p => (p.lesson === lId || p.lesson?.toString() === lId?.toString()) && p.completed
    );
  }, [progress.progressList]);

  useEffect(() => {
    setLoading(true);
    Promise.all([getCourse(courseId), getCourseProgress(courseId)])
      .then(([cRes, pRes]) => {
        const c = cRes.data.course;
        const l = c.lessons?.find(x => x._id === lessonId);
        setCourse(c);
        setLesson(l);
        setProgress(pRes.data);
        setCompleted(isLessonDone(lessonId, pRes.data.progressList));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [courseId, lessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (lesson?.type === 'assignment') {
      getMyAssignments(courseId).then(r => {
        const sub = r.data.submissions?.find(
          s => s.lessonId?.toString() === lessonId?.toString()
        );
        if (sub) { setMySubmission(sub); setAssignmentText(sub.content || ''); }
        else { setMySubmission(null); setAssignmentText(''); }
      }).catch(() => {});
    }
  }, [lessonId, courseId, lesson?.type]);

  const handleMarkDone = async () => {
    if (completed || marking) return;
    setMarking(true);
    try {
      const res = await markComplete({ courseId, lessonId, watchedTime: (lesson?.duration || 0) * 60 });
      setCompleted(true);
      setProgress(p => ({ ...p, completionPercentage: res.data.completionPercentage || p.completionPercentage }));
      toast.success('Lesson completed! +' + (lesson?.points || 10) + ' pts 🎉');
    } catch { toast.error('Failed'); }
    finally { setMarking(false); }
  };

  const handleSubmitAssignment = async () => {
    if (!assignmentText.trim()) return toast.error('Please write your answer first');
    setSubmitting(true);
    try {
      const res = await submitAssignment({ courseId, lessonId, content: assignmentText, fileUrl: attachedFile?.url || '' });
      setMySubmission(res.data.submission);
      toast.success('Assignment submitted! ✅');
      handleMarkDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}><div className="spinner"/></div>;
  if (!lesson || !course) return (
    <div style={{padding:40,textAlign:'center'}}>
      <FA name="triangle-exclamation" style={{fontSize:40,color:'#f97316'}}/>
      <h2 style={{marginTop:16}}>Lesson not found</h2>
      <Link to={`/student/courses/${courseId}`} className="btn btn-navy" style={{marginTop:12}}>Back to Course</Link>
    </div>
  );

  const lessons      = course.lessons || [];
  const lessonIndex  = lessons.findIndex(l => l._id === lessonId);
  const prevLesson   = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const nextLesson   = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;
  const pct          = progress.completionPercentage || 0;

  const typeIcon = (t) => ({ video:'play', reading:'file-lines', assignment:'clipboard-list' })[t] || 'book';
  const typeColor= (t) => ({ video:'#3b82f6', reading:'#10b981', assignment:'#f97316' })[t] || '#6b7280';

  return (
    <div className="lesson-layout">

      {/* ── TOP BAR ──────────────────────────────────────────────── */}
      <header className="lesson-topbar">
        <Link to={`/student/courses/${courseId}`} className="lesson-back">
          <FA name="arrow-left"/> {course.title}
        </Link>
        <div className="lesson-topbar-center">
          <span className="lesson-num">Lesson {lessonIndex + 1}/{lessons.length}</span>
          <h2 className="lesson-topbar-title">{lesson.title}</h2>
        </div>
        <div className="lesson-topbar-right">
          <div className="lesson-progress-wrap">
            <div className="lesson-progress-track">
              <div className="lesson-progress-bar" style={{width:`${pct}%`}}/>
            </div>
            <span className="lesson-progress-label">{pct}%</span>
          </div>
          <button
            className={`lesson-done-btn ${completed ? 'done' : ''}`}
            onClick={handleMarkDone}
            disabled={completed || marking || lesson.type === 'assignment'}
          >
            <FA name={completed ? 'circle-check' : 'check'}/>
            {completed ? 'Completed' : marking ? '…' : 'Mark Done'}
          </button>
          <button className="lesson-sidebar-toggle" onClick={() => setSidebarOpen(v => !v)} title="Toggle playlist">
            <FA name="list"/>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT + SIDEBAR ───────────────────────────────── */}
      <div className={`lesson-body ${sidebarOpen ? 'with-sidebar' : ''}`}>

        {/* ── LEFT: LESSON CONTENT ────────────────────────────── */}
        <main className="lesson-main">

          {/* VIDEO */}
          {lesson.type === 'video' && lesson.videoUrl && (
            <div className="lesson-player-wrap">
              <ReactPlayer
                url={lesson.videoUrl}
                width="100%" height="100%"
                controls
                onEnded={handleMarkDone}
                config={{ youtube: { playerVars: { showinfo: 1 } } }}
              />
            </div>
          )}

          {/* NO VIDEO URL */}
          {lesson.type === 'video' && !lesson.videoUrl && (
            <div className="lesson-no-video">
              <FA name="video-slash" style={{fontSize:48,color:'var(--gray-300)'}}/>
              <p>No video URL for this lesson</p>
            </div>
          )}

          {/* READING: PDF viewer */}
          {lesson.type === 'reading' && lesson.videoUrl && (
            <div className="lesson-pdf-wrap">
              <div className="lesson-pdf-bar">
                <span><FA name="file-pdf" style={{color:'#ef4444'}}/> {lesson.title}</span>
                <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                  <FA name="arrow-up-right-from-square"/> Open
                </a>
              </div>
              {lesson.videoUrl.toLowerCase().includes('.pdf') ? (
                <iframe src={lesson.videoUrl} title={lesson.title} className="lesson-pdf-frame"/>
              ) : (
                <div className="lesson-pdf-fallback">
                  <FA name="file-lines" style={{fontSize:56,color:'var(--gold)'}}/>
                  <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="btn btn-gold">
                    <FA name="download"/> Open Resource
                  </a>
                </div>
              )}
            </div>
          )}

          {/* TEXT CONTENT (markdown) */}
          {lesson.content && (
            <div className="lesson-content-body">
              <ReactMarkdown>{lesson.content}</ReactMarkdown>
            </div>
          )}

          {/* ASSIGNMENT */}
          {lesson.type === 'assignment' && (
            <div className="lesson-assignment">
              <div className="lesson-assignment-header">
                <FA name="clipboard-list" style={{color:'var(--gold)',fontSize:20}}/>
                <h3>Assignment</h3>
              </div>
              {lesson.assignmentInstructions && (
                <div className="lesson-instructions">
                  <p style={{fontWeight:700,fontSize:'.82rem',color:'var(--gray-500)',marginBottom:8}}>
                    <FA name="circle-info"/> Instructions
                  </p>
                  <p style={{lineHeight:1.8}}>{lesson.assignmentInstructions}</p>
                  <p style={{fontSize:'.78rem',color:'var(--gray-500)',marginTop:8}}>
                    <FA name="star" style={{color:'var(--gold)'}}/> Max score: {lesson.maxScore || 100} points
                  </p>
                </div>
              )}

              {mySubmission?.status === 'graded' ? (
                <div className="lesson-graded">
                  <div className="lesson-graded-score">
                    <span className="score-num">{mySubmission.grade}</span>
                    <span className="score-denom">/{lesson.maxScore || 100}</span>
                  </div>
                  <div>
                    <p style={{fontWeight:700,color:'#047857',marginBottom:6}}>✅ Graded by your teacher</p>
                    {mySubmission.feedback && (
                      <p style={{fontSize:'.875rem',color:'var(--gray-700)',background:'var(--gray-100)',padding:'10px 14px',borderRadius:8}}>
                        <FA name="comment" style={{color:'var(--gold)',marginRight:6}}/>{mySubmission.feedback}
                      </p>
                    )}
                  </div>
                </div>
              ) : mySubmission?.status === 'submitted' ? (
                <div className="lesson-submitted">
                  <FA name="clock" style={{fontSize:24,color:'#f97316'}}/>
                  <div>
                    <p style={{fontWeight:700,color:'#c2410c'}}>Submitted — awaiting grading</p>
                    <p style={{fontSize:'.82rem',color:'var(--gray-500)',marginTop:4}}>
                      Your teacher will grade your work soon
                    </p>
                    {mySubmission.content && (
                      <details style={{marginTop:10}}>
                        <summary style={{cursor:'pointer',fontSize:'.82rem',color:'var(--navy)',fontWeight:600}}>View my submission</summary>
                        <p style={{marginTop:8,fontSize:'.85rem',whiteSpace:'pre-wrap',background:'var(--gray-100)',padding:12,borderRadius:8}}>{mySubmission.content}</p>
                      </details>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{display:'block',fontWeight:600,color:'var(--navy)',marginBottom:8}}>
                    Your Answer
                  </label>
                  <textarea
                    className="form-input"
                    rows={8}
                    style={{resize:'vertical',width:'100%',fontFamily:'inherit'}}
                    placeholder="Write your answer here… (you can also attach a PDF below)"
                    value={assignmentText}
                    onChange={e => setAssignmentText(e.target.value)}
                  />

                  {/* PDF Attachment */}
                  <div style={{marginTop:14,padding:'14px 16px',background:'rgba(208,170,49,.06)',border:'1px solid rgba(208,170,49,.18)',borderRadius:10}}>
                    <p style={{fontWeight:700,fontSize:'.82rem',color:'#7a5c10',marginBottom:10,display:'flex',alignItems:'center',gap:7}}>
                      <FA name="paperclip"/> Attach a PDF (optional)
                    </p>
                    <input type="file" ref={fileRef} accept=".pdf,.doc,.docx,image/*" style={{display:'none'}}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 20 * 1024 * 1024) return toast.error('Max 20MB');
                        setUploadingFile(true);
                        try {
                          const fd = new FormData();
                          fd.append('image', file);
                          const res = await API.post('/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                          setAttachedFile({ name: file.name, url: res.data.url });
                          toast.success('File attached ✅');
                        } catch { toast.error('Upload failed'); }
                        finally { setUploadingFile(false); e.target.value = ''; }
                      }}
                    />
                    {attachedFile ? (
                      <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.2)',borderRadius:8}}>
                        <FA name="file-pdf" style={{color:'#ef4444',fontSize:18}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{fontWeight:600,fontSize:'.82rem',color:'#047857',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{attachedFile.name}</p>
                          <a href={attachedFile.url} target="_blank" rel="noreferrer" style={{fontSize:'.72rem',color:'#059669'}}>
                            Preview <FA name="external-link"/>
                          </a>
                        </div>
                        <button type="button" style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',padding:4}} onClick={() => setAttachedFile(null)}>
                          <FA name="xmark"/>
                        </button>
                      </div>
                    ) : (
                      <button type="button" className="btn btn-outline btn-sm" disabled={uploadingFile}
                        onClick={() => fileRef.current?.click()}
                        style={{borderColor:'rgba(208,170,49,.4)',color:'#7a5c10'}}>
                        <FA name="upload"/> {uploadingFile ? 'Uploading…' : 'Choose PDF / Image'}
                      </button>
                    )}
                  </div>

                  <button
                    className="btn btn-gold"
                    style={{marginTop:14,width:'100%',justifyContent:'center'}}
                    onClick={handleSubmitAssignment}
                    disabled={submitting || (!assignmentText.trim() && !attachedFile)}
                  >
                    <FA name="paper-plane"/> {submitting ? 'Submitting…' : 'Submit Assignment'}
                  </button>
                  {!assignmentText.trim() && !attachedFile && (
                    <p style={{fontSize:'.72rem',color:'rgba(255,255,255,.35)',textAlign:'center',marginTop:6}}>
                      Write an answer or attach a file to submit
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="lesson-nav">
            {prevLesson ? (
              <Link to={`/student/courses/${courseId}/lessons/${prevLesson._id}`} className="lesson-nav-btn">
                <FA name="arrow-left"/>
                <div><p className="lesson-nav-label">Previous</p><p className="lesson-nav-title">{prevLesson.title}</p></div>
              </Link>
            ) : <div/>}
            {nextLesson ? (
              <Link to={`/student/courses/${courseId}/lessons/${nextLesson._id}`} className="lesson-nav-btn lesson-nav-btn--next">
                <div><p className="lesson-nav-label">Next</p><p className="lesson-nav-title">{nextLesson.title}</p></div>
                <FA name="arrow-right"/>
              </Link>
            ) : (
              <Link to={`/student/courses/${courseId}`} className="lesson-nav-btn lesson-nav-btn--next">
                <div><p className="lesson-nav-label">Course Complete</p><p className="lesson-nav-title">Back to overview</p></div>
                <FA name="flag-checkered"/>
              </Link>
            )}
          </div>
        </main>

        {/* ── RIGHT: PLAYLIST SIDEBAR (Udemy style) ───────────── */}
        {sidebarOpen && (
          <aside className="lesson-sidebar">
            <div className="lesson-sidebar-header">
              <h3>Course Content</h3>
              <span className="lesson-sidebar-count">{lessons.length} lessons</span>
            </div>
            <div className="lesson-sidebar-progress">
              <div className="lesson-progress-track">
                <div className="lesson-progress-bar" style={{width:`${pct}%`}}/>
              </div>
              <span style={{fontSize:'.72rem',fontWeight:700,color:'var(--gold)'}}>{pct}% complete</span>
            </div>
            <div className="lesson-playlist">
              {lessons.map((l, i) => {
                const done    = isLessonDone(l._id);
                const current = l._id === lessonId;
                return (
                  <Link
                    key={l._id}
                    to={`/student/courses/${courseId}/lessons/${l._id}`}
                    className={`playlist-item ${current ? 'active' : ''} ${done ? 'done' : ''}`}
                  >
                    {/* Completion circle */}
                    <div className={`playlist-check ${done ? 'checked' : ''} ${current ? 'current' : ''}`}>
                      {done
                        ? <FA name="check" style={{fontSize:9}}/>
                        : <span style={{fontSize:'.68rem',fontWeight:700}}>{i+1}</span>
                      }
                    </div>
                    {/* Type icon */}
                    <div className="playlist-type-icon">
                      <i className={`fa-solid fa-${typeIcon(l.type)}`} style={{color:current?'var(--gold)':typeColor(l.type),fontSize:'.8rem'}}/>
                    </div>
                    {/* Info */}
                    <div className="playlist-info">
                      <p className="playlist-title">{l.title}</p>
                      <p className="playlist-meta">
                        <i className="fa-regular fa-clock" style={{marginRight:3}}/>{l.duration || 0} min
                        {l.isPreview && <span className="playlist-free">Free</span>}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
