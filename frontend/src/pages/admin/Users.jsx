import React, { useState, useEffect } from 'react';
import { getUsers, updateUserRole, toggleUserActive, deleteUser, createUser } from '../../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const CAMPUSES  = ['Dakar','Abidjan','Douala','Banjul'];
const PROGRAMS  = ['BBA - Business Administration','Computer Science','Political Science','Biology','MBA','Engineering','Language Center','Mathematics','Economics','Law'];
const ROLES     = ['student','teacher','admin'];

const EMPTY_USER = { firstName:'', lastName:'', email:'', password:'', role:'student', campus:'Dakar', program:'', specialization:'' };

export default function AdminUsers() {
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [roleFilter,setRoleFilter]= useState('all');
  const [showCreate,setShowCreate]= useState(false);
  const [newUser,   setNewUser]   = useState(EMPTY_USER);
  const [creating,  setCreating]  = useState(false);

  const load = () => {
    setLoading(true);
    getUsers({}).then(r => setUsers(r.data.users || [])).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  const changeRole = async (id, role) => {
    try { await updateUserRole(id, { role }); toast.success('Role updated'); load(); }
    catch { toast.error('Failed'); }
  };
  const toggle = async (id) => {
    try { const r = await toggleUserActive(id); toast.success(r.data.message); load(); }
    catch { toast.error('Failed'); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try { await deleteUser(id); toast.success('User deleted'); load(); }
    catch { toast.error('Failed'); }
  };
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password)
      return toast.error('All fields required');
    if (newUser.password.length < 6) return toast.error('Password min 6 characters');
    setCreating(true);
    try {
      await createUser(newUser);
      toast.success(`${newUser.firstName} ${newUser.lastName} created ✅`);
      setNewUser(EMPTY_USER);
      setShowCreate(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCreating(false); }
  };

  const filtered = users.filter(u => {
    const match = !search || `${u.firstName} ${u.lastName} ${u.email} ${u.studentId||''}`.toLowerCase().includes(search.toLowerCase());
    const role  = roleFilter === 'all' || u.role === roleFilter;
    return match && role;
  });

  const counts = { all: users.length, student: users.filter(u=>u.role==='student').length, teacher: users.filter(u=>u.role==='teacher').length, admin: users.filter(u=>u.role==='admin').length };
  const roleBadge = r => ({ student:'badge-blue', teacher:'badge-green', admin:'badge-orange' }[r] || 'badge-navy');

  return (
    <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h1 className="section-title">User Management</h1>
          <p className="section-sub">{counts.student} students · {counts.teacher} teachers · {counts.admin} admins</p>
        </div>
        <button className="btn btn-gold" onClick={() => setShowCreate(true)}>
          <i className="fa-solid fa-user-plus"/> Create Account
        </button>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        {[
          {label:'All Users',  val:counts.all,     color:'#3b82f6'},
          {label:'Students',   val:counts.student,  color:'#10b981'},
          {label:'Teachers',   val:counts.teacher,  color:'var(--gold)'},
          {label:'Admins',     val:counts.admin,    color:'#8b5cf6'},
        ].map((s,i) => (
          <div key={i} className="card" style={{padding:'14px 18px',borderLeft:`3px solid ${s.color}`,cursor:'pointer'}} onClick={()=>setRoleFilter(i===0?'all':['all','student','teacher','admin'][i])}>
            <p style={{fontFamily:'var(--font-display)',fontSize:'1.6rem',fontWeight:700,color:'var(--navy)'}}>{s.val}</p>
            <p style={{fontSize:'.72rem',color:'var(--gray-600)',fontWeight:500}}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{position:'relative',flex:1,minWidth:220}}>
          <i className="fa-solid fa-magnifying-glass" style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'var(--gray-400)',fontSize:'.85rem'}}/>
          <input type="text" className="form-input" style={{paddingLeft:38}} placeholder="Search by name, email, ID…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div style={{display:'flex',gap:4,background:'white',border:'1px solid var(--gray-200)',borderRadius:'var(--radius-sm)',padding:4}}>
          {['all','student','teacher','admin'].map(r => (
            <button key={r} onClick={()=>setRoleFilter(r)}
              style={{padding:'7px 14px',border:'none',borderRadius:8,background:roleFilter===r?'var(--navy)':'transparent',color:roleFilter===r?'white':'var(--gray-600)',fontFamily:'var(--font-body)',fontWeight:600,fontSize:'.8rem',cursor:'pointer',textTransform:'capitalize',transition:'all .2s'}}>
              {r} {r!=='all'?`(${counts[r]})`:''} 
            </button>
          ))}
        </div>
      </div>

      {/* User table */}
      <div className="card" style={{overflow:'hidden'}}>
        {loading ? <div className="spinner" style={{margin:'40px auto'}}/> : (
          <>
            <div style={{overflowX:'auto'}}>
              <table className="data-table" style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr>
                    <th style={{padding:'12px 16px',textAlign:'left',fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',color:'var(--gray-500)',background:'var(--gray-100)',borderBottom:'1px solid var(--gray-200)'}}>User</th>
                    <th style={{padding:'12px 16px',textAlign:'left',fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',color:'var(--gray-500)',background:'var(--gray-100)',borderBottom:'1px solid var(--gray-200)'}}>Role</th>
                    <th style={{padding:'12px 16px',textAlign:'left',fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',color:'var(--gray-500)',background:'var(--gray-100)',borderBottom:'1px solid var(--gray-200)'}}>Campus</th>
                    <th style={{padding:'12px 16px',textAlign:'left',fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',color:'var(--gray-500)',background:'var(--gray-100)',borderBottom:'1px solid var(--gray-200)'}}>ID / Program</th>
                    <th style={{padding:'12px 16px',textAlign:'left',fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',color:'var(--gray-500)',background:'var(--gray-100)',borderBottom:'1px solid var(--gray-200)'}}>Status</th>
                    <th style={{padding:'12px 16px',textAlign:'left',fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',color:'var(--gray-500)',background:'var(--gray-100)',borderBottom:'1px solid var(--gray-200)'}}>Joined</th>
                    <th style={{padding:'12px 16px',textAlign:'left',fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',color:'var(--gray-500)',background:'var(--gray-100)',borderBottom:'1px solid var(--gray-200)'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} style={{padding:'40px',textAlign:'center',color:'var(--gray-400)',fontStyle:'italic'}}>No users found</td></tr>
                  )}
                  {filtered.map((u,i) => (
                    <tr key={i} style={{borderBottom:'1px solid var(--gray-200)'}}>
                      <td style={{padding:'12px 16px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold),var(--gold-light))',color:'var(--navy)',fontSize:'.78rem',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden'}}>
                            {u.avatar
                              ? <img src={u.avatar} alt={u.firstName} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                              : `${u.firstName?.[0]||'?'}${u.lastName?.[0]||''}`
                            }
                          </div>
                          <div>
                            <p style={{fontWeight:600,fontSize:'.875rem',color:'var(--navy)'}}>{u.firstName} {u.lastName}</p>
                            <p style={{fontSize:'.72rem',color:'var(--gray-400)'}}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{padding:'12px 16px'}}>
                        <select value={u.role} onChange={e=>changeRole(u._id, e.target.value)}
                          style={{border:'1px solid var(--gray-200)',borderRadius:7,padding:'5px 9px',fontFamily:'var(--font-body)',fontSize:'.8rem',cursor:'pointer',background:'white',color:'var(--navy)'}}>
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td style={{padding:'12px 16px',fontSize:'.85rem',color:'var(--gray-600)'}}>{u.campus}</td>
                      <td style={{padding:'12px 16px',fontSize:'.78rem',color:'var(--gray-600)'}}>{u.studentId || u.specialization || u.program || '—'}</td>
                      <td style={{padding:'12px 16px'}}>
                        <span className={`badge ${u.isActive?'badge-green':'badge-red'}`} style={{fontSize:'.68rem'}}>{u.isActive?'Active':'Suspended'}</span>
                      </td>
                      <td style={{padding:'12px 16px',fontSize:'.78rem',color:'var(--gray-400)'}}>{format(new Date(u.createdAt),'MMM dd, yyyy')}</td>
                      <td style={{padding:'12px 16px'}}>
                        <div style={{display:'flex',gap:6}}>
                          <button className="btn btn-outline btn-sm" onClick={()=>toggle(u._id)} title={u.isActive?'Suspend':'Activate'}>
                            <i className={`fa-solid ${u.isActive?'fa-toggle-off':'fa-toggle-on'}`} style={{color:u.isActive?'#ef4444':'#10b981'}}/>
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={()=>remove(u._id)} title="Delete">
                            <i className="fa-solid fa-trash" style={{fontSize:12}}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Create User Modal ────────────────────────────────────────── */}
      {showCreate && (
        <div className="modal-overlay" onClick={()=>setShowCreate(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fa-solid fa-user-plus" style={{color:'var(--gold)',marginRight:8}}/> Create Account</h2>
              <button className="modal-close" onClick={()=>setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div style={{padding:'10px 14px',background:'rgba(208,170,49,.08)',border:'1px solid rgba(208,170,49,.2)',borderRadius:8,fontSize:'.8rem',color:'#7a5c10',marginBottom:16,lineHeight:1.6}}>
                  <i className="fa-solid fa-circle-info" style={{marginRight:6}}/> 
                  The user will log in with these credentials. Share the email and password with them directly.
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input type="text" className="form-input" required placeholder="Aminata" value={newUser.firstName} onChange={e=>setNewUser(s=>({...s,firstName:e.target.value}))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input type="text" className="form-input" required placeholder="Sarr" value={newUser.lastName} onChange={e=>setNewUser(s=>({...s,lastName:e.target.value}))}/>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-input" required placeholder="aminata@dunis.africa" value={newUser.email} onChange={e=>setNewUser(s=>({...s,email:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Password * <span style={{color:'var(--gray-400)',fontWeight:400,fontSize:'.78rem'}}>(min 6 characters)</span></label>
                  <input type="text" className="form-input" required minLength={6} placeholder="Temporary password" value={newUser.password} onChange={e=>setNewUser(s=>({...s,password:e.target.value}))}/>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-input" value={newUser.role} onChange={e=>setNewUser(s=>({...s,role:e.target.value}))}>
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Campus</label>
                    <select className="form-input" value={newUser.campus} onChange={e=>setNewUser(s=>({...s,campus:e.target.value}))}>
                      {CAMPUSES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                {newUser.role === 'student' && (
                  <div className="form-group">
                    <label className="form-label">Program</label>
                    <select className="form-input" value={newUser.program} onChange={e=>setNewUser(s=>({...s,program:e.target.value}))}>
                      <option value="">— Select program —</option>
                      {PROGRAMS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                )}
                {newUser.role === 'teacher' && (
                  <div className="form-group">
                    <label className="form-label">Specialization</label>
                    <input type="text" className="form-input" placeholder="e.g. Business Management" value={newUser.specialization} onChange={e=>setNewUser(s=>({...s,specialization:e.target.value}))}/>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={()=>setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-gold" disabled={creating}>
                  <i className="fa-solid fa-user-plus"/> {creating ? 'Creating…' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
