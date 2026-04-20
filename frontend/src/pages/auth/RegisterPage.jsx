import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DunisLogo from '../../components/DunisLogo/DunisLogo';
import { FiUser, FiMail, FiLock, FiMapPin, FiBook, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Auth.css';

const CAMPUSES = ['Dakar','Abidjan','Douala','Banjul','Online'];
const PROGRAMS = ['BBA — Business Administration','Computer Science','Political Science','Biology','MBA','Engineering','Language Center','Mathematics','Economics','Law'];

export default function RegisterPage() {
  const [role,    setRole]    = useState('student');
  const [firstName,setFirstName]= useState('');
  const [lastName, setLastName] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [campus,   setCampus]   = useState('Dakar');
  const [program,  setProgram]  = useState('');
  const [specialization, setSpecialization] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.endsWith('@dunis.africa')) {
      return toast.error('Only @dunis.africa emails are allowed (e.g. pape@dunis.africa)');
    }
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const data = { firstName, lastName, email, password, role, campus, program, specialization };
      const user = await register(data);
      navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* Left */}
      <div className="auth-left">
        <div className="auth-deco">
          <div className="auth-logo-big">
            <DunisLogo size="md" variant="white" />
          </div>
          <div className="auth-roles-preview">
            <h3>Who can join?</h3>
            <div className="role-card-mini">
              <span>🎓</span>
              <div>
                <strong>Students</strong>
                <p>Access courses, assignments, quizzes, live classes & certificates</p>
              </div>
            </div>
            <div className="role-card-mini">
              <span>👨‍🏫</span>
              <div>
                <strong>Teachers</strong>
                <p>Create courses, manage your class, grade work & schedule live sessions</p>
              </div>
            </div>
          </div>
          <div className="campus-chips">
            {['🇸🇳 Dakar','🇨🇮 Abidjan','🇨🇲 Douala','🇬🇲 Banjul'].map(c => (
              <span key={c} className="campus-chip">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="auth-right">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h1>Create account</h1>
            <p>Join the DUNIS Africa e-learning community</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* Role selector */}
            <div className="form-group">
              <label className="form-label">I am a</label>
              <div className="role-selector">
                <button type="button" className={`role-opt ${role==='student'?'active':''}`} onClick={() => setRole('student')}>
                  🎓 Student
                </button>
                <button type="button" className={`role-opt ${role==='teacher'?'active':''}`} onClick={() => setRole('teacher')}>
                  👨‍🏫 Teacher
                </button>
              </div>
            </div>

            {/* Name */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-first">First Name</label>
                <div className="form-input-icon">
                  <FiUser className="input-icon" />
                  <input id="reg-first" type="text" className="form-input" placeholder="Pape" value={firstName} onChange={e => setFirstName(e.target.value)} required autoComplete="given-name" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-last">Last Name</label>
                <div className="form-input-icon">
                  <FiUser className="input-icon" />
                  <input id="reg-last" type="text" className="form-input" placeholder="Diallo" value={lastName} onChange={e => setLastName(e.target.value)} required autoComplete="family-name" />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                DUNIS Email <span style={{fontSize:'.75rem',color:'var(--gold)',fontWeight:600,background:'var(--gold-pale)',padding:'2px 8px',borderRadius:'999px',marginLeft:6}}>@dunis.africa</span>
              </label>
              <div className="form-input-icon">
                <FiMail className="input-icon" />
                <input id="reg-email" type="email" className="form-input" placeholder="pape@dunis.africa" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-pwd">Password</label>
              <div className="form-input-icon auth-pwd-wrap">
                <FiLock className="input-icon" />
                <input id="reg-pwd" type={showPwd ? 'text':'password'} className="form-input" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
                <button type="button" className="auth-pwd-toggle" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                  {showPwd ? <FiEyeOff size={17}/> : <FiEye size={17}/>}
                </button>
              </div>
            </div>

            {/* Campus + Program/Specialization */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-campus">Campus</label>
                <div className="form-input-icon">
                  <FiMapPin className="input-icon" />
                  <select id="reg-campus" className="form-input" value={campus} onChange={e => setCampus(e.target.value)}>
                    {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-prog">
                  {role === 'teacher' ? 'Specialization' : 'Program'}
                </label>
                <div className="form-input-icon">
                  <FiBook className="input-icon" />
                  {role === 'teacher' ? (
                    <input id="reg-prog" type="text" className="form-input" placeholder="e.g. Business Management" value={specialization} onChange={e => setSpecialization(e.target.value)} />
                  ) : (
                    <select id="reg-prog" className="form-input" value={program} onChange={e => setProgram(e.target.value)}>
                      <option value="">Select program…</option>
                      {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  )}
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-navy auth-submit-btn" disabled={loading}>
              {loading ? 'Creating account…' : <><span>Create account</span> <FiArrowRight size={17}/></>}
            </button>

          </form>

          <div className="auth-domain-note">
            🔒 Only <strong>@dunis.africa</strong> institutional email addresses are accepted
          </div>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
