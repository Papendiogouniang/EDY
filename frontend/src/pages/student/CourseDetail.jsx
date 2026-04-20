import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCourse, checkEnrollment, enrollStudent, getCourseProgress, getCourseQuizzes } from '../../utils/api';
import { FiBook, FiUsers, FiClock, FiChevronDown, FiChevronUp, FiPlay, FiFileText, FiClipboard, FiLock, FiCheckCircle, FiAward, FiArrowLeft, FiExternalLink } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import './StudentPages.css';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse]     = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState({ progressList:[], completionPercentage:0 });
  const [quizzes, setQuizzes]   = useState([]);
  const [openIdx, setOpenIdx]   = useState(0);
  const [enrolling, setEnrolling] = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([getCourse(id), checkEnrollment(id), getCourseProgress(id), getCourseQuizzes(id)])
      .then(([cRes, eRes, pRes, qRes]) => {
        setCourse(cRes.data.course);
        setEnrolled(eRes.data.isEnrolled);
        setProgress(pRes.data);
        setQuizzes(qRes.data.quizzes || []);
      }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await enrollStudent(id);
      setEnrolled(true);
      toast.success('Enrolled! 🎉 Start learning now.');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setEnrolling(false); }
  };

  const isLessonDone = (lessonId) => progress.progressList?.some(p => (p.lesson === lessonId || p.lesson === lessonId?.toString() || p.lesson?.toString() === lessonId?.toString()) && p.completed);

  // typeIcon removed - not used in JSX

  if (loading) return <div className="spinner" />;
  if (!course)  return <div>Course not found</div>;

  const firstLesson = course.lessons?.[0];
  const upcomingMeets = course.meets?.filter(m => m.status !== 'ended') || [];

  return (
    <div className="course-detail fade-up">
      <Link to="/student/courses" className="btn btn-ghost btn-sm" style={{ width:'fit-content' }}>
        <FiArrowLeft /> Back to courses
      </Link>

      {/* Hero */}
      <div className="cd-hero">
        <div className="cd-hero-content">
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
            <span className="badge badge-gold">{course.category}</span>
            <span className={`badge level-${(course.level||'').toLowerCase()}`}>{course.level}</span>
            <span className="badge badge-navy">🌐 English</span>
            {course.hasCertificate && <span className="badge badge-purple">🏆 Certificate</span>}
          </div>
          <h1>{course.title}</h1>
          <p>{course.description?.slice(0, 200)}…</p>
          <div className="cd-hero-meta">
            <span><FiUsers size={13} /> {course.enrollmentCount} students</span>
            <span><FiBook size={13} /> {course.lessons?.length || 0} lessons</span>
            {course.duration > 0 && <span><FiClock size={13} /> {course.duration}h</span>}
            <span>📅 {course.academicYear}</span>
          </div>
          {course.teacher && (
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:14 }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--gold)', color:'var(--navy)', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.85rem' }}>
                {course.teacher.firstName?.[0]}{course.teacher.lastName?.[0]}
              </div>
              <div>
                <p style={{ color:'white', fontWeight:600, fontSize:'.9rem' }}>{course.teacher.firstName} {course.teacher.lastName}</p>
                {course.teacher.specialization && <p style={{ color:'rgba(255,255,255,.5)', fontSize:'.75rem' }}>{course.teacher.specialization}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Enrollment card */}
        <div className="cd-hero-card">
          {course.thumbnail && <img src={course.thumbnail} alt={course.title} className="cd-hero-thumb" />}
          {enrolled && (
            <div className="cd-progress-block">
              <div className="cd-progress-labels"><span>Progress</span><strong>{progress.completionPercentage}%</strong></div>
              <div className="progress-track"><div className="progress-bar" style={{ width:`${progress.completionPercentage}%` }} /></div>
              <p style={{ fontSize:'.75rem', color:'var(--gray-600)' }}>{progress.completedLessons}/{progress.totalLessons} lessons completed</p>
            </div>
          )}
          {enrolled ? (
            firstLesson && (
              <Link to={`/student/courses/${id}/lessons/${firstLesson._id}`} className="btn btn-gold btn-full">
                <FiPlay size={15} /> {progress.completionPercentage > 0 ? 'Continue Course' : 'Start Course'}
              </Link>
            )
          ) : (
            <button className="btn btn-gold btn-full btn-lg" onClick={handleEnroll} disabled={enrolling}>
              {enrolling ? 'Enrolling…' : course.isFree ? '🎓 Enroll for Free' : `Enroll — ${course.price} FCFA`}
            </button>
          )}
          {course.hasCertificate && (
            <p style={{ fontSize:'.78rem', textAlign:'center', color:'var(--gray-600)' }}>🏆 Earn a certificate upon completion</p>
          )}
        </div>
      </div>

      <div className="cd-body-grid">
        <div className="cd-section">
          {/* Objectives */}
          {course.objectives?.length > 0 && (
            <div className="cd-card card">
              <h2>What you'll learn</h2>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {course.objectives.map((o,i) => (
                  <div key={i} style={{ display:'flex', gap:8, fontSize:'.875rem', color:'var(--gray-800)' }}>
                    <FiCheckCircle size={15} color="var(--green)" style={{ flexShrink:0, marginTop:2 }} />
                    <span>{o}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lessons */}
          <div className="cd-card card">
            <h2>Course Content · {course.lessons?.length || 0} lessons</h2>
            <div className="lessons-accordion">
              {course.lessons?.map((l, i) => (
                <div key={l._id} className="lesson-row">
                  <div className="lesson-row-header" onClick={() => setOpenIdx(openIdx === i ? -1 : i)}>
                    <div className="lesson-row-left">
                      <span className={`lesson-num ${isLessonDone(l._id) ? 'done' : ''}`}>
                        {isLessonDone(l._id) ? <FiCheckCircle size={13} /> : i+1}
                      </span>
                      <span className={`lesson-type-chip ${l.type}`}>{l.type}</span>
                      <span className="lesson-title">{l.title}</span>
                    </div>
                    <div className="lesson-row-right">
                      {!enrolled && !l.isPreview && <FiLock size={13} color="var(--gray-400)" />}
                      {l.duration > 0 && <span className="lesson-dur">{l.duration}min</span>}
                      {openIdx === i ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                    </div>
                  </div>
                  {openIdx === i && (
                    <div className="lesson-expand">
                      {l.description && <p>{l.description}</p>}
                      {enrolled || l.isPreview ? (
                        <Link to={`/student/courses/${id}/lessons/${l._id}`} className="btn btn-navy btn-sm">
                          {l.type === 'video' ? <><FiPlay size={12}/> Watch</> : <><FiFileText size={12}/> Open</>}
                        </Link>
                      ) : (
                        <span style={{ fontSize:'.8rem', color:'var(--gray-400)', fontStyle:'italic', display:'flex', alignItems:'center', gap:5 }}><FiLock size={12}/> Enroll to unlock</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quizzes */}
          {quizzes.length > 0 && (
            <div className="cd-card card">
              <h2>Quizzes</h2>
              {quizzes.map(q => (
                <div key={q._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'var(--gray-100)', borderRadius:'var(--radius-sm)', marginBottom:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <FiAward size={18} color="var(--gold)" />
                    <div>
                      <p style={{ fontWeight:600, fontSize:'.875rem', color:'var(--navy)' }}>{q.title}</p>
                      <p style={{ fontSize:'.72rem', color:'var(--gray-600)' }}>{q.questions?.length} questions · {q.timeLimit}min · Pass: {q.passingScore}%</p>
                    </div>
                  </div>
                  {enrolled ? (
                    <Link to={`/student/courses/${id}/quiz/${q._id}`} className="btn btn-gold btn-sm"><FiAward size={13} /> Take Quiz</Link>
                  ) : (
                    <span style={{ fontSize:'.78rem', color:'var(--gray-400)', fontStyle:'italic' }}>Enroll to access</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {upcomingMeets.length > 0 && (
            <div className="card" style={{ padding:18 }}>
              <h3 style={{ fontSize:'.9rem', color:'var(--navy)', marginBottom:12 }}>📹 Upcoming Live Sessions</h3>
              {upcomingMeets.map((m, i) => (
                <div key={i} className="meet-row">
                  <span className="meet-plat-icon">{'📹'}</span>
                  <div className="meet-row-info">
                    <h4>{m.title}</h4>
                    <p>{format(new Date(m.scheduledAt), 'MMM dd · HH:mm')} · {m.duration}min</p>
                  </div>
                  <a href={m.meetUrl||'#'} target="_blank" rel="noreferrer" className="btn btn-gold btn-sm"><FiExternalLink size={12}/></a>
                </div>
              ))}
            </div>
          )}

          {course.requirements?.length > 0 && (
            <div className="card" style={{ padding:18 }}>
              <h3 style={{ fontSize:'.9rem', color:'var(--navy)', marginBottom:10 }}>Prerequisites</h3>
              <ul style={{ paddingLeft:18 }}>
                {course.requirements.map((r,i) => <li key={i} style={{ fontSize:'.83rem', color:'var(--gray-600)', marginBottom:5 }}>{r}</li>)}
              </ul>
            </div>
          )}

          {course.teacher?.officeHours && (
            <div className="card" style={{ padding:18 }}>
              <h3 style={{ fontSize:'.9rem', color:'var(--navy)', marginBottom:6 }}>Office Hours</h3>
              <p style={{ fontSize:'.83rem', color:'var(--gray-600)' }}>{course.teacher.officeHours}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
