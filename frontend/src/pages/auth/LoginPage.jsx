import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/dunis-logo.png';
import toast from 'react-hot-toast';
import './Auth.css';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return toast.error('Please enter email and password');
    setLoading(true);
    try {
      const user = await login({ email: email.trim().toLowerCase(), password });
      toast.success(`Welcome back, ${user.firstName}! 👋`);
      const dest = { admin: '/admin/dashboard', teacher: '/teacher/courses', student: '/student/dashboard' };
      navigate(dest[user.role] || '/student/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-layout">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-inner">
          {/* Logo in white pill */}
          <div className="auth-logo-pill">
            <img src={logoImg} alt="DUNIS Africa" className="auth-logo-img" />
          </div>
          <h1 className="auth-brand-title">DUNIS Africa<br/>E-Learning</h1>
          <p className="auth-brand-sub">Official platform for students, teachers and administrators</p>

          <div className="auth-info-cards">
            {[
              { icon:'fa-graduation-cap', label:'Students',    desc:'Access your courses & assignments' },
              { icon:'fa-chalkboard-user',label:'Teachers',    desc:'Manage classes & grade work' },
              { icon:'fa-shield-halved',  label:'Admins',      desc:'Manage users & platform settings' },
            ].map((card, i) => (
              <div key={i} className="auth-info-card">
                <i className={`fa-solid ${card.icon}`}/>
                <div>
                  <p className="auth-info-label">{card.label}</p>
                  <p className="auth-info-desc">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="auth-campus-badges">
            {['🇸🇳 Dakar','🇨🇮 Abidjan','🇨🇲 Douala','🇬🇲 Banjul'].map(c => (
              <span key={c} className="auth-campus-badge">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-logo">
            <img src={logoImg} alt="DUNIS" className="auth-form-logo-img"/>
          </div>
          <h2 className="auth-form-title">Sign In</h2>
          <p className="auth-form-sub">Enter your institutional email and password</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label>Email</label>
              <div className="auth-input-wrap">
                <i className="fa-solid fa-envelope auth-input-icon"/>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="yourname@dunis.africa"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-input-wrap">
                <i className="fa-solid fa-lock auth-input-icon"/>
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="auth-eye-btn" onClick={() => setShowPwd(v => !v)}>
                  <i className={`fa-solid ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`}/>
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading
                ? <><i className="fa-solid fa-spinner fa-spin"/> Signing in…</>
                : <><i className="fa-solid fa-arrow-right-to-bracket"/> Sign In</>
              }
            </button>
          </form>

          <div className="auth-footer-note">
            <i className="fa-solid fa-circle-info"/>
            Contact your administrator if you don't have an account yet.
          </div>
        </div>
      </div>
    </div>
  );
}
