import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCourse, getCourseStudents, getCourseAssignments, getAllAttempts, getCourseQuizzes } from '../../utils/api';
import { FiArrowLeft, FiUsers, FiTrendingUp, FiAward, FiClipboard, FiBook, FiCheckCircle } from 'react-icons/fi';
import './Teacher.css';

export default function StudentProgress() {
  const { id: courseId } = useParams();
  const [course, setCourse]         = useState(null);
  const [students, setStudents]     = useState([]);
  const [quizzes, setQuizzes]       = useState([]);
  const [allAttempts, setAllAttempts]= useState({});
  const [submissions, setSubmissions]= useState([]);
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      getCourse(courseId),
      getCourseStudents(courseId),
      getCourseQuizzes(courseId),
      getCourseAssignments(courseId),
    ]).then(async ([cRes, sRes, qRes, aRes]) => {
      setCourse(cRes.data.course);
      setStudents(sRes.data.students || []);
      setSubmissions(aRes.data.submissions || []);
      const quizList = qRes.data.quizzes || [];
      setQuizzes(quizList);
      // Load all attempts for each quiz
      const attMap = {};
      for (const q of quizList) {
        try {
          const r = await getAllAttempts(q._id);
          attMap[q._id] = r.data.attempts || [];
        } catch {}
      }
      setAllAttempts(attMap);
    }).catch(console.error).finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <div className="spinner" />;

  const avgProgress = students.length ? Math.round(students.reduce((s,st) => s + (st.completionPercentage||0), 0) / students.length) : 0;

  return (
    <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:22}}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <Link to={`/teacher/courses/${courseId}`} className="btn btn-ghost btn-sm"><FiArrowLeft/> Back to class</Link>
        <div>
          <h1 style={{fontSize:'1.4rem',color:'var(--navy)'}}>{course?.title}</h1>
          <p style={{fontSize:'.85rem',color:'var(--gray-600)'}}>Student progress & analytics</p>
        </div>
      </div>

      {/* Class summary */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
        {[
          {icon:FiUsers,    label:'Students',    val:students.length,   color:'#3b82f6'},
          {icon:FiTrendingUp,label:'Avg Progress',val:`${avgProgress}%`, color:'#c8a84b'},
          {icon:FiCheckCircle,label:'Completed',  val:students.filter(s=>s.status==='completed').length, color:'#10b981'},
          {icon:FiAward,    label:'Quizzes',     val:quizzes.length,    color:'#8b5cf6'},
        ].map((s,i) => (
          <div key={i} className="card" style={{padding:18,display:'flex',alignItems:'center',gap:12,borderLeft:`3px solid ${s.color}`}}>
            <div style={{width:40,height:40,borderRadius:10,background:`${s.color}18`,color:s.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><s.icon size={18}/></div>
            <div><p style={{fontFamily:'var(--font-display)',fontSize:'1.5rem',fontWeight:700,color:'var(--navy)'}}>{s.val}</p><p style={{fontSize:'.75rem',color:'var(--gray-600)',fontWeight:500}}>{s.label}</p></div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:22}}>

        {/* Student list with progress */}
        <div className="card" style={{overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid var(--gray-200)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <h2 style={{fontSize:'.95rem',color:'var(--navy)',display:'flex',alignItems:'center',gap:8}}><FiUsers size={16}/> Students</h2>
            <span style={{fontSize:'.78rem',color:'var(--gray-400)'}}>Click to see details</span>
          </div>
          <div>
            {students.length === 0 && <p style={{padding:32,textAlign:'center',color:'var(--gray-400)'}}>No students enrolled</p>}
            {students.map((s,i) => (
              <div key={i}
                onClick={() => setSelected(selected === i ? null : i)}
                style={{display:'flex',alignItems:'center',gap:12,padding:'12px 18px',borderBottom:'1px solid var(--gray-200)',cursor:'pointer',background:selected===i?'rgba(200,168,75,.05)':'transparent',transition:'background .15s'}}
              >
                <div style={{width:36,height:36,borderRadius:'50%',background:'var(--gold)',color:'var(--navy)',fontSize:'.78rem',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {s.student?.firstName?.[0]}{s.student?.lastName?.[0]}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontWeight:600,fontSize:'.875rem',color:'var(--navy)'}}>{s.student?.firstName} {s.student?.lastName}</p>
                  <p style={{fontSize:'.72rem',color:'var(--gray-400)'}}>{s.student?.studentId} · {s.student?.campus}</p>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div className="progress-track" style={{width:80}}>
                      <div className="progress-bar" style={{width:`${s.completionPercentage||0}%`}}/>
                    </div>
                    <span style={{fontSize:'.75rem',fontWeight:700,color:'var(--gold)',minWidth:34,textAlign:'right'}}>{s.completionPercentage||0}%</span>
                  </div>
                  <span className={`badge ${s.status==='completed'?'badge-green':'badge-orange'}`} style={{fontSize:'.65rem'}}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected student detail */}
        <div>
          {selected === null ? (
            <div className="card empty-state" style={{padding:48}}>
              <FiBook size={36}/>
              <h3>Select a student</h3>
              <p>Click on a student to see their detailed progress, quiz scores and assignments</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {/* Student info */}
              <div className="card" style={{padding:20}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                  <div style={{width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold),var(--gold-light))',color:'var(--navy)',fontWeight:700,fontSize:'1rem',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {students[selected]?.student?.firstName?.[0]}{students[selected]?.student?.lastName?.[0]}
                  </div>
                  <div>
                    <h3 style={{fontSize:'1rem',color:'var(--navy)'}}>{students[selected]?.student?.firstName} {students[selected]?.student?.lastName}</h3>
                    <p style={{fontSize:'.78rem',color:'var(--gray-600)'}}>{students[selected]?.student?.email}</p>
                    <div style={{display:'flex',gap:6,marginTop:4}}>
                      <span className="badge badge-navy" style={{fontSize:'.65rem'}}>{students[selected]?.student?.studentId}</span>
                      <span className={`badge level-${(students[selected]?.student?.level||'beginner').toLowerCase()}`} style={{fontSize:'.65rem'}}>{students[selected]?.student?.level||'Beginner'}</span>
                    </div>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'.82rem'}}>
                    <span style={{color:'var(--gray-600)'}}>Course Progress</span>
                    <strong>{students[selected]?.completionPercentage||0}%</strong>
                  </div>
                  <div className="progress-track"><div className="progress-bar" style={{width:`${students[selected]?.completionPercentage||0}%`}}/></div>
                  <p style={{fontSize:'.75rem',color:'var(--gray-400)'}}>{students[selected]?.completedLessons||0} of {students[selected]?.totalLessons||0} lessons completed</p>
                </div>
              </div>

              {/* Quiz scores */}
              {quizzes.length > 0 && (
                <div className="card" style={{overflow:'hidden'}}>
                  <div style={{padding:'12px 16px',borderBottom:'1px solid var(--gray-200)',fontWeight:700,fontSize:'.85rem',color:'var(--navy)',display:'flex',alignItems:'center',gap:8}}>
                    <FiAward size={15}/> Quiz Results
                  </div>
                  {quizzes.map(q => {
                    const stuAttempts = (allAttempts[q._id]||[]).filter(a => a.student?._id === students[selected]?.student?._id);
                    const best = stuAttempts.length ? Math.max(...stuAttempts.map(a=>a.score)) : null;
                    const passed = stuAttempts.some(a=>a.passed);
                    return (
                      <div key={q._id} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 16px',borderBottom:'1px solid var(--gray-200)'}}>
                        <div style={{flex:1}}>
                          <p style={{fontSize:'.85rem',fontWeight:600,color:'var(--navy)'}}>{q.title}</p>
                          <p style={{fontSize:'.72rem',color:'var(--gray-400)'}}>Pass: {q.passingScore}% · {stuAttempts.length} attempt(s)</p>
                        </div>
                        {best !== null ? (
                          <div style={{textAlign:'right'}}>
                            <p style={{fontWeight:700,color:passed?'#10b981':'#ef4444'}}>{best}%</p>
                            <span className={`badge ${passed?'badge-green':'badge-red'}`} style={{fontSize:'.65rem'}}>{passed?'Passed':'Failed'}</span>
                          </div>
                        ) : (
                          <span style={{fontSize:'.78rem',color:'var(--gray-400)',fontStyle:'italic'}}>Not taken</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Assignments */}
              <div className="card" style={{overflow:'hidden'}}>
                <div style={{padding:'12px 16px',borderBottom:'1px solid var(--gray-200)',fontWeight:700,fontSize:'.85rem',color:'var(--navy)',display:'flex',alignItems:'center',gap:8}}>
                  <FiClipboard size={15}/> Assignments
                </div>
                {(() => {
                  const stuSubs = submissions.filter(s => s.student?._id === students[selected]?.student?._id);
                  if (stuSubs.length === 0) return <p style={{padding:'24px 16px',color:'var(--gray-400)',fontSize:'.85rem',fontStyle:'italic'}}>No assignments submitted yet</p>;
                  return stuSubs.map((sub,j) => (
                    <div key={j} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 16px',borderBottom:'1px solid var(--gray-200)'}}>
                      <div style={{flex:1}}>
                        <span className={`badge ${sub.status==='graded'?'badge-green':'badge-orange'}`} style={{fontSize:'.65rem',marginBottom:4}}>{sub.status}</span>
                        <p style={{fontSize:'.85rem',color:'var(--navy)',fontStyle:'italic'}}>{sub.content?.slice(0,60)}…</p>
                      </div>
                      {sub.grade !== null && sub.grade !== undefined ? (
                        <div style={{textAlign:'right'}}>
                          <p style={{fontWeight:700,color:'var(--navy)'}}>{sub.grade}/100</p>
                          {sub.feedback && <p style={{fontSize:'.7rem',color:'var(--gray-600)'}}>💬 has feedback</p>}
                        </div>
                      ) : <span style={{fontSize:'.78rem',color:'var(--gray-400)'}}>Not graded</span>}
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
