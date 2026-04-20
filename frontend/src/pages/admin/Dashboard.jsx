import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboard } from '../../utils/api';
import DunisLogo from '../../components/DunisLogo/DunisLogo';
import {
  FiUsers, FiBook, FiAward, FiTrendingUp, FiCheckCircle,
  FiMessageSquare, FiImage, FiEdit3, FiGrid, FiArrowRight,
  FiUserPlus, FiGlobe
} from 'react-icons/fi';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboard()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  const { stats = {}, recentUsers = [], popularCourses = [] } = data || {};

  const STAT_CARDS = [
    { icon: FiUsers,       color: '#3b82f6', label: 'Students',         val: stats.students     || 0, to: '/admin/users?role=student' },
    { icon: FiBook,        color: '#10b981', label: 'Teachers',         val: stats.teachers     || 0, to: '/admin/users?role=teacher' },
    { icon: FiGrid,        color: '#c8a84b', label: 'Active Courses',   val: stats.courses      || 0, to: '/admin/courses' },
    { icon: FiTrendingUp,  color: '#8b5cf6', label: 'Enrollments',      val: stats.enrollments  || 0, to: '/admin/classes' },
    { icon: FiAward,       color: '#f97316', label: 'Certificates',     val: stats.certificates || 0, to: '/admin/users' },
    { icon: FiCheckCircle, color: '#06b6d4', label: 'Completion Rate',  val: stats.courses > 0 ? `${Math.round((stats.certificates / Math.max(stats.enrollments,1)) * 100)}%` : '0%', to: '/admin/classes' },
  ];

  const QUICK_ACTIONS = [
    { icon: FiUserPlus,   label: 'Add User',         sub: 'Create student or teacher',  to: '/admin/users',          color: '#3b82f6' },
    { icon: FiGrid,       label: 'Manage Classes',   sub: 'Enroll students, assign profs', to: '/admin/classes',      color: '#10b981' },
    { icon: FiEdit3,      label: 'Edit Landing Page', sub: 'Change logo, images, text', to: '/admin/landing-editor', color: '#c8a84b' },
    { icon: FiImage,      label: 'Media Library',    sub: 'Upload photos and PDFs',     to: '/admin/media',          color: '#8b5cf6' },
    { icon: FiMessageSquare, label: 'FAQ Chatbot',   sub: 'Configure AI assistant',     to: '/admin/faq',            color: '#f97316' },
    { icon: FiGlobe,      label: 'All Courses',      sub: 'Publish or manage courses',  to: '/admin/courses',        color: '#06b6d4' },
  ];

  const roleBadge = r => ({ student:'badge-blue', teacher:'badge-green', admin:'badge-orange' }[r] || 'badge-navy');

  return (
    <div className="fade-up" style={{ display:'flex', flexDirection:'column', gap:26 }}>

      {/* Hero banner */}
      <div style={{ background:'linear-gradient(135deg,#0b1e3d 0%,#1a1040 100%)', borderRadius:'var(--radius-xl)', padding:'28px 32px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(200,168,75,.06) 1px, transparent 1px)', backgroundSize:'32px 32px', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:20, right:28, opacity:.18 }}><DunisLogo size="lg" variant="white"/></div>
        <div style={{ position:'relative', zIndex:1 }}>
          <span style={{ fontSize:'.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.14em', color:'var(--gold)', display:'block', marginBottom:8 }}>🛡️ Administration</span>
          <h1 style={{ color:'white', fontSize:'1.75rem', marginBottom:6 }}>DUNIS Africa Platform</h1>
          <p style={{ color:'rgba(255,255,255,.6)', fontSize:'.9rem' }}>Manage users, courses, classes and platform settings from one place.</p>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {STAT_CARDS.map((s, i) => (
          <Link key={i} to={s.to} style={{ textDecoration:'none' }}>
            <div className="card" style={{ padding:20, display:'flex', alignItems:'center', gap:14, borderLeft:`3px solid ${s.color}`, transition:'var(--transition)', cursor:'pointer' }}
              onMouseOver={e => e.currentTarget.style.boxShadow='var(--shadow-md)'}
              onMouseOut={e => e.currentTarget.style.boxShadow='var(--shadow-sm)'}>
              <div style={{ width:46, height:46, borderRadius:12, background:`${s.color}18`, color:s.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <s.icon size={20}/>
              </div>
              <div>
                <p style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:700, color:'var(--navy)', lineHeight:1 }}>{s.val}</p>
                <p style={{ fontSize:'.78rem', color:'var(--gray-600)', fontWeight:500, marginTop:3 }}>{s.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 style={{ fontSize:'.95rem', color:'var(--navy)', marginBottom:14, fontWeight:700 }}>Quick Actions</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {QUICK_ACTIONS.map((a, i) => (
            <Link key={i} to={a.to} style={{ textDecoration:'none' }}>
              <div className="card" style={{ padding:'16px 18px', display:'flex', alignItems:'center', gap:12, transition:'var(--transition)' }}
                onMouseOver={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-md)'; }}
                onMouseOut={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='var(--shadow-sm)'; }}>
                <div style={{ width:38, height:38, borderRadius:10, background:`${a.color}18`, color:a.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <a.icon size={18}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:700, fontSize:'.875rem', color:'var(--navy)' }}>{a.label}</p>
                  <p style={{ fontSize:'.72rem', color:'var(--gray-500)' }}>{a.sub}</p>
                </div>
                <FiArrowRight size={14} color="var(--gray-400)"/>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom grid: recent users + popular courses */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:22 }}>

        {/* Recent Users */}
        <div className="card" style={{ overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--gray-200)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <h3 style={{ fontSize:'.9rem', color:'var(--navy)', fontWeight:700 }}>Recent Users</h3>
            <Link to="/admin/users" style={{ fontSize:'.78rem', color:'var(--navy)', fontWeight:600, textDecoration:'none' }}>See all →</Link>
          </div>
          {recentUsers.slice(0, 8).map((u, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 20px', borderBottom:'1px solid var(--gray-200)' }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,var(--gold),var(--gold-light))', color:'var(--navy)', fontWeight:700, fontSize:'.78rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {u.firstName?.[0]}{u.lastName?.[0]}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:'.875rem', fontWeight:600, color:'var(--navy)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {u.firstName} {u.lastName}
                </p>
                <p style={{ fontSize:'.72rem', color:'var(--gray-400)' }}>{u.campus}</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
                <span className={`badge ${roleBadge(u.role)}`} style={{ fontSize:'.62rem' }}>{u.role}</span>
                <span style={{ fontSize:'.68rem', color:'var(--gray-400)' }}>{format(new Date(u.createdAt), 'dd MMM')}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Popular Courses */}
        <div className="card" style={{ overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--gray-200)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <h3 style={{ fontSize:'.9rem', color:'var(--navy)', fontWeight:700 }}>Popular Courses</h3>
            <Link to="/admin/courses" style={{ fontSize:'.78rem', color:'var(--navy)', fontWeight:600, textDecoration:'none' }}>See all →</Link>
          </div>
          {popularCourses.length === 0 && (
            <p style={{ padding:'24px 20px', fontSize:'.85rem', color:'var(--gray-400)', fontStyle:'italic' }}>No published courses yet</p>
          )}
          {popularCourses.map((c, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderBottom:'1px solid var(--gray-200)' }}>
              <div style={{ width:36, height:36, borderRadius:8, background:'var(--gold-pale)', color:'var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1rem', flexShrink:0 }}>
                {i+1}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:'.875rem', fontWeight:600, color:'var(--navy)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</p>
                <p style={{ fontSize:'.72rem', color:'var(--gray-400)' }}>
                  {c.teacher?.firstName} {c.teacher?.lastName} · {c.category}
                </p>
              </div>
              <span style={{ background:'var(--navy)', color:'white', fontSize:'.72rem', fontWeight:700, padding:'3px 10px', borderRadius:999 }}>
                {c.enrollmentCount || 0} students
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Campus breakdown */}
      {(stats.students > 0) && (
        <div className="card" style={{ padding:20 }}>
          <h3 style={{ fontSize:'.9rem', color:'var(--navy)', marginBottom:16, fontWeight:700 }}>Platform Overview</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {[
              { label:'Students per Teacher', val: stats.teachers > 0 ? Math.round(stats.students / stats.teachers) : '—' },
              { label:'Enrollment Rate',      val: stats.courses  > 0 ? Math.round(stats.enrollments / stats.courses) + ' per course' : '—' },
              { label:'Certificate Rate',     val: stats.enrollments > 0 ? Math.round(stats.certificates / stats.enrollments * 100) + '%' : '0%' },
              { label:'Active Courses',       val: stats.courses || 0 },
            ].map((s, i) => (
              <div key={i} style={{ textAlign:'center', padding:14, background:'var(--gray-100)', borderRadius:'var(--radius-md)' }}>
                <p style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, color:'var(--navy)' }}>{s.val}</p>
                <p style={{ fontSize:'.72rem', color:'var(--gray-500)', marginTop:4 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
