import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import API, { updateProfile, changePassword } from '../../utils/api';
import toast from 'react-hot-toast';

const CAMPUSES = ['Dakar','Abidjan','Douala','Banjul','Online'];
const PROGRAMS = ['BBA - Business Administration','Computer Science','Political Science','Biology','MBA','Engineering','Language Center','Mathematics','Economics','Law'];
const LEVELS   = { Beginner:[0,500], Intermediate:[500,2000], Advanced:[2000,5000], Expert:[5000,9999] };

function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [tab,    setTab]    = useState('info');
  const [form,   setForm]   = useState({
    firstName:      user?.firstName      || '',
    lastName:       user?.lastName       || '',
    bio:            user?.bio            || '',
    campus:         user?.campus         || 'Dakar',
    program:        user?.program        || '',
    specialization: user?.specialization || '',
    officeHours:    user?.officeHours    || '',
    avatar:         user?.avatar         || '',
  });
  const [pwd,       setPwd]       = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const set = (f) => (e) => setForm(prev => ({...prev, [f]: e.target.value}));
  const initials = `${user?.firstName?.[0]||'?'}${user?.lastName?.[0]||''}`.toUpperCase();

  /* ── Upload photo ──────────────────────────────────────────────────── */
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Max file size is 5MB');
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file');

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await API.post('/media/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data.url;
      setForm(prev => ({...prev, avatar: url}));
      // Auto-save avatar
      const profileRes = await updateProfile({ avatar: url });
      updateUser(profileRes.data.user);
      toast.success('Profile photo updated! ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  /* ── Save profile ──────────────────────────────────────────────────── */
  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile(form);
      updateUser(res.data.user);
      toast.success('Profile saved! ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  /* ── Change password ───────────────────────────────────────────────── */
  const savePwd = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirm) return toast.error('Passwords do not match');
    if (pwd.newPassword.length < 6) return toast.error('Minimum 6 characters');
    setSaving(true);
    try {
      await changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      toast.success('Password updated! ✅');
      setPwd({ currentPassword:'', newPassword:'', confirm:'' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  // Level progress for students
  const levelPts  = user?.totalPoints || 0;
  const levelName = user?.level || 'Beginner';
  const [lMin, lMax] = LEVELS[levelName] || [0, 500];
  const levelPct  = Math.min(100, Math.round((levelPts - lMin) / (lMax - lMin) * 100));
  const nextLevel = { Beginner:'Intermediate', Intermediate:'Advanced', Advanced:'Expert', Expert:'Expert' }[levelName];

  return (
    <div className="fade-up" style={{display:'flex', flexDirection:'column', gap:22, maxWidth:720}}>

      {/* ── Hero card ──────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, #1a1a1a 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background pattern */}
        <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(rgba(208,170,49,.05) 1px,transparent 1px)',backgroundSize:'28px 28px',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:0,right:0,width:200,height:200,background:'radial-gradient(circle,rgba(208,170,49,.08),transparent 70%)',pointerEvents:'none'}}/>

        {/* Avatar */}
        <div style={{position:'relative',flexShrink:0}}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            border: '3px solid var(--gold)',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }} onClick={() => fileRef.current?.click()}>
            {form.avatar ? (
              <img src={form.avatar} alt={form.firstName} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            ) : (
              <span style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'1.8rem',color:'var(--navy)'}}>{initials}</span>
            )}
          </div>
          {/* Camera icon overlay */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              position:'absolute', bottom:0, right:0,
              width:28, height:28, borderRadius:'50%',
              background: 'var(--gold)', color: 'var(--navy)',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', border:'2px solid #1a1a1a',
              fontSize:'.7rem',
              transition:'transform .2s',
            }}
            title="Change photo"
          >
            {uploading
              ? <i className="fa-solid fa-spinner fa-spin" style={{fontSize:10}}/>
              : <i className="fa-solid fa-camera" style={{fontSize:11}}/>
            }
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{display:'none'}}
            onChange={handlePhotoUpload}
          />
        </div>

        {/* Info */}
        <div style={{flex:1,minWidth:0,zIndex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6,flexWrap:'wrap'}}>
            <h1 style={{color:'white',fontSize:'1.4rem',margin:0}}>
              {user?.firstName} {user?.lastName}
            </h1>
            <span className={`badge ${user?.role==='teacher'?'badge-blue':user?.role==='admin'?'badge-orange':'badge-green'}`}>
              {user?.role}
            </span>
          </div>
          <p style={{color:'rgba(255,255,255,.5)',fontSize:'.82rem',marginBottom:10}}>{user?.email}</p>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:user?.role==='student'?12:0}}>
            <span style={{background:'rgba(208,170,49,.15)',border:'1px solid rgba(208,170,49,.3)',color:'var(--gold-light)',fontSize:'.72rem',fontWeight:600,padding:'3px 10px',borderRadius:999}}>
              <i className="fa-solid fa-location-dot"/> {user?.campus}
            </span>
            {user?.studentId && (
              <span style={{background:'rgba(255,255,255,.08)',color:'rgba(255,255,255,.6)',fontSize:'.72rem',padding:'3px 10px',borderRadius:999}}>
                {user.studentId}
              </span>
            )}
            {user?.program && (
              <span style={{background:'rgba(255,255,255,.08)',color:'rgba(255,255,255,.6)',fontSize:'.72rem',padding:'3px 10px',borderRadius:999}}>
                {user.program}
              </span>
            )}
          </div>

          {/* Level bar for students */}
          {user?.role === 'student' && (
            <div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'.72rem',marginBottom:5}}>
                <span style={{color:'var(--gold)',fontWeight:700}}><i className="fa-solid fa-star"/> {levelName}</span>
                <span style={{color:'rgba(255,255,255,.5)'}}>{levelPts} pts{levelName!=='Expert'&&` → ${nextLevel}`}</span>
              </div>
              <div style={{height:5,borderRadius:999,background:'rgba(255,255,255,.1)',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${levelPct}%`,background:'linear-gradient(90deg,var(--gold),var(--gold-light))',borderRadius:999,transition:'width .5s'}}/>
              </div>
            </div>
          )}

          {/* Upload hint */}
          <p style={{color:'rgba(255,255,255,.3)',fontSize:'.72rem',marginTop:8}}>
            <i className="fa-solid fa-camera"/> Click on the photo to change it
          </p>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div style={{display:'flex',gap:4,background:'white',border:'1px solid var(--gray-200)',borderRadius:'var(--radius-md)',padding:5,width:'fit-content'}}>
        {[
          {id:'info',     label:'Profile Info',   icon:'fa-user'},
          {id:'security', label:'Security',       icon:'fa-lock'},
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{padding:'9px 20px',border:'none',borderRadius:10,background:tab===t.id?'var(--navy)':'transparent',color:tab===t.id?'white':'var(--gray-600)',fontFamily:'var(--font-body)',fontWeight:600,fontSize:'.875rem',cursor:'pointer',transition:'all .2s',display:'flex',alignItems:'center',gap:7}}>
            <i className={`fa-solid ${t.icon}`} style={{fontSize:'.85rem'}}/> {t.label}
          </button>
        ))}
      </div>

      {/* ── Profile Info Tab ───────────────────────────────────────── */}
      {tab === 'info' && (
        <form onSubmit={saveProfile} className="card" style={{padding:28,display:'flex',flexDirection:'column',gap:0}}>

          {/* Photo upload section */}
          <div style={{marginBottom:24,padding:16,background:'var(--gray-100)',borderRadius:12,display:'flex',alignItems:'center',gap:16}}>
            <div style={{width:56,height:56,borderRadius:'50%',overflow:'hidden',background:'var(--gray-200)',border:'2px solid var(--gold)',flexShrink:0}}>
              {form.avatar
                ? <img src={form.avatar} alt="Avatar" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : <div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,var(--gold),var(--gold-light))',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'.9rem',color:'var(--navy)'}}>{initials}</div>
              }
            </div>
            <div style={{flex:1}}>
              <p style={{fontWeight:600,fontSize:'.875rem',color:'var(--navy)',marginBottom:4}}>Profile Photo</p>
              <p style={{fontSize:'.78rem',color:'var(--gray-500)',marginBottom:8}}>JPG, PNG, GIF · Max 5MB</p>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button type="button" className="btn btn-gold btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <i className="fa-solid fa-upload"/> {uploading ? 'Uploading…' : 'Upload Photo'}
                </button>
                {form.avatar && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => { setForm(p=>({...p,avatar:''})); }}>
                    <i className="fa-solid fa-trash"/> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <h2 style={{fontSize:'.9rem',fontWeight:700,color:'var(--navy)',marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
            <i className="fa-solid fa-user" style={{color:'var(--gold)'}}/> Personal Information
          </h2>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input type="text" className="form-input" value={form.firstName} onChange={set('firstName')} required/>
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input type="text" className="form-input" value={form.lastName} onChange={set('lastName')} required/>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea className="form-input" rows={3} style={{resize:'vertical'}} placeholder="Tell us about yourself…" value={form.bio} onChange={set('bio')}/>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label"><i className="fa-solid fa-location-dot" style={{color:'var(--gold)'}}/> Campus</label>
              <select className="form-input" value={form.campus} onChange={set('campus')}>
                {CAMPUSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {user?.role === 'student' && (
              <div className="form-group">
                <label className="form-label"><i className="fa-solid fa-graduation-cap" style={{color:'var(--gold)'}}/> Program</label>
                <select className="form-input" value={form.program} onChange={set('program')}>
                  <option value="">— Select program —</option>
                  {PROGRAMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            )}
            {user?.role === 'teacher' && (
              <div className="form-group">
                <label className="form-label"><i className="fa-solid fa-book" style={{color:'var(--gold)'}}/> Specialization</label>
                <input type="text" className="form-input" placeholder="e.g. Business Management" value={form.specialization} onChange={set('specialization')}/>
              </div>
            )}
          </div>

          {user?.role === 'teacher' && (
            <div className="form-group">
              <label className="form-label"><i className="fa-regular fa-clock" style={{color:'var(--gold)'}}/> Office Hours</label>
              <input type="text" className="form-input" placeholder="e.g. Mon-Wed 14:00-16:00" value={form.officeHours} onChange={set('officeHours')}/>
            </div>
          )}

          <div style={{display:'flex',justifyContent:'flex-end',paddingTop:16,borderTop:'1px solid var(--gray-200)'}}>
            <button type="submit" className="btn btn-gold" disabled={saving}>
              <i className="fa-solid fa-floppy-disk"/> {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}

      {/* ── Security Tab ───────────────────────────────────────────── */}
      {tab === 'security' && (
        <form onSubmit={savePwd} className="card" style={{padding:28,display:'flex',flexDirection:'column',gap:0}}>
          <h2 style={{fontSize:'.9rem',fontWeight:700,color:'var(--navy)',marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
            <i className="fa-solid fa-lock" style={{color:'var(--gold)'}}/> Change Password
          </h2>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input type="password" className="form-input" required autoComplete="current-password" value={pwd.currentPassword} onChange={e => setPwd({...pwd, currentPassword:e.target.value})}/>
          </div>
          <div className="form-group">
            <label className="form-label">New Password <span style={{color:'var(--gray-400)',fontWeight:400,fontSize:'.8rem'}}>(minimum 6 characters)</span></label>
            <input type="password" className="form-input" required minLength={6} autoComplete="new-password" value={pwd.newPassword} onChange={e => setPwd({...pwd, newPassword:e.target.value})}/>
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input type="password" className="form-input" required autoComplete="new-password" value={pwd.confirm} onChange={e => setPwd({...pwd, confirm:e.target.value})}/>
          </div>
          {pwd.newPassword && pwd.confirm && pwd.newPassword !== pwd.confirm && (
            <div style={{padding:'8px 14px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:8,fontSize:'.8rem',color:'#dc2626',marginBottom:8}}>
              <i className="fa-solid fa-triangle-exclamation"/> Passwords do not match
            </div>
          )}
          <div style={{display:'flex',justifyContent:'flex-end',paddingTop:16,borderTop:'1px solid var(--gray-200)'}}>
            <button type="submit" className="btn btn-gold" disabled={saving || (pwd.newPassword !== pwd.confirm && !!pwd.confirm)}>
              <i className="fa-solid fa-key"/> {saving ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ProfilePage;
