import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEnrolledCourses, getCourses, enrollStudent } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { FiBook, FiSearch, FiUsers, FiClock, FiCheckCircle, FiFilter, FiPlay, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './StudentPages.css';

const CATS   = ['All','Business','Computer Science','Political Science','Biology','English Language','Management','Engineering','Mathematics','Economics','Law'];
const LEVELS = ['All','Beginner','Intermediate','Advanced'];

export default function StudentCourses() {
  const { user }              = useAuth();
  const [tab, setTab]         = useState('enrolled');
  const [enrolled, setEnrolled] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [search, setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel]     = useState('All');
  const [showMyOnly, setShowMyOnly] = useState(true); // auto-filter by campus/program
  const [enrolling, setEnrolling]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getEnrolledCourses(), getCourses()])
      .then(([eRes, cRes]) => {
        setEnrolled(eRes.data.enrollments || []);
        setCatalog(cRes.data.courses || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isEnrolled   = (id) => enrolled.some(e => e.course?._id === id || e.course === id);
  const getEnrollment= (id) => enrolled.find(e => e.course?._id === id || e.course === id);

  const handleEnroll = async (courseId) => {
    setEnrolling(courseId);
    try {
      await enrollStudent(courseId);
      const res = await getEnrolledCourses();
      setEnrolled(res.data.enrollments || []);
      toast.success('Enrolled! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    } finally { setEnrolling(null); }
  };

  // Filter catalog — auto-filter by student's campus and program if showMyOnly
  const filteredCatalog = catalog.filter(c => {
    if (search   && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== 'All' && c.category !== category) return false;
    if (level    !== 'All' && c.level    !== level)    return false;
    if (showMyOnly && user) {
      const campusMatch = !c.campus || c.campus === 'All' || c.campus === user.campus;
      const programMatch= !c.program || !user.program || c.program.toLowerCase().includes(user.program.toLowerCase()) || user.program.toLowerCase().includes(c.program.toLowerCase());
      if (!campusMatch && !programMatch) return false;
    }
    return true;
  });

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-up" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div>
        <h1 className="section-title">My Courses</h1>
        <p className="section-sub">
          {user?.campus && `Campus ${user.campus}`}
          {user?.program && ` · ${user.program}`}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, background:'var(--white)', border:'1px solid var(--gray-200)', borderRadius:'var(--radius-md)', padding:5, width:'fit-content' }}>
        {[
          { id:'enrolled', label:`My Enrolled (${enrolled.length})` },
          { id:'catalog',  label:`Catalog (${filteredCatalog.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'8px 20px', border:'none', borderRadius:10, background:tab===t.id?'var(--navy)':'transparent', color:tab===t.id?'white':'var(--gray-600)', fontFamily:'var(--font-body)', fontWeight:600, fontSize:'.875rem', cursor:'pointer', transition:'all .2s', whiteSpace:'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ENROLLED COURSES ──────────────────────────────────────────────── */}
      {tab === 'enrolled' && (
        <div>
          {enrolled.length === 0 ? (
            <div className="empty-state card">
              <FiBook size={40}/>
              <h3>No courses yet</h3>
              <p>Browse the catalog to enroll in courses for your program</p>
              <button className="btn btn-navy" onClick={() => setTab('catalog')}>Browse Catalog →</button>
            </div>
          ) : (
            <div className="courses-grid">
              {enrolled.map((enr, i) => {
                const c = enr.course;
                if (!c) return null;
                const pct = enr.completionPercentage || 0;
                const lessonsCount = c.lessons?.length || 0;
                return (
                  <Link key={i} to={`/student/courses/${c._id}`} className="course-card card" style={{textDecoration:'none'}}>
                    <div className="cc-thumb">
                      {c.thumbnail
                        ? <img src={c.thumbnail} alt={c.title} />
                        : <div className="cc-thumb-placeholder"><FiBook size={28}/></div>
                      }
                      <span className={`badge ${enr.status==='completed'?'badge-green':'badge-blue'}`} style={{position:'absolute',top:10,right:10,fontSize:'.65rem'}}>
                        {enr.status==='completed'?'✓ Completed':'In Progress'}
                      </span>
                    </div>
                    <div className="cc-body">
                      <div style={{display:'flex',gap:6,marginBottom:6,flexWrap:'wrap'}}>
                        <span className="badge badge-navy" style={{fontSize:'.65rem'}}>{c.category}</span>
                        <span className="badge badge-blue" style={{fontSize:'.65rem'}}>{c.level}</span>
                      </div>
                      <h3 style={{fontSize:'1rem',color:'var(--navy)',marginBottom:4,lineHeight:1.3}}>{c.title}</h3>
                      <p style={{fontSize:'.78rem',color:'var(--gray-600)',marginBottom:10}}>
                        {c.teacher?.firstName} {c.teacher?.lastName}
                      </p>
                      <div style={{marginBottom:8}}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:'.72rem',color:'var(--gray-600)',marginBottom:4}}>
                          <span>Progress</span><span style={{fontWeight:700,color:'var(--gold)'}}>{pct}%</span>
                        </div>
                        <div className="progress-track"><div className="progress-bar" style={{width:`${pct}%`}}/></div>
                      </div>
                      <div style={{display:'flex',gap:12,fontSize:'.72rem',color:'var(--gray-500)'}}>
                        <span><FiBook size={11}/> {lessonsCount} lessons</span>
                        {c.duration > 0 && <span><FiClock size={11}/> {c.duration}h</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CATALOG ──────────────────────────────────────────────────────── */}
      {tab === 'catalog' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>

          {/* Filters */}
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
            <div style={{position:'relative',flex:1,minWidth:200}}>
              <FiSearch style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--gray-400)'}} size={15}/>
              <input type="text" className="form-input" style={{paddingLeft:38}} placeholder="Search courses…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-input" style={{width:'auto'}} value={category} onChange={e => setCategory(e.target.value)}>
              {CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="form-input" style={{width:'auto'}} value={level} onChange={e => setLevel(e.target.value)}>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button
              onClick={() => setShowMyOnly(v => !v)}
              style={{padding:'10px 16px',border:`1px solid ${showMyOnly?'var(--navy)':'var(--gray-200)'}`,borderRadius:'var(--radius-sm)',background:showMyOnly?'var(--navy)':'transparent',color:showMyOnly?'white':'var(--gray-600)',fontFamily:'var(--font-body)',fontWeight:600,fontSize:'.82rem',cursor:'pointer',transition:'all .2s',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:6}}
            >
              <FiFilter size={14}/>
              {showMyOnly ? `My Campus (${user?.campus})` : 'All Campuses'}
            </button>
          </div>

          {/* Info banner when filtered */}
          {showMyOnly && user && (
            <div style={{padding:'10px 16px',background:'rgba(200,168,75,.08)',border:'1px solid rgba(200,168,75,.2)',borderRadius:'var(--radius-sm)',fontSize:'.82rem',color:'#7a5c10',display:'flex',alignItems:'center',gap:8}}>
              📌 Showing courses for <strong>{user.campus}</strong>
              {user.program && <> · Program: <strong>{user.program}</strong></>}
              — <button style={{background:'none',border:'none',color:'var(--navy)',cursor:'pointer',fontWeight:600,fontSize:'.82rem',padding:0}} onClick={()=>setShowMyOnly(false)}>See all courses</button>
            </div>
          )}

          {filteredCatalog.length === 0 ? (
            <div className="empty-state card">
              <FiBook size={36}/>
              <h3>No courses found</h3>
              <p>Try adjusting filters or {showMyOnly && <button className="btn btn-outline btn-sm" onClick={()=>setShowMyOnly(false)}>show all campuses</button>}</p>
            </div>
          ) : (
            <div className="courses-grid">
              {filteredCatalog.map((c, i) => {
                const enrolled_ = isEnrolled(c._id);
                // const enr = getEnrollment(c._id); // unused
                return (
                  <div key={i} className="course-card card">
                    <div className="cc-thumb">
                      {c.thumbnail
                        ? <img src={c.thumbnail} alt={c.title}/>
                        : <div className="cc-thumb-placeholder"><FiBook size={28}/></div>
                      }
                      {enrolled_ && <span className="badge badge-green" style={{position:'absolute',top:10,right:10,fontSize:'.65rem'}}><FiCheckCircle size={10}/> Enrolled</span>}
                    </div>
                    <div className="cc-body">
                      <div style={{display:'flex',gap:6,marginBottom:6,flexWrap:'wrap'}}>
                        <span className="badge badge-navy" style={{fontSize:'.65rem'}}>{c.category}</span>
                        <span className={`badge level-${(c.level||'beginner').toLowerCase()}`} style={{fontSize:'.65rem'}}>{c.level}</span>
                        {c.isFree && <span className="badge badge-green" style={{fontSize:'.65rem'}}>Free</span>}
                      </div>
                      <h3 style={{fontSize:'1rem',color:'var(--navy)',marginBottom:4,lineHeight:1.3}}>{c.title}</h3>
                      {c.teacher && <p style={{fontSize:'.75rem',color:'var(--gray-500)',marginBottom:8}}>{c.teacher.firstName} {c.teacher.lastName}</p>}
                      <div style={{display:'flex',gap:12,fontSize:'.72rem',color:'var(--gray-500)',marginBottom:12}}>
                        <span><FiUsers size={11}/> {c.enrollmentCount||0}</span>
                        <span><FiBook size={11}/> {c.lessons?.length||0} lessons</span>
                        {c.duration>0 && <span><FiClock size={11}/> {c.duration}h</span>}
                      </div>
                      {enrolled_ ? (
                        <Link to={`/student/courses/${c._id}`} className="btn btn-outline-gold btn-sm btn-full" style={{justifyContent:'center'}}>
                          <FiPlay size={12}/> Continue
                        </Link>
                      ) : (
                        <button className="btn btn-gold btn-sm btn-full" style={{justifyContent:'center'}}
                          disabled={enrolling === c._id} onClick={() => handleEnroll(c._id)}>
                          {enrolling===c._id ? 'Enrolling…' : 'Enroll Free'}
                          <FiArrowRight size={12}/>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
