import React, { useState, useEffect } from 'react';
import DunisLogo from '../../components/DunisLogo/DunisLogo';
import { Link } from 'react-router-dom';
import { getTeacherDashboard } from '../../utils/api';
import { FiBook, FiUsers, FiClipboard, FiVideo, FiArrowRight, FiPlus, FiCheckCircle, FiClock, FiExternalLink } from 'react-icons/fi';
import { format } from 'date-fns';
import './TeacherDashboard.css';

export default function TeacherDashboard() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeacherDashboard().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;
  const { stats = {}, courses = [], upcomingMeets = [], recentSubmissions = [] } = data || {};

  return (
    <div className="teacher-dash fade-up">
      {/* Header */}
      <div className="teacher-banner">
        <div className="t-banner-logo"><DunisLogo size="md" variant="white" /></div>
        <div>
          <span className="t-role-pill">👨‍🏫 Instructor</span>
          <h1>My Teaching Hub</h1>
          <p>Manage your courses, students, and live sessions from one place.</p>
        </div>
        <Link to="/teacher/courses/new" className="btn btn-gold">
          <FiPlus /> Create new course
        </Link>
      </div>

      {/* Stats */}
      <div className="t-stats">
        {[
          { icon: FiBook,      color: '#3b82f6', label: 'My Courses',   val: stats.totalCourses || 0 },
          { icon: FiUsers,     color: '#10b981', label: 'Total Students',val: stats.totalStudents || 0 },
          { icon: FiClipboard, color: '#f97316', label: 'Pending Grades',val: stats.pendingGrades || 0 },
          { icon: FiVideo,     color: '#8b5cf6', label: 'Enrollments',  val: stats.totalEnrollments || 0 },
        ].map((s, i) => (
          <div key={i} className="t-stat card" style={{ '--c': s.color }}>
            <div className="t-stat-icon" style={{ background:`${s.color}18`, color:s.color }}><s.icon size={20} /></div>
            <div><p className="t-stat-val">{s.val}</p><p className="t-stat-lbl">{s.label}</p></div>
            {s.label === 'Pending Grades' && s.val > 0 && <span className="urgent-dot" />}
          </div>
        ))}
      </div>

      <div className="t-grid">
        {/* My classes */}
        <div>
          <div className="t-section-header">
            <h2>My Classes</h2>
            <Link to="/teacher/courses" className="see-all">All classes <FiArrowRight size={13} /></Link>
          </div>
          {courses.length === 0 ? (
            <div className="empty-state card"><FiBook size={36} /><h3>No courses yet</h3><Link to="/teacher/courses" className="btn btn-navy btn-sm">Create your first course</Link></div>
          ) : (
            <div className="t-courses-list">
              {courses.slice(0,5).map(c => (
                <Link key={c._id} to={`/teacher/courses/${c._id}`} className="t-course-row card card-interactive">
                  <div className="t-course-icon"><FiBook size={18} /></div>
                  <div className="t-course-info">
                    <h3>{c.title}</h3>
                    <span className="t-course-meta">{c.enrolled} students · {c.completed} completed</span>
                  </div>
                  <div className="t-course-right">
                    <span className={`badge ${c.isPublished ? 'badge-green' : 'badge-orange'}`}>{c.isPublished ? 'Published' : 'Draft'}</span>
                    <FiArrowRight size={15} color="var(--gray-400)" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right */}
        <div>
          {/* Upcoming meets */}
          <div className="t-section-header"><h2>Upcoming Live Sessions</h2></div>
          {upcomingMeets.length === 0 ? (
            <div className="empty-state card" style={{padding:'24px'}}><FiVideo size={30} /><p>No sessions scheduled</p></div>
          ) : (
            <div className="t-meets-list">
              {upcomingMeets.map((m, i) => (
                <div key={i} className="t-meet-card card">
                  <div className="t-meet-top">
                    <span className="t-meet-title">{m.title}</span>
                    <a href={m.meetUrl || '#'} target="_blank" rel="noreferrer" className="btn btn-gold btn-sm">
                      Start <FiExternalLink size={11} />
                    </a>
                  </div>
                  <p className="t-meet-course">{m.courseTitle}</p>
                  <p className="t-meet-time"><FiClock size={11} /> {format(new Date(m.scheduledAt), 'EEE, MMM dd · HH:mm')}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recent submissions */}
          {recentSubmissions.length > 0 && (
            <>
              <div className="t-section-header" style={{marginTop:20}}><h2>Submissions to Grade</h2></div>
              <div className="t-submissions-list">
                {recentSubmissions.slice(0,5).map((s,i) => (
                  <div key={i} className="t-submission-row card">
                    <div className="t-sub-avatar">{s.student?.firstName?.[0]}{s.student?.lastName?.[0]}</div>
                    <div className="t-sub-info">
                      <p className="t-sub-name">{s.student?.firstName} {s.student?.lastName}</p>
                      <p className="t-sub-course">{s.course?.title}</p>
                    </div>
                    <div className="t-sub-right">
                      <span className={`badge ${s.status === 'graded' ? 'badge-green' : 'badge-orange'}`}>{s.status}</span>
                      <p className="t-sub-time">{format(new Date(s.submittedAt), 'MMM dd')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
