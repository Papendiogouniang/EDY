import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEnrolledCourses, getMyAssignments } from '../../utils/api';
import { FiClipboard, FiCheckCircle, FiClock, FiAlertCircle, FiArrowRight, FiSend, FiMessageSquare, FiStar } from 'react-icons/fi';
import { format } from 'date-fns';
// toast removed - not used
import './StudentPages.css';

export default function StudentAssignments() {
  const [items,   setItems]   = useState([]);
  const [filter,  setFilter]  = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEnrolledCourses()
      .then(async r => {
        const enrs  = r.data.enrollments || [];
        const allItems = [];

        for (const enr of enrs) {
          if (!enr.course) continue;
          const courseId   = enr.course._id;
          const courseName = enr.course.title;

          // Get only ASSIGNMENT-type lessons from this course
          const assignLessons = (enr.course.lessons || []).filter(l => l.type === 'assignment');
          if (assignLessons.length === 0) continue;

          // Get my submissions for this course
          let submissions = [];
          try {
            const subRes = await getMyAssignments(courseId);
            submissions = subRes.data.submissions || [];
          } catch {}

          for (const lesson of assignLessons) {
            const sub = submissions.find(s =>
              s.lessonId?.toString() === lesson._id?.toString() ||
              s.lessonId === lesson._id
            );
            allItems.push({
              type: 'assignment',
              lessonId: lesson._id,
              courseId,
              courseName,
              title: lesson.title,
              instructions: lesson.assignmentInstructions || '',
              dueDate: lesson.dueDate,
              maxScore: lesson.maxScore || 100,
              points: lesson.points || 20,
              status: !sub ? 'pending'
                    : sub.status === 'graded' ? 'graded'
                    : 'submitted',
              grade:    sub?.grade    ?? null,
              feedback: sub?.feedback ?? '',
              submissionId: sub?._id,
              submittedAt:  sub?.submittedAt,
              link: `/student/courses/${courseId}/lessons/${lesson._id}`,
            });
          }
        }

        // Sort: pending first, then submitted, then graded
        const ORDER = { pending: 0, submitted: 1, graded: 2 };
        allItems.sort((a, b) => (ORDER[a.status] ?? 0) - (ORDER[b.status] ?? 0));
        setItems(allItems);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(it => {
    if (filter === 'all')      return true;
    if (filter === 'pending')  return it.status === 'pending';
    if (filter === 'submitted')return it.status === 'submitted';
    if (filter === 'graded')   return it.status === 'graded';
    return true;
  });

  const counts = {
    all:       items.length,
    pending:   items.filter(i => i.status === 'pending').length,
    submitted: items.filter(i => i.status === 'submitted').length,
    graded:    items.filter(i => i.status === 'graded').length,
  };

  const avgGrade = (() => {
    const graded = items.filter(i => i.grade !== null && i.grade !== undefined);
    if (!graded.length) return null;
    return Math.round(graded.reduce((s, i) => s + i.grade, 0) / graded.length);
  })();

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-up" style={{ display:'flex', flexDirection:'column', gap:22 }}>

      {/* Header */}
      <div>
        <h1 className="section-title">My Assignments</h1>
        <p className="section-sub">Devoirs à rendre, travaux notés par vos professeurs</p>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {[
          { label:'Total',     val:counts.all,       color:'#3b82f6', icon:FiClipboard },
          { label:'À faire',   val:counts.pending,   color:'#f97316', icon:FiClock },
          { label:'Soumis',    val:counts.submitted,  color:'#8b5cf6', icon:FiAlertCircle },
          { label:'Notés',     val:counts.graded,    color:'#10b981', icon:FiCheckCircle },
        ].map((s,i) => (
          <div key={i} className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:12, borderLeft:`3px solid ${s.color}` }}>
            <div style={{ width:38, height:38, borderRadius:10, background:`${s.color}18`, color:s.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <s.icon size={17}/>
            </div>
            <div>
              <p style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:700, color:'var(--navy)', lineHeight:1 }}>{s.val}</p>
              <p style={{ fontSize:'.72rem', color:'var(--gray-600)', fontWeight:500, marginTop:2 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Average grade banner */}
      {avgGrade !== null && (
        <div style={{ padding:'14px 20px', background:'linear-gradient(135deg,var(--navy),#1a3a6e)', borderRadius:'var(--radius-md)', display:'flex', alignItems:'center', gap:14 }}>
          <FiStar size={22} color="var(--gold)"/>
          <div>
            <p style={{ color:'rgba(255,255,255,.7)', fontSize:'.78rem', marginBottom:2 }}>Moyenne générale des devoirs notés</p>
            <p style={{ color:'white', fontWeight:700, fontSize:'1.1rem' }}>{avgGrade} / 100</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:4, background:'var(--white)', border:'1px solid var(--gray-200)', borderRadius:'var(--radius-md)', padding:5, width:'fit-content', flexWrap:'wrap' }}>
        {[
          { id:'all',       label:`Tous (${counts.all})` },
          { id:'pending',   label:`À faire (${counts.pending})` },
          { id:'submitted', label:`Soumis (${counts.submitted})` },
          { id:'graded',    label:`Notés (${counts.graded})` },
        ].map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            style={{ padding:'8px 16px', border:'none', borderRadius:10, background:filter===t.id?'var(--navy)':'transparent', color:filter===t.id?'white':'var(--gray-600)', fontFamily:'var(--font-body)', fontWeight:600, fontSize:'.82rem', cursor:'pointer', transition:'var(--transition)', whiteSpace:'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty-state card">
          <FiClipboard size={40}/>
          <h3>{filter === 'all' ? 'Aucun devoir' : `Aucun devoir ${filter}`}</h3>
          <p>{filter === 'all' ? 'Les devoirs apparaissent ici quand vos professeurs en créent.' : 'Changer le filtre pour voir les autres.'}</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map((item, i) => (
            <div key={i} className="card" style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:16, borderLeft:`4px solid ${statusColor(item.status)}` }}>

              {/* Icon */}
              <div style={{ width:44, height:44, borderRadius:12, background:'rgba(59,130,246,.1)', color:'#1d4ed8', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <FiClipboard size={20}/>
              </div>

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                  <span className="badge badge-blue" style={{ fontSize:'.68rem' }}>Devoir</span>
                  <span style={{ fontSize:'.72rem', color:'var(--gray-400)' }}>{item.courseName}</span>
                </div>
                <p style={{ fontWeight:600, fontSize:'.925rem', color:'var(--navy)', marginBottom:5 }}>{item.title}</p>

                <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                  {item.dueDate && (
                    <span style={{ fontSize:'.78rem', color: new Date(item.dueDate) < new Date() && item.status === 'pending' ? '#ef4444' : 'var(--gray-600)', display:'flex', alignItems:'center', gap:4 }}>
                      <FiClock size={11}/> À rendre: {format(new Date(item.dueDate), 'dd MMM yyyy')}
                      {new Date(item.dueDate) < new Date() && item.status === 'pending' && ' ⚠️ En retard'}
                    </span>
                  )}
                  <span style={{ fontSize:'.78rem', color:'var(--gray-600)' }}>Sur {item.maxScore} pts</span>
                  {item.grade !== null && item.grade !== undefined && (
                    <span style={{ fontSize:'.78rem', fontWeight:700, color: item.grade >= 50 ? '#10b981' : '#ef4444' }}>
                      Note obtenue: {item.grade}/{item.maxScore}
                    </span>
                  )}
                </div>

                {/* Feedback */}
                {item.feedback && (
                  <div style={{ marginTop:8, padding:'8px 12px', background:'rgba(200,168,75,.08)', border:'1px solid rgba(200,168,75,.2)', borderRadius:8 }}>
                    <p style={{ fontSize:'.78rem', color:'var(--gray-700)', display:'flex', gap:6, alignItems:'flex-start' }}>
                      <FiMessageSquare size={13} color="var(--gold)" style={{ flexShrink:0, marginTop:1 }}/> {item.feedback}
                    </p>
                  </div>
                )}

                {/* Instructions preview */}
                {item.instructions && item.status === 'pending' && (
                  <p style={{ fontSize:'.78rem', color:'var(--gray-500)', marginTop:5, fontStyle:'italic' }}>
                    📋 {item.instructions.slice(0, 100)}{item.instructions.length > 100 ? '…' : ''}
                  </p>
                )}
              </div>

              {/* Status + CTA */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 }}>
                <span className={`badge ${statusBadge(item.status)}`}>{statusLabel(item.status)}</span>
                <Link to={item.link} className="btn btn-outline-gold btn-sm">
                  {item.status === 'pending' ? <><FiSend size={12}/> Rendre</> : <><FiArrowRight size={12}/> Voir</>}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const statusColor = s => ({ pending:'#f97316', submitted:'#8b5cf6', graded:'#10b981' })[s] || '#94a3b8';
const statusBadge = s => ({ pending:'badge-orange', submitted:'badge-purple', graded:'badge-green' })[s] || '';
const statusLabel = s => ({ pending:'À faire', submitted:'Soumis ⏳', graded:'Noté ✓' })[s] || s;
