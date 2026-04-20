import React, { useState, useEffect, useRef } from 'react';
import API, { getSiteSettings, updateSiteSettings } from '../../utils/api';
import { FiSave, FiUploadCloud, FiEye, FiSpeaker, FiImage, FiType, FiGrid } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function LandingEditor() {
  const [settings, setSettings] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [activeTab, setActiveTab] = useState('hero');
  const [uploading, setUploading] = useState(null);
  const [newProg,   setNewProg]   = useState({ title:'', badge:'', sub:'', color:'#d0aa31', campuses:[], imageUrl:'', active:true });
  const heroImgRef   = useRef();
  const logoImgRef   = useRef();
  const campusImgRef = useRef();
  const ctaBgRef     = useRef();

  useEffect(() => {
    getSiteSettings()
      .then(r => setSettings(r.data.settings))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const set = (field, value) => setSettings(s => ({ ...s, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateSiteSettings(settings);
      setSettings(res.data.settings);
      toast.success('Landing page updated! ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const uploadImage = async (file, field, ref) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Max 5MB');
    setUploading(field);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await API.post('/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set(field, res.data.url);
      toast.success('Image uploaded ✅');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(null);
      if (ref?.current) ref.current.value = '';
    }
  };

  if (loading) return <div className="spinner" />;

  const TABS = [
    { id: 'hero',     label: '🖼️ Hero',     icon: FiImage },
    { id: 'stats',    label: '📊 Stats',    icon: FiGrid },
    { id: 'programs', label: '🎓 Programs', icon: FiGrid },
    { id: 'campuses', label: '📍 Campuses', icon: FiImage },
    { id: 'about',    label: '🏛️ About',    icon: FiType },
    { id: 'announce', label: '📢 Banner',   icon: FiSpeaker },
    { id: 'contact',  label: '📞 Contact',  icon: FiType },
  ];

  return (
    <div className="fade-up" style={{ display:'flex', flexDirection:'column', gap:22, maxWidth:900 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="section-title">Landing Page Editor</h1>
          <p className="section-sub">Customize what visitors see on the public homepage</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <a href="/" target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
            <FiEye size={14}/> Preview
          </a>
          <button className="btn btn-gold" onClick={handleSave} disabled={saving}>
            <FiSave size={14}/> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, background:'var(--white)', border:'1px solid var(--gray-200)', borderRadius:'var(--radius-md)', padding:5, flexWrap:'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding:'9px 18px', border:'none', borderRadius:10, background:activeTab===t.id?'var(--navy)':'transparent', color:activeTab===t.id?'white':'var(--gray-600)', fontFamily:'var(--font-body)', fontWeight:600, fontSize:'.85rem', cursor:'pointer', transition:'var(--transition)', whiteSpace:'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Hero Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'hero' && (
        <div className="card" style={{ padding:28, display:'flex', flexDirection:'column', gap:0 }}>
          <h2 style={{ fontSize:'1rem', color:'var(--navy)', marginBottom:20 }}>🖼️ Hero Section</h2>

          {/* Logo */}
          <div className="form-group">
            <label className="form-label">Platform Logo</label>
            <div style={{ display:'flex', alignItems:'center', gap:14, padding:16, background:'var(--gray-100)', borderRadius:'var(--radius-md)', marginBottom:8 }}>
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" style={{ height:48, objectFit:'contain', borderRadius:8, background:'white', padding:6 }} />
              ) : (
                <div style={{ width:80, height:48, background:'var(--navy)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gold)', fontWeight:800, fontFamily:'var(--font-display)', fontSize:'1.1rem' }}>DUNIS</div>
              )}
              <div style={{ flex:1 }}>
                <input type="url" className="form-input" placeholder="Or paste an image URL..." value={settings.logoUrl || ''} onChange={e => set('logoUrl', e.target.value)} style={{ marginBottom:8 }} />
                <input type="file" accept="image/*" ref={logoImgRef} style={{ display:'none' }} onChange={e => uploadImage(e.target.files[0], 'logoUrl', logoImgRef)} />
                <button className="btn btn-outline btn-sm" onClick={() => logoImgRef.current?.click()} disabled={uploading === 'logoUrl'}>
                  <FiUploadCloud size={13}/> {uploading === 'logoUrl' ? 'Uploading…' : 'Upload Logo'}
                </button>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="form-group">
            <label className="form-label">Hero Background Image</label>
            <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
              {settings.heroImage && (
                <img src={settings.heroImage} alt="Hero" style={{ width:160, height:90, objectFit:'cover', borderRadius:10, flexShrink:0 }} />
              )}
              <div style={{ flex:1 }}>
                <input type="url" className="form-input" placeholder="Image URL or upload below" value={settings.heroImage || ''} onChange={e => set('heroImage', e.target.value)} style={{ marginBottom:8 }} />
                <input type="file" accept="image/*" ref={heroImgRef} style={{ display:'none' }} onChange={e => uploadImage(e.target.files[0], 'heroImage', heroImgRef)} />
                <button className="btn btn-outline btn-sm" onClick={() => heroImgRef.current?.click()} disabled={uploading === 'heroImage'}>
                  <FiUploadCloud size={13}/> {uploading === 'heroImage' ? 'Uploading…' : 'Upload Image'}
                </button>
              </div>
            </div>
          </div>

          {/* CTA Section background */}
          <div className="form-group">
            <label className="form-label">CTA Section Background Image</label>
            <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
              {settings.ctaBgImage && (
                <img src={settings.ctaBgImage} alt="CTA bg" style={{ width:160, height:90, objectFit:'cover', borderRadius:10, flexShrink:0 }} />
              )}
              <div style={{ flex:1 }}>
                <input type="url" className="form-input" placeholder="Image URL or upload below" value={settings.ctaBgImage || ''} onChange={e => set('ctaBgImage', e.target.value)} style={{ marginBottom:8 }} />
                <input type="file" accept="image/*" ref={ctaBgRef} style={{ display:'none' }} onChange={e => uploadImage(e.target.files[0], 'ctaBgImage', ctaBgRef)} />
                <button className="btn btn-outline btn-sm" onClick={() => ctaBgRef.current?.click()} disabled={uploading === 'ctaBgImage'}>
                  <FiUploadCloud size={13}/> {uploading === 'ctaBgImage' ? 'Uploading…' : 'Upload CTA Background'}
                </button>
              </div>
            </div>
          </div>
          {/* Hero text */}
          <div className="form-group">
            <label className="form-label">Hero Main Title</label>
            <input type="text" className="form-input" value={settings.heroTitle || ''} onChange={e => set('heroTitle', e.target.value)} placeholder="e.g. Learn Without Borders" />
          </div>
          <div className="form-group">
            <label className="form-label">Hero Subtitle / Description</label>
            <textarea className="form-input" rows={3} value={settings.heroSubtitle || ''} onChange={e => set('heroSubtitle', e.target.value)} style={{ resize:'vertical' }} />
          </div>
        </div>
      )}

      {/* ── Stats Tab ────────────────────────────────────────────────── */}
      {activeTab === 'stats' && (
        <div className="card" style={{ padding:28, display:'flex', flexDirection:'column', gap:0 }}>
          <h2 style={{ fontSize:'1rem', color:'var(--navy)', marginBottom:20 }}>📊 Statistics Bar</h2>
          <p style={{ fontSize:'.85rem', color:'var(--gray-600)', marginBottom:20 }}>These 4 numbers appear in the stats bar below the hero image.</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
            {[1,2,3,4].map(n => (
              <div key={n} style={{ background:'var(--gray-100)', padding:16, borderRadius:10 }}>
                <p style={{ fontSize:'.75rem', fontWeight:700, color:'var(--navy)', marginBottom:10, textTransform:'uppercase', letterSpacing:'.06em' }}>Stat {n}</p>
                <div className="form-group">
                  <label className="form-label">Value</label>
                  <input type="text" className="form-input" value={settings[`stat${n}Val`] || ''} onChange={e => set(`stat${n}Val`, e.target.value)} placeholder="e.g. 500+" />
                </div>
                <div className="form-group">
                  <label className="form-label">Label</label>
                  <input type="text" className="form-input" value={settings[`stat${n}Label`] || ''} onChange={e => set(`stat${n}Label`, e.target.value)} placeholder="e.g. Students" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── About Tab ────────────────────────────────────────────────── */}
      {activeTab === 'about' && (
        <div className="card" style={{ padding:28, display:'flex', flexDirection:'column', gap:0 }}>
          <h2 style={{ fontSize:'1rem', color:'var(--navy)', marginBottom:20 }}>🏛️ About / Campus Section</h2>

          {/* Campus image */}
          <div className="form-group">
            <label className="form-label">Campus Photo</label>
            <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
              {settings.campusImage && (
                <img src={settings.campusImage} alt="Campus" style={{ width:160, height:90, objectFit:'cover', borderRadius:10, flexShrink:0 }} />
              )}
              <div style={{ flex:1 }}>
                <input type="url" className="form-input" placeholder="Image URL..." value={settings.campusImage || ''} onChange={e => set('campusImage', e.target.value)} style={{ marginBottom:8 }} />
                <input type="file" accept="image/*" ref={campusImgRef} style={{ display:'none' }} onChange={e => uploadImage(e.target.files[0], 'campusImage', campusImgRef)} />
                <button className="btn btn-outline btn-sm" onClick={() => campusImgRef.current?.click()} disabled={uploading === 'campusImage'}>
                  <FiUploadCloud size={13}/> {uploading === 'campusImage' ? 'Uploading…' : 'Upload Photo'}
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Section Title</label>
            <input type="text" className="form-input" value={settings.aboutTitle || ''} onChange={e => set('aboutTitle', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Description Text</label>
            <textarea className="form-input" rows={4} value={settings.aboutText || ''} onChange={e => set('aboutText', e.target.value)} style={{ resize:'vertical' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Footer Tagline</label>
            <input type="text" className="form-input" value={settings.footerTagline || ''} onChange={e => set('footerTagline', e.target.value)} placeholder="e.g. Beyond Boundaries, Go Further" />
          </div>
        </div>
      )}

      {/* ── Announcement Banner Tab ──────────────────────────────────── */}
      {activeTab === 'announce' && (
        <div className="card" style={{ padding:28, display:'flex', flexDirection:'column', gap:0 }}>
          <h2 style={{ fontSize:'1rem', color:'var(--navy)', marginBottom:20 }}>📢 Announcement Banner</h2>
          <p style={{ fontSize:'.85rem', color:'var(--gray-600)', marginBottom:20 }}>Show a banner at the top of the landing page for important announcements.</p>

          <div className="form-group">
            <label className="form-label">Show Banner?</label>
            <div style={{ display:'flex', gap:10 }}>
              {[{val:true,label:'✅ Active'},{val:false,label:'Hidden'}].map(opt => (
                <button key={String(opt.val)} type="button"
                  onClick={() => set('announcementActive', opt.val)}
                  style={{ padding:'10px 22px', border:`2px solid ${settings.announcementActive === opt.val ? 'var(--navy)' : 'var(--gray-200)'}`, borderRadius:10, background:settings.announcementActive === opt.val ? 'var(--navy)' : 'transparent', color:settings.announcementActive === opt.val ? 'white' : 'var(--gray-600)', fontFamily:'var(--font-body)', fontWeight:600, fontSize:'.875rem', cursor:'pointer', transition:'var(--transition)' }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Announcement Text</label>
            <input type="text" className="form-input" value={settings.announcementText || ''} onChange={e => set('announcementText', e.target.value)} placeholder="e.g. 🎓 Inscriptions ouvertes pour 2024-2025 — Places limitées!" />
          </div>
          <div className="form-group">
            <label className="form-label">Banner Color</label>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {['#c8a84b','#0b1e3d','#10b981','#3b82f6','#e11d48','#7c3aed'].map(color => (
                <button key={color} type="button" onClick={() => set('announcementColor', color)}
                  style={{ width:36, height:36, borderRadius:8, background:color, border:settings.announcementColor === color ? '3px solid var(--navy)' : '2px solid transparent', cursor:'pointer', boxShadow:settings.announcementColor === color ? '0 0 0 2px white, 0 0 0 4px '+color : 'none' }} />
              ))}
            </div>
          </div>

          {/* Preview */}
          {settings.announcementActive && settings.announcementText && (
            <div style={{ padding:'10px 20px', background:settings.announcementColor, borderRadius:8, color:settings.announcementColor === '#c8a84b' || settings.announcementColor === '#10b981' || settings.announcementColor === '#3b82f6' ? 'white' : 'white', fontSize:'.875rem', fontWeight:600, textAlign:'center' }}>
              {settings.announcementText}
            </div>
          )}
        </div>
      )}

      {/* ── Contact Tab ──────────────────────────────────────────────── */}
      {activeTab === 'contact' && (
        <div className="card" style={{ padding:28, display:'flex', flexDirection:'column', gap:0 }}>
          <h2 style={{ fontSize:'1rem', color:'var(--navy)', marginBottom:20 }}>📞 Campus Contact Information</h2>
          {[
            { field:'contactDakar',   label:'🇸🇳 Dakar, Senegal' },
            { field:'contactAbidjan', label:'🇨🇮 Abidjan, Côte d\'Ivoire' },
            { field:'contactDouala',  label:'🇨🇲 Douala, Cameroon' },
            { field:'contactBanjul',  label:'🇬🇲 Banjul, Gambia' },
          ].map(c => (
            <div key={c.field} className="form-group">
              <label className="form-label">{c.label}</label>
              <input type="text" className="form-input" value={settings[c.field] || ''} onChange={e => set(c.field, e.target.value)} placeholder="+xxx xx xxx xx xx" />
            </div>
          ))}
        </div>
      )}

      {/* ── PROGRAMS TAB ──────────────────────────────────────────── */}
      {activeTab === 'programs' && (
        <div className="card" style={{padding:28}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
            <h2 style={{fontSize:'1rem',color:'var(--navy)'}}>🎓 Academic Programs</h2>
            <button className="btn btn-navy btn-sm" onClick={() => {
              const current = settings.programs || [];
              set('programs', [...current, {...newProg, campuses:[...newProg.campuses]}]);
              setNewProg({ title:'', badge:'', sub:'', color:'#d0aa31', campuses:[], imageUrl:'', active:true });
              toast.success('Program added — save to apply');
            }}><FiImage size={13}/> Add Program</button>
          </div>
          {/* Add program form */}
          <div style={{background:'rgba(208,170,49,.05)',border:'1px solid rgba(208,170,49,.15)',borderRadius:10,padding:18,marginBottom:20}}>
            <p style={{fontSize:'.8rem',fontWeight:700,color:'var(--navy)',marginBottom:12}}>New Program</p>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Title</label><input type="text" className="form-input" placeholder="Computer Science" value={newProg.title} onChange={e=>setNewProg(s=>({...s,title:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">Badge</label><input type="text" className="form-input" placeholder="2+2" style={{maxWidth:80}} value={newProg.badge} onChange={e=>setNewProg(s=>({...s,badge:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">Color</label><input type="color" className="form-input" style={{padding:4,height:42}} value={newProg.color} onChange={e=>setNewProg(s=>({...s,color:e.target.value}))}/></div>
            </div>
            <div className="form-group"><label className="form-label">Subtitle</label><input type="text" className="form-input" placeholder="2 yrs DUNIS + 2 yrs USA" value={newProg.sub} onChange={e=>setNewProg(s=>({...s,sub:e.target.value}))}/></div>
            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input type="url" className="form-input" placeholder="https://..." value={newProg.imageUrl} onChange={e=>setNewProg(s=>({...s,imageUrl:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Campuses</label>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {['Dakar','Abidjan','Douala','Banjul'].map(campus => (
                  <label key={campus} style={{display:'flex',alignItems:'center',gap:5,cursor:'pointer',padding:'5px 12px',border:`1.5px solid ${newProg.campuses.includes(campus)?'var(--navy)':'var(--gray-200)'}`,borderRadius:8,background:newProg.campuses.includes(campus)?'var(--navy)':'transparent',color:newProg.campuses.includes(campus)?'white':'var(--gray-600)',fontSize:'.8rem',fontWeight:600,transition:'all .2s'}}>
                    <input type="checkbox" style={{display:'none'}} checked={newProg.campuses.includes(campus)} onChange={e=>{const camps=e.target.checked?[...newProg.campuses,campus]:newProg.campuses.filter(c=>c!==campus);setNewProg(s=>({...s,campuses:camps}));}}/>
                    {campus}
                  </label>
                ))}
              </div>
            </div>
          </div>
          {/* Existing programs */}
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {(settings.programs||[]).map((p,i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px',background:'var(--gray-100)',borderRadius:10,borderLeft:`3px solid ${p.color||'var(--gold)'}`}}>
                {p.imageUrl && <img src={p.imageUrl} alt={p.title} style={{width:48,height:36,objectFit:'cover',borderRadius:6,flexShrink:0}}/>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:3}}>
                    <span style={{background:p.color||'var(--gold)',color:'white',fontSize:'.65rem',fontWeight:800,padding:'2px 8px',borderRadius:999}}>{p.badge}</span>
                    <p style={{fontWeight:700,fontSize:'.875rem',color:'var(--navy)'}}>{p.title}</p>
                  </div>
                  <p style={{fontSize:'.75rem',color:'var(--gray-500)'}}>{p.sub} · {(p.campuses||[]).join(', ')}</p>
                </div>
                <button className="btn btn-danger btn-sm" onClick={()=>set('programs',(settings.programs||[]).filter((_,j)=>j!==i))}>
                  <FiImage size={11}/>✕
                </button>
              </div>
            ))}
            {(!settings.programs||settings.programs.length===0) && <p style={{fontSize:'.82rem',color:'var(--gray-400)',fontStyle:'italic',padding:'10px 0'}}>No custom programs — defaults will be shown</p>}
          </div>
        </div>
      )}

      {/* ── CAMPUS IMAGES TAB ──────────────────────────────────────── */}
      {activeTab === 'campuses' && (
        <div className="card" style={{padding:28,display:'flex',flexDirection:'column',gap:0}}>
          <h2 style={{fontSize:'1rem',color:'var(--navy)',marginBottom:20}}>📍 Campus Images</h2>
          <p style={{fontSize:'.82rem',color:'var(--gray-500)',marginBottom:20}}>Upload a photo for each campus. These appear in the campus section of the landing page.</p>
          {[
            {key:'campusDakarImage',   label:'🇸🇳 Dakar, Senegal'},
            {key:'campusAbidjanImage', label:"🇨🇮 Abidjan, Côte d'Ivoire"},
            {key:'campusDoualaImage',  label:'🇨🇲 Douala, Cameroon'},
            {key:'campusBanjulImage',  label:'🇬🇲 Banjul, Gambia'},
          ].map(({key, label}) => (
            <div key={key} className="form-group">
              <label className="form-label">{label}</label>
              <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                {settings[key] && <img src={settings[key]} alt={label} style={{width:140,height:80,objectFit:'cover',borderRadius:8,flexShrink:0}}/>}
                <div style={{flex:1}}>
                  <input type="url" className="form-input" placeholder="Image URL or upload below" value={settings[key]||''} onChange={e=>set(key,e.target.value)} style={{marginBottom:6}}/>
                  <label className="btn btn-outline btn-sm" style={{cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6}}>
                    <FiImage size={13}/> Upload Photo
                    <input type="file" accept="image/*" style={{display:'none'}} onChange={async e=>{
                      const file=e.target.files?.[0]; if(!file) return;
                      setUploading(key);
                      try{const fd=new FormData();fd.append('image',file);const res=await API.post('/media/upload',fd,{headers:{'Content-Type':'multipart/form-data'}});set(key,res.data.url);toast.success('Uploaded ✅');}
                      catch{toast.error('Upload failed');}
                      finally{setUploading(null);e.target.value='';}
                    }}/>
                  </label>
                  {uploading===key && <span style={{fontSize:'.78rem',color:'var(--gray-500)',marginLeft:10}}>Uploading…</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save button at bottom */}
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button className="btn btn-gold btn-lg" onClick={handleSave} disabled={saving}>
          <FiSave size={16}/> {saving ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
