import React, { useState, useEffect } from 'react';
import API, { getAdminClasses, getClassStudents, adminEnroll, adminUnenroll, assignTeacher } from '../../utils/api';
import { FiUsers, FiBook, FiPlus, FiTrash2, FiSearch, FiChevronDown, FiChevronUp, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminClasses() {
  const [classes,   setClasses]   = useState([]);
  const [teachers,  setTeachers]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState(null);
  const [classData, setClassData] = useState({});  // {courseId: {enrolled, notEnrolled}}
  const [loadingId, setLoadingId] = useState(null);
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    Promise.all([
      getAdminClasses(),
      API.get('/users/teachers/list'),
    ]).then(([cRes, tRes]) => {
      setClasses(cRes.data.classes || []);
      setTeachers(tRes.data.teachers || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const toggleExpand = async (courseId) => {
    if (expanded === courseId) { setExpanded(null); return; }
    setExpanded(courseId);
    if (!classData[courseId]) {
      setLoadingId(courseId);
      try {
        const res = await getClassStudents(courseId);
        setClassData(prev => ({ ...prev, [courseId]: res.data }));
      } catch { toast.error('Failed to load students'); }
      finally { setLoadingId(null); }
    }
  };

  const handleEnroll = async (courseId, studentId, studentName, courseTitle) => {
    try {
      await adminEnroll({ courseId, studentId });
      toast.success(`${studentName} enrolled in ${courseTitle} ✅`);
      // refresh this course's data
      const res = await getClassStudents(courseId);
      setClassData(prev => ({ ...prev, [courseId]: res.data }));
      setClasses(prev => prev.map(c => c._id === courseId ? { ...c, enrolledCount: (c.enrolledCount || 0) + 1 } : c));
    } catch (err) { toast.error(err.response?.data?.message || 'Enrollment failed'); }
  };

  const handleUnenroll = async (courseId, studentId, studentName) => {
    if (!window.confirm(`Remove ${studentName} from this course?`)) return;
    try {
      await adminUnenroll({ courseId, studentId });
      toast.success(`${studentName} removed`);
      const res = await getClassStudents(courseId);
      setClassData(prev => ({ ...prev, [courseId]: res.data }));
      setClasses(prev => prev.map(c => c._id === courseId ? { ...c, enrolledCount: Math.max(0,(c.enrolledCount||0)-1) } : c));
    } catch { toast.error('Failed'); }
  };

  const handleChangeTeacher = async (courseId, teacherId) => {
    try {
      await assignTeacher(courseId, teacherId);
      const teacher = teachers.find(t => t._id === teacherId);
      setClasses(prev => prev.map(c => c._id === courseId ? { ...c, teacher } : c));
      toast.success('Teacher updated ✅');
    } catch { toast.error('Failed to update teacher'); }
  };

  const filtered = classes.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.teacher?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    c.teacher?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-up" style={{ display:'flex', flexDirection:'column', gap:22 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="section-title">Class Management</h1>
          <p className="section-sub">{classes.length} courses · Assign students and teachers per class</p>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {[
          { icon: FiBook,  color:'#3b82f6', label:'Total Courses', val: classes.length },
          { icon: FiUsers, color:'#10b981', label:'Published',     val: classes.filter(c=>c.isPublished).length },
          { icon: FiUser,  color:'#c8a84b', label:'With Teacher',  val: classes.filter(c=>c.teacher).length },
        ].map((s,i) => (
          <div key={i} className="card" style={{ padding:18, display:'flex', alignItems:'center', gap:12, borderLeft:`3px solid ${s.color}` }}>
            <div style={{ width:40, height:40, borderRadius:10, background:`${s.color}18`, color:s.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><s.icon size={18}/></div>
            <div><p style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, color:'var(--navy)' }}>{s.val}</p><p style={{ fontSize:'.75rem', color:'var(--gray-600)', fontWeight:500 }}>{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position:'relative', maxWidth:400 }}>
        <FiSearch style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--gray-400)' }} size={16}/>
        <input type="text" className="form-input" style={{ paddingLeft:40 }} placeholder="Search by course, teacher, category…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Classes accordion */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.length === 0 && (
          <div className="empty-state card"><FiBook size={36}/><h3>No classes found</h3></div>
        )}
        {filtered.map(course => {
          const isOpen   = expanded === course._id;
          const data     = classData[course._id];
          const isLoading= loadingId === course._id;

          return (
            <div key={course._id} className="card" style={{ overflow:'hidden' }}>
              {/* Course row header */}
              <div
                onClick={() => toggleExpand(course._id)}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', cursor:'pointer', userSelect:'none', borderBottom: isOpen ? '1px solid var(--gray-200)' : 'none', transition:'background .15s' }}
                onMouseOver={e => e.currentTarget.style.background='rgba(11,30,61,.03)'}
                onMouseOut={e => e.currentTarget.style.background='transparent'}
              >
                {/* Thumbnail */}
                <div style={{ width:48, height:48, borderRadius:10, overflow:'hidden', flexShrink:0, background:'var(--gray-100)' }}>
                  {course.thumbnail
                    ? <img src={course.thumbnail} alt={course.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><FiBook size={20} color="var(--gray-400)"/></div>
                  }
                </div>

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                    <p style={{ fontWeight:700, fontSize:'.95rem', color:'var(--navy)' }}>{course.title}</p>
                    <span className={`badge ${course.isPublished ? 'badge-green' : 'badge-orange'}`} style={{ fontSize:'.65rem' }}>{course.isPublished ? 'Published' : 'Draft'}</span>
                  </div>
                  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                    <span style={{ fontSize:'.78rem', color:'var(--gray-500)' }}>{course.category} · {course.level}</span>
                    <span style={{ fontSize:'.78rem', color:'var(--gray-500)' }}><FiUsers size={11}/> {course.enrolledCount || 0} students</span>
                    <span style={{ fontSize:'.78rem', color:'var(--gray-500)' }}>
                      👨‍🏫 {course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : <span style={{ color:'#ef4444' }}>No teacher</span>}
                    </span>
                  </div>
                </div>

                {/* Expand icon */}
                <div style={{ color:'var(--gray-400)', flexShrink:0 }}>
                  {isOpen ? <FiChevronUp size={18}/> : <FiChevronDown size={18}/>}
                </div>
              </div>

              {/* Expanded panel */}
              {isOpen && (
                <div style={{ padding:'20px 18px', display:'flex', flexDirection:'column', gap:20 }}>

                  {/* Change Teacher */}
                  <div>
                    <p style={{ fontSize:'.82rem', fontWeight:700, color:'var(--navy)', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                      <FiUser size={14}/> Assign Teacher
                    </p>
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                      <select
                        className="form-input"
                        style={{ maxWidth:320, fontSize:'.875rem' }}
                        value={course.teacher?._id || ''}
                        onChange={e => handleChangeTeacher(course._id, e.target.value)}
                      >
                        <option value="">— No teacher assigned —</option>
                        {teachers.map(t => (
                          <option key={t._id} value={t._id}>{t.firstName} {t.lastName} · {t.specialization || t.email}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Students */}
                  {isLoading ? (
                    <div style={{ textAlign:'center', padding:'20px 0', color:'var(--gray-400)' }}>Loading students…</div>
                  ) : data && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>

                      {/* Enrolled students */}
                      <div>
                        <p style={{ fontSize:'.82rem', fontWeight:700, color:'var(--navy)', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                          <FiUsers size={14}/> Enrolled ({data.enrolled?.length || 0})
                        </p>
                        <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:240, overflowY:'auto' }}>
                          {data.enrolled?.length === 0 && <p style={{ fontSize:'.82rem', color:'var(--gray-400)', fontStyle:'italic', padding:'8px 0' }}>No students enrolled</p>}
                          {data.enrolled?.map((enr, i) => {
                            const s = enr.student;
                            if (!s) return null;
                            return (
                              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'var(--gray-100)', borderRadius:8 }}>
                                <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--gold)', color:'var(--navy)', fontSize:'.7rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                  {s.firstName?.[0]}{s.lastName?.[0]}
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <p style={{ fontSize:'.82rem', fontWeight:600, color:'var(--navy)' }}>{s.firstName} {s.lastName}</p>
                                  <p style={{ fontSize:'.7rem', color:'var(--gray-400)' }}>{s.studentId} · {s.campus}</p>
                                </div>
                                <button
                                  className="btn btn-danger btn-sm"
                                  style={{ padding:'4px 8px', fontSize:'.7rem' }}
                                  onClick={() => handleUnenroll(course._id, s._id, `${s.firstName} ${s.lastName}`)}
                                  title="Remove from course"
                                >
                                  <FiTrash2 size={11}/>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Available students */}
                      <div>
                        <p style={{ fontSize:'.82rem', fontWeight:700, color:'var(--navy)', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                          <FiPlus size={14}/> Add Student ({data.notEnrolled?.length || 0} available)
                        </p>
                        <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:240, overflowY:'auto' }}>
                          {data.notEnrolled?.length === 0 && <p style={{ fontSize:'.82rem', color:'var(--gray-400)', fontStyle:'italic', padding:'8px 0' }}>All students are enrolled</p>}
                          {data.notEnrolled?.map((s, i) => (
                            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'rgba(16,185,129,.05)', border:'1px solid rgba(16,185,129,.15)', borderRadius:8 }}>
                              <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(16,185,129,.2)', color:'#047857', fontSize:'.7rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                {s.firstName?.[0]}{s.lastName?.[0]}
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <p style={{ fontSize:'.82rem', fontWeight:600, color:'var(--navy)' }}>{s.firstName} {s.lastName}</p>
                                <p style={{ fontSize:'.7rem', color:'var(--gray-400)' }}>{s.studentId} · {s.campus}</p>
                              </div>
                              <button
                                className="btn btn-gold btn-sm"
                                style={{ padding:'4px 10px', fontSize:'.7rem', flexShrink:0 }}
                                onClick={() => handleEnroll(course._id, s._id, `${s.firstName} ${s.lastName}`, course.title)}
                              >
                                <FiPlus size={11}/> Enroll
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
