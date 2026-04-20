import React, { useState, useEffect } from 'react';
import DunisLogo from '../../components/DunisLogo/DunisLogo';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStudentDashboard } from '../../utils/api';
import { FiBook, FiAward, FiTrendingUp, FiCheckCircle, FiClock, FiArrowRight, FiVideo, FiExternalLink, FiStar } from 'react-icons/fi';
import { format } from 'date-fns';
import './StudentDashboard.css';

const LEVEL_THRESHOLDS = { Beginner: 500, Intermediate: 2000, Advanced: 5000, Expert: Infinity };
const LEVEL_COLORS = { Beginner: 'green', Intermediate: 'blue', Advanced: 'orange', Expert: 'gold' };
const LEVEL_NEXT   = { Beginner: 'Intermediate', Intermediate: 'Advanced', Advanced: 'Expert', Expert: 'Expert' };

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentDashboard()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  const { stats = {}, courseProgress = [], upcomingMeets = [], recentAttempts = [] } = data || {};
  const level = user?.level || 'Beginner';
  const levelPct = user?.levelProgress || 0;
  const nextLevel = LEVEL_NEXT[level];
  const pointsToNext = LEVEL_THRESHOLDS[level] - (user?.totalPoints || 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="student-dashboard fade-up">
      {/* Welcome banner */}
      <div className="welcome-card">
        <div className="welcome-card-logo">
          <DunisLogo size="md" variant="white" />
        </div>
        <div className="welcome-left">
          <p className="welcome-greeting">{greeting} 👋</p>
          <h1>{user?.firstName} {user?.lastName}</h1>
          <p className="welcome-sub">Student ID: <strong>{user?.studentId || 'N/A'}</strong> · Campus: <strong>{user?.campus}</strong></p>
          <Link to="/student/courses" className="btn btn-gold">Browse courses <FiArrowRight /></Link>
        </div>
        <div className="welcome-level-card">
          <div className={`level-icon-big level-${level.toLowerCase()}`}>{levelEmoji(level)}</div>
          <div className="level-info">
            <p className="level-current-label">Current Level</p>
            <h2 className="level-name">{level}</h2>
            <div className="level-progress-wrap">
              <div className={`progress-track thick ${LEVEL_COLORS[level]}`}>
                <div className="progress-bar" style={{ width: `${levelPct}%` }} />
              </div>
              <div className="level-progress-labels">
                <span>{user?.totalPoints || 0} pts</span>
                <span>{level !== 'Expert' ? `${Math.max(0, pointsToNext)} to ${nextLevel}` : '🏆 Max level!'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid">
        {[
          { icon: FiBook,        color: '#3b82f6', label: 'Enrolled',    val: stats.totalEnrolled || 0 },
          { icon: FiCheckCircle, color: '#10b981', label: 'Completed',   val: stats.completedCourses || 0 },
          { icon: FiTrendingUp,  color: '#c8a84b', label: 'Avg. Score',  val: `${stats.avgQuizScore || 0}%` },
          { icon: FiAward,       color: '#8b5cf6', label: 'Certificates',val: stats.certificates || 0 },
          { icon: FiStar,        color: '#f97316', label: 'Points',      val: user?.totalPoints || 0 },
        ].map((s, i) => (
          <div key={i} className="stat-card card" style={{ '--c': s.color }}>
            <div className="stat-icon" style={{ background:`${s.color}18`, color:s.color }}><s.icon size={20} /></div>
            <div><p className="stat-val">{s.val}</p><p className="stat-label">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        {/* My courses */}
        <div className="dash-section">
          <div className="dash-section-header">
            <h2>My Courses</h2>
            <Link to="/student/courses" className="see-all">See all <FiArrowRight size={13} /></Link>
          </div>
          {courseProgress.length === 0 ? (
            <div className="empty-state card"><FiBook size={40} /><h3>No courses yet</h3><p>Enroll in a course to get started</p><Link to="/student/courses" className="btn btn-navy btn-sm">Browse courses</Link></div>
          ) : (
            <div className="courses-list">
              {courseProgress.map((cp, i) => cp && (
                <div key={i} className="cp-card card card-interactive">
                  <div className="cp-thumb-wrap">
                    {cp.course?.thumbnail ? <img src={cp.course.thumbnail} alt={cp.course.title} /> : <div className="cp-thumb-placeholder"><FiBook size={22} /></div>}
                    <span className={`badge badge-${levelBadge(cp.course?.level)}`}>{cp.course?.level}</span>
                  </div>
                  <div className="cp-body">
                    <span className="badge badge-navy" style={{ fontSize:'.68rem' }}>{cp.course?.category}</span>
                    <h3>{cp.course?.title}</h3>
                    <p className="cp-teacher">by {cp.course?.teacher?.firstName} {cp.course?.teacher?.lastName}</p>
                    <div className="cp-progress-row">
                      <div className="progress-track thin" style={{ flex:1 }}>
                        <div className="progress-bar" style={{ width:`${cp.completionPercentage}%` }} />
                      </div>
                      <span className="cp-pct">{cp.completionPercentage}%</span>
                    </div>
                    <div className="cp-footer">
                      <span className="cp-lessons"><FiClock size={11} /> {cp.completedLessons}/{cp.totalLessons} lessons</span>
                      <Link to={`/student/courses/${cp.course?._id}`} className="btn btn-outline-gold btn-sm">
                        {cp.completionPercentage > 0 ? 'Continue' : 'Start'} <FiArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="dash-right">
          {/* Upcoming meets */}
          <div className="dash-section">
            <div className="dash-section-header"><h2>Upcoming Live Classes</h2></div>
            {upcomingMeets.length === 0 ? (
              <div className="empty-state card" style={{ padding:'28px' }}><FiVideo size={32} /><p>No upcoming classes</p></div>
            ) : (
              <div className="meets-list">
                {upcomingMeets.map((m, i) => (
                  <div key={i} className="meet-card card">
                    <div className="meet-platform-icon">{platformIcon(m.platform)}</div>
                    <div className="meet-info">
                      <p className="meet-title">{m.title}</p>
                      <p className="meet-course">{m.courseTitle}</p>
                      <p className="meet-time"><FiClock size={11} /> {format(new Date(m.scheduledAt), 'MMM dd, yyyy · HH:mm')}</p>
                    </div>
                    <a href={m.meetUrl || '#'} target="_blank" rel="noreferrer" className="btn btn-gold btn-sm">
                      Join <FiExternalLink size={12} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent quiz scores */}
          {recentAttempts.length > 0 && (
            <div className="dash-section">
              <div className="dash-section-header"><h2>Recent Quiz Results</h2></div>
              <div className="quiz-results-list">
                {recentAttempts.map((a, i) => (
                  <div key={i} className="quiz-result-row card">
                    <div className={`quiz-score-badge ${a.passed ? 'pass' : 'fail'}`}>
                      {a.score}%
                    </div>
                    <div>
                      <p className="quiz-result-label">{a.passed ? '✅ Passed' : '❌ Failed'}</p>
                      <p className="quiz-result-date">{format(new Date(a.completedAt || a.createdAt), 'MMM dd')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificates teaser */}
          <Link to="/student/certificates" className="cert-teaser card">
            <span className="cert-icon">🏆</span>
            <div>
              <h3>Your Certificates</h3>
              <p>{stats.certificates || 0} certificate{(stats.certificates || 0) !== 1 ? 's' : ''} earned</p>
            </div>
            <FiArrowRight className="cert-arrow" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function levelEmoji(l) { return { Beginner:'🌱', Intermediate:'📈', Advanced:'🔥', Expert:'⭐' }[l] || '🎓'; }
function levelBadge(l) { return { Beginner:'green', Intermediate:'blue', Advanced:'orange', Expert:'gold' }[l] || 'navy'; }
function platformIcon(p) { return { google_meet:'📹', zoom:'💻', teams:'🟦', other:'🎥' }[p] || '📹'; }
