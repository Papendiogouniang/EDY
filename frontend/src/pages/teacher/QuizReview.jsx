import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCourse, getCourseQuizzes, getAllAttempts } from '../../utils/api';
import { format } from 'date-fns';

export default function QuizReview() {
  const { id: courseId }      = useParams();
  const [course,   setCourse] = useState(null);
  const [quizzes,  setQuizzes]= useState([]);
  const [selected, setSelected] = useState(null);  // selected quiz
  const [attempts, setAttempts] = useState([]);
  const [loading,  setLoading] = useState(true);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  useEffect(() => {
    Promise.all([getCourse(courseId), getCourseQuizzes(courseId)])
      .then(([cRes, qRes]) => {
        setCourse(cRes.data.course);
        setQuizzes(qRes.data.quizzes || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [courseId]);

  const loadAttempts = async (quiz) => {
    setSelected(quiz);
    setLoadingAttempts(true);
    try {
      const r = await getAllAttempts(quiz._id);
      setAttempts(r.data.attempts || []);
    } catch { setAttempts([]); }
    finally { setLoadingAttempts(false); }
  };

  if (loading) return <div className="spinner" />;

  // Stats for selected quiz
  const passRate  = attempts.length ? Math.round(attempts.filter(a=>a.passed).length / attempts.length * 100) : 0;
  const avgScore  = attempts.length ? Math.round(attempts.reduce((s,a)=>s+a.score,0) / attempts.length) : 0;
  const highScore = attempts.length ? Math.max(...attempts.map(a=>a.score)) : 0;
  const lowScore  = attempts.length ? Math.min(...attempts.map(a=>a.score)) : 0;

  return (
    <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:22}}>

      {/* Breadcrumb */}
      <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
        <Link to={`/teacher/courses/${courseId}`} className="btn btn-ghost btn-sm">
          <i className="fa-solid fa-arrow-left"/> Back to Class
        </Link>
        <span style={{fontSize:'.82rem',color:'var(--gray-400)'}}>/</span>
        <span style={{fontSize:'.9rem',color:'var(--navy)',fontWeight:600}}>{course?.title}</span>
        <span style={{fontSize:'.82rem',color:'var(--gray-400)'}}>/</span>
        <span style={{fontSize:'.9rem',color:'var(--gray-600)'}}>Quiz Results</span>
      </div>

      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h1 className="section-title">Quiz Results</h1>
          <p className="section-sub">{quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} · Click a quiz to see all student attempts</p>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:20,alignItems:'start'}}>

        {/* Quiz list */}
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <p style={{fontSize:'.75rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'var(--gray-400)',marginBottom:4}}>Select a quiz</p>
          {quizzes.length === 0 && (
            <div className="card" style={{padding:24,textAlign:'center'}}>
              <i className="fa-solid fa-circle-question" style={{fontSize:28,color:'var(--gray-300)'}}/>
              <p style={{fontSize:'.85rem',color:'var(--gray-400)',marginTop:8}}>No quizzes yet</p>
              <Link to={`/teacher/courses/${courseId}/edit`} className="btn btn-outline btn-sm" style={{marginTop:10}}>
                Create Quiz
              </Link>
            </div>
          )}
          {quizzes.map(q => (
            <div key={q._id}
              onClick={() => loadAttempts(q)}
              className="card"
              style={{padding:'14px 16px',cursor:'pointer',borderLeft:`3px solid ${selected?._id===q._id?'var(--gold)':'transparent'}`,background:selected?._id===q._id?'rgba(208,170,49,.06)':'white',transition:'all .2s'}}
            >
              <p style={{fontWeight:700,fontSize:'.9rem',color:'var(--navy)',marginBottom:5}}>{q.title}</p>
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                <span style={{fontSize:'.72rem',color:'var(--gray-500)'}}><i className="fa-solid fa-circle-question"/> {q.questions?.length||0} Qs</span>
                <span style={{fontSize:'.72rem',color:'var(--gray-500)'}}><i className="fa-regular fa-clock"/> {q.timeLimit}min</span>
                <span style={{fontSize:'.72rem',color:'var(--gray-500)'}}>Pass: {q.passingScore}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Attempts panel */}
        <div>
          {!selected ? (
            <div className="card empty-state" style={{padding:56}}>
              <i className="fa-solid fa-chart-bar" style={{fontSize:40,color:'var(--gray-200)'}}/>
              <h3>Select a quiz</h3>
              <p>Choose a quiz from the list to see all student results</p>
            </div>
          ) : loadingAttempts ? (
            <div className="spinner"/>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>

              {/* Quiz stats */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
                {[
                  {label:'Attempts',    val:attempts.length,   color:'#3b82f6'},
                  {label:'Pass Rate',   val:`${passRate}%`,    color:'#10b981'},
                  {label:'Avg Score',   val:`${avgScore}%`,    color:'var(--gold)'},
                  {label:'High / Low',  val:`${highScore} / ${lowScore}`, color:'#8b5cf6'},
                ].map((s,i) => (
                  <div key={i} className="card" style={{padding:14,borderLeft:`3px solid ${s.color}`,textAlign:'center'}}>
                    <p style={{fontFamily:'var(--font-display)',fontSize:'1.4rem',fontWeight:700,color:'var(--navy)'}}>{s.val}</p>
                    <p style={{fontSize:'.72rem',color:'var(--gray-500)',fontWeight:500,marginTop:2}}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Attempts table */}
              <div className="card" style={{overflow:'hidden'}}>
                <div style={{padding:'14px 18px',borderBottom:'1px solid var(--gray-200)',fontWeight:700,fontSize:'.875rem',color:'var(--navy)'}}>
                  <i className="fa-solid fa-list-ol" style={{color:'var(--gold)',marginRight:8}}/> Student Attempts
                </div>
                {attempts.length === 0 ? (
                  <div style={{padding:'32px',textAlign:'center',color:'var(--gray-400)',fontSize:'.875rem',fontStyle:'italic'}}>
                    No attempts yet for this quiz
                  </div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column'}}>
                    {/* Header */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 80px 80px 80px 100px',gap:12,padding:'10px 18px',background:'var(--gray-100)',fontSize:'.75rem',fontWeight:700,color:'var(--gray-500)',textTransform:'uppercase',letterSpacing:'.06em'}}>
                      <span>Student</span>
                      <span style={{textAlign:'center'}}>Score</span>
                      <span style={{textAlign:'center'}}>Result</span>
                      <span style={{textAlign:'center'}}>Time</span>
                      <span style={{textAlign:'center'}}>Date</span>
                    </div>
                    {attempts.map((a, i) => (
                      <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 80px 80px 80px 100px',gap:12,padding:'12px 18px',borderBottom:'1px solid var(--gray-200)',alignItems:'center'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold),var(--gold-light))',color:'var(--navy)',fontWeight:700,fontSize:'.78rem',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                            {a.student?.firstName?.[0]}{a.student?.lastName?.[0]}
                          </div>
                          <div>
                            <p style={{fontWeight:600,fontSize:'.875rem',color:'var(--navy)'}}>{a.student?.firstName} {a.student?.lastName}</p>
                            <p style={{fontSize:'.7rem',color:'var(--gray-400)'}}>{a.student?.studentId}</p>
                          </div>
                        </div>
                        <div style={{textAlign:'center'}}>
                          <span style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'1.1rem',color:a.score>=selected.passingScore?'#10b981':'#ef4444'}}>{a.score}%</span>
                        </div>
                        <div style={{textAlign:'center'}}>
                          <span className={`badge ${a.passed?'badge-green':'badge-red'}`} style={{fontSize:'.65rem',justifyContent:'center'}}>
                            {a.passed ? '✓ Pass' : '✗ Fail'}
                          </span>
                        </div>
                        <div style={{textAlign:'center',fontSize:'.78rem',color:'var(--gray-500)'}}>
                          {a.timeTaken ? `${Math.floor(a.timeTaken/60)}m${a.timeTaken%60}s` : '—'}
                        </div>
                        <div style={{textAlign:'center',fontSize:'.72rem',color:'var(--gray-400)'}}>
                          {format(new Date(a.completedAt||a.createdAt), 'dd MMM HH:mm')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Score distribution */}
              {attempts.length > 0 && (
                <div className="card" style={{padding:18}}>
                  <p style={{fontWeight:700,fontSize:'.875rem',color:'var(--navy)',marginBottom:14}}>
                    <i className="fa-solid fa-chart-bar" style={{color:'var(--gold)',marginRight:8}}/>Score Distribution
                  </p>
                  <div style={{display:'flex',gap:6,alignItems:'flex-end',height:80}}>
                    {[0,10,20,30,40,50,60,70,80,90].map(range => {
                      const count = attempts.filter(a => a.score >= range && a.score < range + 10).length;
                      const pct   = attempts.length ? (count / attempts.length * 100) : 0;
                      return (
                        <div key={range} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                          <span style={{fontSize:'.62rem',color:'var(--gray-400)'}}>{count||''}</span>
                          <div style={{width:'100%',background:range >= selected.passingScore ? 'rgba(16,185,129,.6)' : 'rgba(239,68,68,.4)',height:`${Math.max(pct, count > 0 ? 8 : 2)}%`,borderRadius:'3px 3px 0 0',minHeight:count>0?8:2,transition:'height .3s'}}/>
                          <span style={{fontSize:'.6rem',color:'var(--gray-400)'}}>{range}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{fontSize:'.72rem',color:'var(--gray-400)',marginTop:6,textAlign:'center'}}>Score range (pass line: {selected.passingScore}%)</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
