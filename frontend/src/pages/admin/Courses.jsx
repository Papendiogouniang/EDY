import React, { useState, useEffect } from 'react';
import { getCourses, deleteCourse, updateCourse } from '../../utils/api';
import { FiBook, FiSearch, FiTrash2, FiToggleLeft, FiToggleRight, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourses({ search }).then(r => setCourses(r.data.courses)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()));

  const togglePublish = async (c) => {
    try {
      await updateCourse(c._id, { isPublished: !c.isPublished });
      setCourses(prev => prev.map(x => x._id === c._id ? {...x, isPublished: !x.isPublished} : x));
      toast.success(c.isPublished ? 'Course unpublished' : 'Course published!');
    } catch { toast.error('Failed'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this course permanently?')) return;
    try { await deleteCourse(id); setCourses(prev => prev.filter(c => c._id !== id)); toast.success('Course deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:22}} className="fade-up">
      <div><h1 className="section-title">Course Management</h1><p className="section-sub">{filtered.length} courses</p></div>

      <div className="card" style={{padding:16,display:'flex',gap:12,alignItems:'center'}}>
        <div style={{position:'relative',flex:1,maxWidth:380}}>
          <FiSearch style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--gray-400)'}}/>
          <input type="text" className="form-input" placeholder="Search courses…" value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:36}}/>
        </div>
      </div>

      <div className="card" style={{overflow:'hidden'}}>
        {loading ? <div className="spinner"/> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Course</th><th>Teacher</th><th>Category</th><th>Level</th><th>Students</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((c,i) => (
                  <tr key={i}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:36,height:36,borderRadius:8,background:'linear-gradient(135deg,var(--navy),var(--navy-mid))',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><FiBook size={15} color="rgba(255,255,255,.5)"/></div>
                        <p style={{fontWeight:600,fontSize:'.875rem',color:'var(--navy)'}}>{c.title}</p>
                      </div>
                    </td>
                    <td style={{fontSize:'.82rem'}}>{c.teacher?.firstName} {c.teacher?.lastName}</td>
                    <td><span className="badge badge-navy">{c.category}</span></td>
                    <td><span className={`badge level-${(c.level||'').toLowerCase()}`}>{c.level}</span></td>
                    <td><div style={{display:'flex',alignItems:'center',gap:4,fontSize:'.82rem'}}><FiUsers size={13} color="var(--gray-400)"/> {c.enrollmentCount||0}</div></td>
                    <td><span className={`badge ${c.isPublished?'badge-green':'badge-orange'}`}>{c.isPublished?'Published':'Draft'}</span></td>
                    <td>
                      <div style={{display:'flex',gap:6}}>
                        <button className="btn btn-ghost btn-sm" onClick={() => togglePublish(c)} title={c.isPublished?'Unpublish':'Publish'}>
                          {c.isPublished ? <FiToggleRight size={16} color="var(--green)"/> : <FiToggleLeft size={16} color="var(--orange)"/>}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(c._id)}><FiTrash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length===0 && <tr><td colSpan={7} style={{textAlign:'center',color:'var(--gray-400)',padding:40}}>No courses found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
