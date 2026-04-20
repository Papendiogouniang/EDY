import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyCourses, createCourse, updateCourse } from '../../utils/api';
import toast from 'react-hot-toast';
import './Teacher.css';

const CATEGORIES = ['Business','Computer Science','Political Science','Biology','English Language','Management','Engineering','Mathematics','Economics','Law'];
const CAMPUSES   = ['All','Dakar','Abidjan','Douala','Banjul'];
const LEVELS     = ['Beginner','Intermediate','Advanced'];

export default function MyCourses() {
  const [courses,     setCourses]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [filter,      setFilter]      = useState('all');

  useEffect(() => {
    getMyCourses()
      .then(r => setCourses(r.data.courses || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const togglePublish = async (course) => {
    try {
      const r = await updateCourse(course._id, { isPublished: !course.isPublished });
      setCourses(prev => prev.map(c => c._id === course._id ? { ...c, isPublished: r.data.course.isPublished } : c));
      toast.success(course.isPublished ? 'Course unpublished' : 'Course published! 🚀');
    } catch { toast.error('Failed'); }
  };

  const filtered = courses.filter(c => {
    if (filter === 'published') return c.isPublished;
    if (filter === 'draft')     return !c.isPublished;
    return true;
  });

  if (loading) return <div className="spinner" />;

  const published = courses.filter(c => c.isPublished).length;
  const drafts    = courses.filter(c => !c.isPublished).length;

  return (
    <div className="teacher-page fade-up">

      {/* Header */}
      <div className="t-page-header">
        <div>
          <h1 className="section-title">My Courses</h1>
          <p className="section-sub">
            {courses.length} total · <span style={{color:'#10b981',fontWeight:600}}>{published} published</span>
            {drafts > 0 && <> · <span style={{color:'#f97316',fontWeight:600}}>{drafts} draft</span></>}
          </p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-outline" onClick={() => setShowCreate(true)}>
            <i className="fa-solid fa-plus"/> Quick Create
          </button>
          <Link to="/teacher/courses/new" className="btn btn-gold">
            <i className="fa-solid fa-pen-to-square"/> Full Editor
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      {courses.length > 0 && (
        <div style={{display:'flex',gap:4,background:'white',border:'1px solid var(--gray-200)',borderRadius:'var(--radius-md)',padding:5,width:'fit-content'}}>
          {[
            {id:'all',      label:`All (${courses.length})`},
            {id:'published',label:`Published (${published})`},
            {id:'draft',    label:`Drafts (${drafts})`},
          ].map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)}
              style={{padding:'8px 16px',border:'none',borderRadius:9,background:filter===t.id?'var(--navy)':'transparent',color:filter===t.id?'white':'var(--gray-600)',fontFamily:'var(--font-body)',fontWeight:600,fontSize:'.82rem',cursor:'pointer',transition:'all .2s',whiteSpace:'nowrap'}}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {courses.length === 0 ? (
        <div className="empty-state card">
          <i className="fa-solid fa-book-open" style={{fontSize:42,color:'var(--gray-300)'}}/>
          <h3>No courses yet</h3>
          <p>Create your first course to start teaching</p>
          <button className="btn btn-navy" onClick={() => setShowCreate(true)}>Create Course</button>
        </div>
      ) : (
        <div className="courses-grid-teacher">
          {filtered.map(c => (
            <CourseCard key={c._id} course={c} onTogglePublish={togglePublish} />
          ))}
        </div>
      )}

      {/* Quick create modal */}
      {showCreate && (
        <CreateCourseModal
          onClose={() => setShowCreate(false)}
          onCreate={nc => { setCourses(prev => [nc, ...prev]); setShowCreate(false); }}
        />
      )}
    </div>
  );
}

/* ── Course Card ──────────────────────────────────────────────────────── */
function CourseCard({ course: c, onTogglePublish }) {
  return (
    <div className="t-course-card card">
      {/* Thumbnail */}
      <div className="t-cc-thumb">
        {c.thumbnail
          ? <img src={c.thumbnail} alt={c.title} loading="lazy"/>
          : (
            <div className="t-cc-placeholder">
              <i className="fa-solid fa-book-open" style={{fontSize:32,color:'rgba(255,255,255,.3)'}}/>
            </div>
          )
        }
        {/* Status pill */}
        <div className={`t-cc-status ${c.isPublished ? 'published' : 'draft'}`}>
          <i className={`fa-solid ${c.isPublished ? 'fa-circle-check' : 'fa-circle-dot'}`}/>
          {c.isPublished ? 'Published' : 'Draft'}
        </div>
      </div>

      {/* Body */}
      <div className="t-cc-body">
        <div className="t-cc-badges">
          <span className="t-cc-badge t-cc-badge--cat">{c.category}</span>
          <span className="t-cc-badge t-cc-badge--lvl">{c.level}</span>
          {c.campus && c.campus !== 'All' && <span className="t-cc-badge t-cc-badge--campus"><i className="fa-solid fa-location-dot"/>{c.campus}</span>}
        </div>

        <h3 className="t-cc-title">{c.title}</h3>
        {c.shortDesc && <p className="t-cc-desc">{c.shortDesc}</p>}

        <div className="t-cc-stats">
          <span><i className="fa-solid fa-users"/> {c.enrollmentCount || 0} student{c.enrollmentCount !== 1 ? 's' : ''}</span>
          <span><i className="fa-solid fa-book-open"/> {c.lessons?.length || 0} lesson{c.lessons?.length !== 1 ? 's' : ''}</span>
          {c.duration > 0 && <span><i className="fa-regular fa-clock"/> {c.duration}h</span>}
        </div>

        {/* Actions */}
        <div className="t-cc-actions">
          <Link to={`/teacher/courses/${c._id}`} className="t-cc-btn t-cc-btn--view">
            <i className="fa-solid fa-chalkboard-user"/> Class
          </Link>
          <Link to={`/teacher/courses/${c._id}/edit`} className="t-cc-btn t-cc-btn--edit">
            <i className="fa-solid fa-pen"/> Edit
          </Link>
          <button
            onClick={() => onTogglePublish(c)}
            className={`t-cc-btn ${c.isPublished ? 't-cc-btn--unpublish' : 't-cc-btn--publish'}`}
          >
            <i className={`fa-solid ${c.isPublished ? 'fa-eye-slash' : 'fa-rocket'}`}/>
            {c.isPublished ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Quick Create Modal ───────────────────────────────────────────────── */
function CreateCourseModal({ onClose, onCreate }) {
  const [form, setForm]     = useState({ title:'', description:'', category:'Business', level:'Beginner', campus:'All', language:'English', isFree:true, thumbnail:'' });
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      const r = await createCourse({ ...form, isPublished: false });
      toast.success('Course created! Now add lessons in the editor.');
      onCreate(r.data.course);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Creation failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><i className="fa-solid fa-plus" style={{color:'var(--gold)',marginRight:8}}/> Quick Create Course</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleCreate}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Course Title *</label>
              <input type="text" className="form-input" required autoFocus placeholder="e.g. Introduction to Business Management" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={3} style={{resize:'vertical'}} placeholder="Course overview..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Level</label>
                <select className="form-input" value={form.level} onChange={e => setForm({...form, level: e.target.value})}>
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Campus</label>
                <select className="form-input" value={form.campus} onChange={e => setForm({...form, campus: e.target.value})}>
                  {CAMPUSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Thumbnail URL (optional)</label>
              <input type="url" className="form-input" placeholder="https://..." value={form.thumbnail} onChange={e => setForm({...form, thumbnail: e.target.value})} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-gold" disabled={saving}>
              <i className="fa-solid fa-plus"/> {saving ? 'Creating…' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
