import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getQuiz, submitQuiz, getMyAttempts } from '../../utils/api';
import { FiClock, FiCheckCircle, FiXCircle, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function QuizPage() {
  const { courseId, quizId } = useParams();
  const [quiz, setQuiz]       = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [phase, setPhase]     = useState('intro');
  const [result, setResult]   = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    Promise.all([getQuiz(quizId), getMyAttempts(quizId)])
      .then(([qRes, aRes]) => {
        setQuiz(qRes.data.quiz);
        setAttempts(aRes.data.attempts);
        setAnswers(new Array(qRes.data.quiz.questions.length).fill(null));
        setTimeLeft(qRes.data.quiz.timeLimit * 60);
      }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  useEffect(() => {
    if (phase !== 'quiz') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const handleSubmit = async () => {
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const res = await submitQuiz(quizId, { answers, timeTaken: quiz.timeLimit * 60 - timeLeft });
      setResult(res.data);
      setPhase('result');
      if (res.data.passed) toast.success('🎉 You passed! Well done!');
      else toast.error(`Score: ${res.data.score}%. Need ${quiz.passingScore}% to pass.`);
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  const fmt = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  const answered = answers.filter(a => a !== null).length;

  if (!quiz) return <div className="spinner" />;

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    const best = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : null;
    const canAttempt = attempts.length < quiz.maxAttempts;
    return (
      <div style={{ maxWidth:560, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }} className="fade-up">
        <Link to={`/student/courses/${courseId}`} className="btn btn-ghost btn-sm" style={{ width:'fit-content' }}><FiArrowLeft /> Back to course</Link>
        <div className="card" style={{ padding:'40px 36px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--gold-pale)', border:'2px solid rgba(200,168,75,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem' }}>🧪</div>
          <h1 style={{ fontSize:'1.6rem', color:'var(--navy)' }}>{quiz.title}</h1>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, width:'100%', background:'var(--gray-100)', padding:16, borderRadius:'var(--radius-md)' }}>
            {[{label:'Questions',val:quiz.questions.length},{label:'Time Limit',val:`${quiz.timeLimit}min`},{label:'Pass Score',val:`${quiz.passingScore}%`},{label:'Attempts',val:`${attempts.length}/${quiz.maxAttempts}`}].map((s,i) => (
              <div key={i} style={{ textAlign:'center' }}>
                <p style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', fontWeight:700, color:'var(--navy)' }}>{s.val}</p>
                <p style={{ fontSize:'.7rem', color:'var(--gray-600)', textTransform:'uppercase', letterSpacing:'.08em' }}>{s.label}</p>
              </div>
            ))}
          </div>
          {best !== null && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:'999px', background:best>=quiz.passingScore?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', color:best>=quiz.passingScore?'#047857':'#b91c1c', fontWeight:600 }}>
              {best >= quiz.passingScore ? <FiCheckCircle /> : <FiXCircle />} Best score: {best}%
            </div>
          )}
          {canAttempt ? (
            <button className="btn btn-gold btn-lg btn-full" onClick={() => setPhase('quiz')}>Start Quiz <FiArrowRight /></button>
          ) : (
            <p style={{ color:'var(--gray-600)', fontStyle:'italic' }}>Maximum attempts ({quiz.maxAttempts}) reached.</p>
          )}
        </div>
      </div>
    );
  }

  // ── RESULT ──────────────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    return (
      <div style={{ maxWidth:640, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }} className="fade-up">
        <div className="card" style={{ padding:'36px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:18 }}>
          <div style={{ fontSize:'3rem' }}>{result.passed ? '🎉' : '💪'}</div>
          <h1 style={{ fontSize:'1.7rem', color:'var(--navy)' }}>{result.passed ? 'Quiz Passed!' : 'Keep Trying!'}</h1>
          <p style={{ color:'var(--gray-600)' }}>{result.passed ? 'Excellent work! You have passed this quiz.' : `You need ${quiz.passingScore}% to pass. Try again!`}</p>
          {/* Score circle */}
          <div style={{ position:'relative', width:130, height:130 }}>
            <svg viewBox="0 0 120 120" style={{ width:'100%', height:'100%' }}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--gray-200)" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={result.passed?'#10b981':'#ef4444'} strokeWidth="8"
                strokeDasharray={`${2*Math.PI*52}`}
                strokeDashoffset={`${2*Math.PI*52*(1-result.score/100)}`}
                strokeLinecap="round" style={{ transform:'rotate(-90deg)', transformOrigin:'center' }} />
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:'1.7rem', fontWeight:700, color:'var(--navy)' }}>{result.score}%</span>
              <span style={{ fontSize:'.65rem', color:'var(--gray-400)' }}>Score</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:32 }}>
            <div style={{ textAlign:'center' }}><p style={{ fontWeight:700, fontSize:'1.1rem', color:'var(--navy)' }}>{result.earnedPoints}/{result.totalPoints}</p><p style={{ fontSize:'.72rem', color:'var(--gray-600)' }}>Points</p></div>
            <div style={{ textAlign:'center' }}><p style={{ fontWeight:700, fontSize:'1.1rem', color:result.passed?'#10b981':'#ef4444' }}>{result.passed?'✅ Passed':'❌ Failed'}</p><p style={{ fontSize:'.72rem', color:'var(--gray-600)' }}>Result</p></div>
          </div>

          {/* Answer review */}
          {quiz.showAnswers && (
            <div style={{ width:'100%', textAlign:'left' }}>
              <h3 style={{ fontSize:'1rem', color:'var(--navy)', marginBottom:12 }}>Answer Review</h3>
              {quiz.questions.map((q, i) => {
                const ans = result.attempt?.answers?.[i];
                return (
                  <div key={i} style={{ padding:14, borderRadius:10, marginBottom:8, borderLeft:`4px solid ${ans?.isCorrect?'#10b981':'#ef4444'}`, background:ans?.isCorrect?'var(--green-pale)':'var(--red-pale)' }}>
                    <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                      {ans?.isCorrect ? <FiCheckCircle color="#10b981" /> : <FiXCircle color="#ef4444" />}
                      <p style={{ fontWeight:600, fontSize:'.875rem', color:'var(--navy)' }}>{q.text}</p>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:4, marginLeft:24 }}>
                      {q.options.map((opt,j) => (
                        <div key={j} style={{ fontSize:'.82rem', padding:'4px 8px', borderRadius:6, background:opt.isCorrect?'rgba(16,185,129,.15)':ans?.selectedOption===j&&!opt.isCorrect?'rgba(239,68,68,.12)':'transparent', color:opt.isCorrect?'#047857':ans?.selectedOption===j?'#b91c1c':'var(--gray-600)', fontWeight:opt.isCorrect?600:400 }}>
                          {opt.isCorrect ? '✓ ' : ans?.selectedOption===j ? '✗ ' : ''}{opt.text}
                        </div>
                      ))}
                    </div>
                    {q.explanation && <p style={{ fontSize:'.78rem', color:'var(--gray-600)', fontStyle:'italic', marginTop:6, marginLeft:24 }}>{q.explanation}</p>}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display:'flex', gap:12 }}>
            <Link to={`/student/courses/${courseId}`} className="btn btn-outline">Back to Course</Link>
            {!result.passed && attempts.length < quiz.maxAttempts && (
              <button className="btn btn-gold" onClick={() => { setPhase('intro'); setAnswers(new Array(quiz.questions.length).fill(null)); setCurrentQ(0); }}>Try Again</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ ───────────────────────────────────────────────────────────────────
  const q = quiz.questions[currentQ];
  const isLast = currentQ === quiz.questions.length - 1;

  return (
    <div style={{ maxWidth:700, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }} className="fade-up">
      {/* Timer header */}
      <div className="card" style={{ padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:'.82rem', color:'var(--gray-600)' }}>Question {currentQ+1}/{quiz.questions.length}</span>
          <div className="progress-track" style={{ width:160 }}><div className="progress-bar" style={{ width:`${((currentQ+1)/quiz.questions.length)*100}%` }} /></div>
          <span style={{ fontSize:'.78rem', color:'var(--gray-600)' }}>{answered} answered</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'Courier New', fontWeight:700, fontSize:'1.1rem', color:timeLeft<60?'var(--red)':'var(--navy)' }}>
          <FiClock size={16} /> {fmt(timeLeft)}
        </div>
      </div>

      {/* Question */}
      <div className="card" style={{ padding:32 }}>
        <p style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--gold)', marginBottom:10 }}>Question {currentQ+1}</p>
        <h2 style={{ fontSize:'1.15rem', color:'var(--navy)', marginBottom:28, lineHeight:1.5 }}>{q.text}</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {q.options.map((opt, i) => (
            <button key={i}
              onClick={() => { const a=[...answers]; a[currentQ]=i; setAnswers(a); }}
              style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderRadius:'var(--radius-md)', border:`2px solid ${answers[currentQ]===i?'var(--navy)':'var(--gray-200)'}`, background:answers[currentQ]===i?'var(--navy)':'var(--white)', color:answers[currentQ]===i?'white':'var(--navy)', cursor:'pointer', fontFamily:'var(--font-body)', fontSize:'.95rem', transition:'var(--transition)', textAlign:'left' }}>
              <span style={{ width:30, height:30, borderRadius:'50%', background:answers[currentQ]===i?'var(--gold)':'var(--gray-100)', color:answers[currentQ]===i?'var(--navy)':'var(--gray-600)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'.82rem', flexShrink:0 }}>
                {String.fromCharCode(65+i)}
              </span>
              {opt.text}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button className="btn btn-outline btn-sm" onClick={() => setCurrentQ(q => Math.max(0,q-1))} disabled={currentQ===0}><FiArrowLeft /> Previous</button>
        <div style={{ display:'flex', gap:5 }}>
          {quiz.questions.map((_,i) => (
            <button key={i} onClick={() => setCurrentQ(i)} style={{ width:10, height:10, borderRadius:'50%', border:'2px solid', borderColor:i===currentQ?'var(--navy)':answers[i]!==null?'var(--gold)':'var(--gray-200)', background:i===currentQ?'var(--navy)':answers[i]!==null?'var(--gold)':'transparent', cursor:'pointer', padding:0, transition:'var(--transition)' }} />
          ))}
        </div>
        {isLast ? (
          <button className="btn btn-gold" onClick={handleSubmit} disabled={submitting}>
            {submitting?'Submitting…':`Submit (${answered}/${quiz.questions.length})`} <FiCheckCircle size={15}/>
          </button>
        ) : (
          <button className="btn btn-navy btn-sm" onClick={() => setCurrentQ(q => q+1)}>Next <FiArrowRight /></button>
        )}
      </div>
    </div>
  );
}
