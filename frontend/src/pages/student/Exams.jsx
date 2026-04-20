import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEnrolledCourses, getCourseQuizzes, getMyAttempts } from '../../utils/api';
import { FiAward, FiClock, FiCheckCircle, FiArrowRight, FiTarget, FiRefreshCw } from 'react-icons/fi';
import './StudentPages.css';

export default function StudentExams() {
  const [items,   setItems]   = useState([]);
  const [filter,  setFilter]  = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEnrolledCourses()
      .then(async r => {
        const enrs = r.data.enrollments || [];
        const allItems = [];

        for (const enr of enrs) {
          if (!enr.course) continue;
          const courseId   = enr.course._id;
          const courseName = enr.course.title;

          let quizzes = [];
          try {
            const qRes = await getCourseQuizzes(courseId);
            quizzes = qRes.data.quizzes || [];
          } catch { continue; }

          for (const quiz of quizzes) {
            let attempts = [];
            try {
              const attRes = await getMyAttempts(quiz._id);
              attempts = attRes.data.attempts || [];
            } catch {}

            const bestScore = attempts.length ? Math.max(...attempts.map(a => a.score)) : null;
            const passed    = attempts.some(a => a.passed);
            const remaining = quiz.maxAttempts - attempts.length;
            const canRetry  = remaining > 0;

            allItems.push({
              quizId:      quiz._id,
              courseId,
              courseName,
              title:        quiz.title,
              questions:    quiz.questions?.length || 0,
              timeLimit:    quiz.timeLimit,
              passingScore: quiz.passingScore,
              maxAttempts:  quiz.maxAttempts,
              attempts:     attempts.length,
              remaining,
              canRetry,
              bestScore,
              passed,
              status: attempts.length === 0 ? 'not_started'
                    : passed              ? 'passed'
                    : canRetry            ? 'failed_retry'
                    : 'failed_no_retry',
              lastAttempt: attempts[0] || null,
              link: `/student/courses/${courseId}/quiz/${quiz._id}`,
            });
          }
        }

        // Sort: not_started first, then failed_retry, then passed, then no_retry
        const ORDER = { not_started:0, failed_retry:1, passed:2, failed_no_retry:3 };
        allItems.sort((a,b) => (ORDER[a.status]??0) - (ORDER[b.status]??0));
        setItems(allItems);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(it => {
    if (filter === 'all')         return true;
    if (filter === 'not_started') return it.status === 'not_started';
    if (filter === 'passed')      return it.status === 'passed';
    if (filter === 'retry')       return it.status === 'failed_retry';
    return true;
  });

  const counts = {
    all:         items.length,
    not_started: items.filter(i => i.status === 'not_started').length,
    passed:      items.filter(i => i.status === 'passed').length,
    retry:       items.filter(i => i.status === 'failed_retry').length,
  };

  const avgBest = (() => {
    const taken = items.filter(i => i.bestScore !== null);
    if (!taken.length) return null;
    return Math.round(taken.reduce((s, i) => s + i.bestScore, 0) / taken.length);
  })();

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-up" style={{ display:'flex', flexDirection:'column', gap:22 }}>

      {/* Header */}
      <div>
        <h1 className="section-title">Examens & Quiz</h1>
        <p className="section-sub">Tests notés, QCM et évaluations de vos cours</p>
      </div>

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {[
          { label:'Total',       val:counts.all,         color:'#3b82f6', icon:FiAward },
          { label:'À passer',    val:counts.not_started,  color:'#f97316', icon:FiClock },
          { label:'Réussis',     val:counts.passed,       color:'#10b981', icon:FiCheckCircle },
          { label:'À reprendre', val:counts.retry,        color:'#8b5cf6', icon:FiRefreshCw },
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

      {/* Average score banner */}
      {avgBest !== null && (
        <div style={{ padding:'14px 20px', background:'linear-gradient(135deg,var(--navy),#1a3a6e)', borderRadius:'var(--radius-md)', display:'flex', alignItems:'center', gap:14 }}>
          <FiTarget size={22} color="var(--gold)"/>
          <div>
            <p style={{ color:'rgba(255,255,255,.7)', fontSize:'.78rem', marginBottom:2 }}>Score moyen (meilleure tentative par quiz)</p>
            <p style={{ color:'white', fontWeight:700, fontSize:'1.1rem' }}>{avgBest}%</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:4, background:'var(--white)', border:'1px solid var(--gray-200)', borderRadius:'var(--radius-md)', padding:5, width:'fit-content', flexWrap:'wrap' }}>
        {[
          { id:'all',         label:`Tous (${counts.all})` },
          { id:'not_started', label:`À passer (${counts.not_started})` },
          { id:'passed',      label:`Réussis (${counts.passed})` },
          { id:'retry',       label:`À reprendre (${counts.retry})` },
        ].map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            style={{ padding:'8px 16px', border:'none', borderRadius:10, background:filter===t.id?'var(--navy)':'transparent', color:filter===t.id?'white':'var(--gray-600)', fontFamily:'var(--font-body)', fontWeight:600, fontSize:'.82rem', cursor:'pointer', transition:'var(--transition)', whiteSpace:'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Quiz list */}
      {filtered.length === 0 ? (
        <div className="empty-state card">
          <FiAward size={40}/>
          <h3>Aucun quiz</h3>
          <p>{filter === 'all' ? 'Les quiz créés par vos professeurs apparaîtront ici.' : 'Aucun quiz dans cette catégorie.'}</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map((item, i) => (
            <div key={i} className="card" style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:16, borderLeft:`4px solid ${quizStatusColor(item.status)}` }}>

              {/* Icon */}
              <div style={{ width:50, height:50, borderRadius:14, background:'linear-gradient(135deg,rgba(200,168,75,.15),rgba(200,168,75,.05))', border:'1px solid rgba(200,168,75,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <FiAward size={22} color="var(--gold)"/>
              </div>

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                  <span className="badge badge-gold" style={{ fontSize:'.68rem' }}>Quiz</span>
                  <span style={{ fontSize:'.72rem', color:'var(--gray-400)' }}>{item.courseName}</span>
                </div>
                <p style={{ fontWeight:700, fontSize:'.95rem', color:'var(--navy)', marginBottom:6 }}>{item.title}</p>
                <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                  <span style={{ fontSize:'.78rem', color:'var(--gray-600)', display:'flex', gap:4, alignItems:'center' }}>
                    <FiClock size={11}/> {item.timeLimit} min
                  </span>
                  <span style={{ fontSize:'.78rem', color:'var(--gray-600)' }}>
                    📋 {item.questions} questions
                  </span>
                  <span style={{ fontSize:'.78rem', color:'var(--gray-600)' }}>
                    <FiTarget size={11}/> Score requis: {item.passingScore}%
                  </span>
                  <span style={{ fontSize:'.78rem', color:'var(--gray-600)' }}>
                    🔄 {item.attempts}/{item.maxAttempts} tentative{item.attempts !== 1 ? 's' : ''}
                  </span>
                  {item.bestScore !== null && (
                    <span style={{ fontSize:'.78rem', fontWeight:700, color: item.passed ? '#10b981' : '#ef4444' }}>
                      Meilleur score: {item.bestScore}%
                    </span>
                  )}
                </div>
              </div>

              {/* Status + CTA */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 }}>
                <span className={`badge ${quizStatusBadge(item.status)}`}>{quizStatusLabel(item.status)}</span>
                {item.canRetry ? (
                  <Link to={item.link} className="btn btn-gold btn-sm">
                    {item.attempts === 0 ? <><FiAward size={12}/> Commencer</> : <><FiRefreshCw size={12}/> Reprendre</>}
                    <FiArrowRight size={12}/>
                  </Link>
                ) : (
                  <Link to={item.link} className="btn btn-outline btn-sm">
                    Voir résultats <FiArrowRight size={12}/>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const quizStatusColor = s => ({ not_started:'#f97316', passed:'#10b981', failed_retry:'#8b5cf6', failed_no_retry:'#ef4444' })[s] || '#94a3b8';
const quizStatusBadge = s => ({ not_started:'badge-orange', passed:'badge-green', failed_retry:'badge-purple', failed_no_retry:'badge-red' })[s] || '';
const quizStatusLabel = s => ({ not_started:'À passer', passed:'Réussi ✓', failed_retry:'Échec — Réessayer', failed_no_retry:'Terminé' })[s] || s;
