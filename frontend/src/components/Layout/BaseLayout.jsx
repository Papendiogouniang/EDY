import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, markNotificationsRead } from '../../utils/api';
import Chatbot from '../Chatbot/Chatbot';
import { FiBell, FiMenu, FiX, FiLogOut, FiMessageSquare } from 'react-icons/fi';
import DunisLogo from '../DunisLogo/DunisLogo';
import logoImg from '../../assets/dunis-logo.png';
import './Layout.css';

export default function BaseLayout({ navItems, role, accentColor }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [chatOpen, setChatOpen]       = useState(false);
  const [notifs, setNotifs]           = useState([]);
  const [unread, setUnread]           = useState(0);
  const [notifOpen, setNotifOpen]     = useState(false);

  useEffect(() => {
    getNotifications().then(r => {
      setNotifs(r.data.notifications);
      setUnread(r.data.unreadCount);
    }).catch(() => {});
  }, [location.pathname]);

  const handleNotifOpen = async () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen && unread > 0) {
      await markNotificationsRead().catch(() => {});
      setUnread(0);
    }
  };

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '??';

  const roleBadgeColor = {
    student: 'badge-green',
    teacher: 'badge-blue',
    admin:   'badge-orange',
  }[role] || 'badge-navy';

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-sm' : ''} role-${role}`}>
      {mobileOpen && <div className="mob-overlay" onClick={() => setMobileOpen(false)} />}

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className={`sidebar ${mobileOpen ? 'mob-open' : ''}`}>
        <div className="sidebar-brand">
          <Link to={`/${role}/dashboard`} className="brand-link">
            {collapsed ? (
              <div style={{width:40,height:40,borderRadius:8,background:'white',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',padding:3}}>
                <img src={logoImg} alt="DUNIS" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
              </div>
            ) : (
              <DunisLogo size="sm" variant="white" />
            )}
          </Link>
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <FiMenu size={16} /> : <FiX size={16} />}
          </button>
        </div>

        {!collapsed && (
          <div className="sidebar-role-badge">
            <span className={`badge ${roleBadgeColor}`}>{role.toUpperCase()}</span>
          </div>
        )}

        <nav className="sidebar-nav">
          {navItems.map((item, i) => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            return (
              <Link
                key={i} to={item.to}
                className={`nav-link ${active ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : ''}
              >
                <item.icon size={19} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.badge && <span className="nav-badge">{item.badge}</span>}
              </Link>
            );
          })}
          <button className={`nav-link ${chatOpen ? 'active' : ''}`} onClick={() => setChatOpen(!chatOpen)} title={collapsed ? 'AI Assistant' : ''}>
            <FiMessageSquare size={19} />
            {!collapsed && <span>AI Assistant</span>}
            {!collapsed && <span className="nav-badge ai">AI</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className={`sidebar-user ${collapsed ? 'compact' : ''}`}>
            <div className="s-avatar" style={{overflow:'hidden'}}>
              {user?.avatar
                ? <img src={user.avatar} alt={user.firstName} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : initials
              }
            </div>
            {!collapsed && (
              <div className="s-info">
                <p className="s-name">{user?.firstName} {user?.lastName}</p>
                <p className="s-email">{user?.email}</p>
              </div>
            )}
          </div>
          <button className="nav-link logout" onClick={() => { logout(); navigate('/'); }} title={collapsed ? 'Log out' : ''}>
            <FiLogOut size={18} />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <div className="app-main">
        <header className="app-topbar">
          <button className="mob-toggle" onClick={() => setMobileOpen(true)}>
            <FiMenu size={22} />
          </button>
          {/* Mobile logo - shows in topbar on small screens */}
          <div className="topbar-logo-mobile">
            <DunisLogo size="xs" variant="full" />
          </div>
          <div className="topbar-title">
            <PageTitle path={location.pathname} />
          </div>
          <div className="topbar-right">
            {/* Level badge for students */}
            {role === 'student' && user?.level && (
              <div className={`level-pill badge level-${user.level.toLowerCase()}`}>
                ⚡ {user.level} · {user.totalPoints || 0} pts
              </div>
            )}
            {/* Notifications */}
            <div className="notif-wrap">
              <button className="icon-btn" onClick={handleNotifOpen}>
                <FiBell size={20} />
                {unread > 0 && <span className="notif-dot">{unread}</span>}
              </button>
              {notifOpen && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <h4>Notifications</h4>
                    <span>{notifs.length} total</span>
                  </div>
                  <div className="notif-list">
                    {notifs.length === 0 ? (
                      <p className="notif-empty">No notifications yet</p>
                    ) : notifs.map((n, i) => (
                      <div key={i} className={`notif-item ${n.isRead ? 'read' : 'unread'}`} onClick={() => { setNotifOpen(false); if (n.link) navigate(n.link); }}>
                        <div className="notif-icon">{notifIcon(n.type)}</div>
                        <div>
                          <p className="notif-title">{n.title}</p>
                          <p className="notif-msg">{n.message}</p>
                          <p className="notif-time">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Avatar */}
            <Link to={`/${role}/profile`} className="topbar-avatar" title="My Profile">
            {user?.avatar
              ? <img src={user.avatar} alt={user.firstName} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/>
              : initials
            }
          </Link>
          </div>
        </header>

        <main className="app-content fade-up">
          <Outlet />
        </main>
      </div>

      {/* Chatbot */}
      {chatOpen && <Chatbot onClose={() => setChatOpen(false)} userRole={role} />}
    </div>
  );
}

function PageTitle({ path }) {
  const map = {
    '/student/dashboard':    'My Dashboard',
    '/student/courses':      'My Courses',
    '/student/certificates': 'My Certificates',
    '/student/assignments':  'Mes Devoirs',
    '/student/exams':        'Examens & Quiz',
    '/student/profile':      'My Profile',
    '/teacher/dashboard':    'Teacher Dashboard',
    '/teacher/courses':      'My Classes',
    '/teacher/profile':      'My Profile',
    '/admin/dashboard':      'Admin Dashboard',
    '/admin/users':          'User Management',
    '/admin/courses':        'Course Management',
    '/admin/media':          'Media Library',
    '/admin/classes':        'Class Management',
    '/admin/landing-editor': 'Landing Page Editor',
    '/admin/faq':            'FAQ & AI Chatbot',
  };
  const title = Object.entries(map).find(([k]) => path.startsWith(k))?.[1] || 'DUNIS E-Learning';
  return <h2>{title}</h2>;
}

function notifIcon(type) {
  const icons = { assignment_graded: '📝', new_meet: '📹', quiz_available: '🧪', certificate_issued: '🏆', enrollment: '🎓', message: '💬', course_update: '📚' };
  return icons[type] || '🔔';
}

function timeAgo(date) {
  const d = new Date(date), now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}
