import React, { useState, useEffect, useRef } from 'react';
import { getSiteSettings, updateSiteSettings, sendChatMessage } from '../../utils/api';
import toast from 'react-hot-toast';

const CATS = ['General', 'Admissions', 'Programs', 'Platform', 'Payments', 'Campus', 'Technical'];
const EMPTY_FAQ = { question:'', answer:'', category:'General', active:true };

export default function ChatbotManager() {
  const [settings,  setSettings]  = useState(null);
  const [faqItems,  setFaqItems]  = useState([]);
  const [prompt,    setPrompt]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [tab,       setTab]       = useState('faq');

  // FAQ editing
  const [editIdx,   setEditIdx]   = useState(null);
  const [newFaq,    setNewFaq]    = useState(EMPTY_FAQ);
  const [showAdd,   setShowAdd]   = useState(false);
  const [search,    setSearch]    = useState('');

  // Live chat test
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput,   setChatInput]   = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef();

  useEffect(() => {
    getSiteSettings()
      .then(r => {
        const s = r.data.settings;
        setSettings(s);
        setFaqItems(s.faqItems || []);
        setPrompt(s.chatbotSystemPrompt || '');
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const save = async (extraData = {}) => {
    setSaving(true);
    try {
      const res = await updateSiteSettings({
        ...settings,
        faqItems,
        chatbotSystemPrompt: prompt,
        ...extraData,
      });
      setSettings(res.data.settings);
      toast.success('Saved ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const addFaq = () => {
    if (!newFaq.question.trim()) return toast.error('Question is required');
    if (!newFaq.answer.trim())   return toast.error('Answer is required');
    setFaqItems(prev => [...prev, { ...newFaq }]);
    setNewFaq(EMPTY_FAQ);
    setShowAdd(false);
    toast.success('FAQ added — click Save to apply');
  };

  const removeFaq    = (i)       => setFaqItems(prev => prev.filter((_,j) => j!==i));
  const toggleFaq    = (i)       => setFaqItems(prev => prev.map((f,j) => j===i ? {...f,active:!f.active} : f));
  const updateFaq    = (i,k,v)   => setFaqItems(prev => prev.map((f,j) => j===i ? {...f,[k]:v} : f));

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput('');
    const newHistory = [...chatHistory, { role:'user', content:msg }];
    setChatHistory(newHistory);
    setChatLoading(true);
    try {
      const res = await sendChatMessage({ message: msg, history: chatHistory });
      setChatHistory(prev => [...prev, { role:'assistant', content: res.data.message }]);
    } catch {
      setChatHistory(prev => [...prev, { role:'assistant', content:'⚠️ AI unavailable. Check ANTHROPIC_API_KEY.' }]);
    } finally { setChatLoading(false); }
  };

  const filteredFaq = faqItems.filter(f =>
    !search || f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase())
  );
  const activeCount = faqItems.filter(f => f.active).length;

  if (loading) return <div className="spinner"/>;

  const TABS = [
    { id:'faq',     icon:'fa-circle-question', label:'FAQ Items',      badge: `${activeCount} active` },
    { id:'prompt',  icon:'fa-terminal',         label:'System Prompt',  badge: null },
    { id:'test',    icon:'fa-robot',            label:'Test Chatbot',   badge: null },
  ];

  return (
    <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:20,maxWidth:900}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h1 className="section-title">AI Chatbot Manager</h1>
          <p className="section-sub">Configure the DUNIS AI assistant · {activeCount} active FAQ items</p>
        </div>
        <button className="btn btn-gold" onClick={() => save()} disabled={saving}>
          <i className="fa-solid fa-floppy-disk"/> {saving ? 'Saving…' : 'Save All'}
        </button>
      </div>

      {/* How it works banner */}
      <div style={{padding:'12px 18px',background:'rgba(208,170,49,.08)',border:'1px solid rgba(208,170,49,.2)',borderRadius:10,display:'flex',gap:12,alignItems:'flex-start'}}>
        <i className="fa-solid fa-lightbulb" style={{color:'var(--gold)',fontSize:18,marginTop:2,flexShrink:0}}/>
        <div style={{fontSize:'.83rem',color:'#7a5c10',lineHeight:1.7}}>
          <strong>How it works:</strong> The FAQ items you add here are automatically injected into the AI's context.
          When a student asks a question, the AI uses your FAQ answers as its primary knowledge source.
          Use the System Prompt to customize personality and tone. Test everything in the Test tab before saving.
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,background:'white',border:'1px solid var(--gray-200)',borderRadius:'var(--radius-md)',padding:5,flexWrap:'wrap'}}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{padding:'9px 18px',border:'none',borderRadius:10,background:tab===t.id?'var(--navy)':'transparent',color:tab===t.id?'white':'var(--gray-600)',fontFamily:'var(--font-body)',fontWeight:600,fontSize:'.875rem',cursor:'pointer',transition:'all .2s',display:'flex',alignItems:'center',gap:8,whiteSpace:'nowrap'}}>
            <i className={`fa-solid ${t.icon}`} style={{fontSize:'.85rem'}}/>
            {t.label}
            {t.badge && <span style={{background:tab===t.id?'rgba(255,255,255,.2)':'rgba(208,170,49,.2)',color:tab===t.id?'white':'#7a5c10',fontSize:'.65rem',fontWeight:700,padding:'2px 8px',borderRadius:999}}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ════ FAQ ITEMS TAB ═══════════════════════════════════════════ */}
      {tab === 'faq' && (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>

          {/* Toolbar */}
          <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
            <div style={{position:'relative',flex:1,minWidth:200}}>
              <i className="fa-solid fa-magnifying-glass" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--gray-400)',fontSize:'.85rem'}}/>
              <input type="text" className="form-input" style={{paddingLeft:36}} placeholder="Search FAQ…" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <button className="btn btn-navy" onClick={() => setShowAdd(v=>!v)}>
              <i className="fa-solid fa-plus"/> {showAdd ? 'Cancel' : 'Add FAQ'}
            </button>
          </div>

          {/* Add FAQ form */}
          {showAdd && (
            <div className="card" style={{padding:22,background:'rgba(208,170,49,.04)',border:'1px solid rgba(208,170,49,.2) !important'}}>
              <h3 style={{fontSize:'.9rem',color:'var(--navy)',marginBottom:16,fontWeight:700}}>
                <i className="fa-solid fa-plus" style={{color:'var(--gold)',marginRight:8}}/> New FAQ Item
              </h3>
              <div className="form-group">
                <label className="form-label">Question *</label>
                <input type="text" className="form-input" placeholder="What programs does DUNIS offer?" value={newFaq.question} onChange={e=>setNewFaq(s=>({...s,question:e.target.value}))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Answer *</label>
                <textarea className="form-input" rows={4} style={{resize:'vertical'}} placeholder="DUNIS offers 2+2 programs in Business, Computer Science…" value={newFaq.answer} onChange={e=>setNewFaq(s=>({...s,answer:e.target.value}))}/>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={newFaq.category} onChange={e=>setNewFaq(s=>({...s,category:e.target.value}))}>
                    {CATS.map(cat => <option key={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:'flex',gap:10,paddingTop:12,borderTop:'1px solid var(--gray-200)'}}>
                <button className="btn btn-gold" onClick={addFaq}><i className="fa-solid fa-check"/> Add</button>
                <button className="btn btn-outline" onClick={()=>setShowAdd(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Category groups */}
          {filteredFaq.length === 0 && !showAdd && (
            <div className="empty-state card" style={{padding:48}}>
              <i className="fa-solid fa-circle-question" style={{fontSize:40,color:'var(--gray-300)'}}/>
              <h3>No FAQ items yet</h3>
              <p>Add questions and answers to teach the AI how to respond to students</p>
              <button className="btn btn-navy btn-sm" onClick={()=>setShowAdd(true)}>Add First FAQ</button>
            </div>
          )}

          {CATS.map(cat => {
            const items = filteredFaq.filter(f => f.category === cat);
            if (!items.length) return null;
            const origIndexes = items.map(item => faqItems.indexOf(item));
            return (
              <div key={cat}>
                <p style={{fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.12em',color:'var(--gold)',marginBottom:8}}>
                  {cat} ({items.length})
                </p>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {items.map((item, ii) => {
                    const origIdx = origIndexes[ii];
                    return (
                      <div key={origIdx} className="card" style={{padding:0,overflow:'hidden',borderLeft:`3px solid ${item.active?'var(--gold)':'var(--gray-200)'}`,opacity:item.active?1:.65}}>
                        {editIdx === origIdx ? (
                          <div style={{padding:18,display:'flex',flexDirection:'column',gap:10}}>
                            <input type="text" className="form-input" value={item.question} placeholder="Question" onChange={e=>updateFaq(origIdx,'question',e.target.value)}/>
                            <textarea className="form-input" rows={3} style={{resize:'vertical'}} value={item.answer} placeholder="Answer" onChange={e=>updateFaq(origIdx,'answer',e.target.value)}/>
                            <div style={{display:'flex',gap:8,alignItems:'center'}}>
                              <select className="form-input" style={{flex:1,maxWidth:200}} value={item.category} onChange={e=>updateFaq(origIdx,'category',e.target.value)}>
                                {CATS.map(cat => <option key={cat}>{cat}</option>)}
                              </select>
                              <button className="btn btn-gold btn-sm" onClick={()=>setEditIdx(null)}><i className="fa-solid fa-check"/> Done</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{display:'flex',alignItems:'flex-start',gap:14,padding:'14px 16px'}}>
                            <div style={{flex:1,minWidth:0}}>
                              <p style={{fontWeight:700,fontSize:'.875rem',color:'var(--navy)',marginBottom:5}}>Q: {item.question}</p>
                              <p style={{fontSize:'.83rem',color:'var(--gray-600)',lineHeight:1.65}}>A: {item.answer}</p>
                            </div>
                            <div style={{display:'flex',gap:5,flexShrink:0}}>
                              <button title="Edit" className="btn btn-outline btn-sm" onClick={()=>setEditIdx(origIdx)}><i className="fa-solid fa-pen" style={{fontSize:11}}/></button>
                              <button title={item.active?'Deactivate':'Activate'}
                                onClick={()=>toggleFaq(origIdx)}
                                style={{padding:'6px 8px',border:`1px solid ${item.active?'#10b981':'var(--gray-200)'}`,borderRadius:6,background:item.active?'rgba(16,185,129,.1)':'transparent',color:item.active?'#059669':'var(--gray-400)',cursor:'pointer',transition:'all .2s'}}>
                                <i className={`fa-solid ${item.active?'fa-toggle-on':'fa-toggle-off'}`} style={{fontSize:14}}/>
                              </button>
                              <button title="Delete" className="btn btn-danger btn-sm" onClick={()=>removeFaq(origIdx)}><i className="fa-solid fa-trash" style={{fontSize:11}}/></button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════ SYSTEM PROMPT TAB ════════════════════════════════════════ */}
      {tab === 'prompt' && (
        <div className="card" style={{padding:28,display:'flex',flexDirection:'column',gap:0}}>
          <div style={{marginBottom:16}}>
            <h2 style={{fontSize:'.95rem',fontWeight:700,color:'var(--navy)',marginBottom:4}}>
              <i className="fa-solid fa-terminal" style={{color:'var(--gold)',marginRight:8}}/>System Prompt
            </h2>
            <p style={{fontSize:'.82rem',color:'var(--gray-500)',lineHeight:1.7}}>
              Define the AI assistant's personality, language, and focus areas. The FAQ items are appended automatically — no need to repeat them here.
              Leave empty to use the default DUNIS assistant prompt.
            </p>
          </div>
          <textarea
            className="form-input"
            rows={16}
            style={{resize:'vertical',fontFamily:'monospace',fontSize:'.85rem',lineHeight:1.65}}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={`Example system prompt:

You are the DUNIS Africa Academic Assistant — a friendly, knowledgeable AI tutor for students and teachers of DUNIS Africa (Dakar University of International Studies).

Your role:
- Answer questions about courses, programs, campuses, and the platform
- Help students understand their lessons
- Respond in the same language as the student (English or French)
- Be encouraging, clear, and concise

DUNIS Africa campuses: Dakar (Senegal), Abidjan (Ivory Coast), Douala (Cameroon), Banjul (Gambia).

Always refer students to their teacher or admin for official decisions.`}
          />
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:16,paddingTop:14,borderTop:'1px solid var(--gray-200)'}}>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-outline btn-sm" onClick={() => setPrompt('')}>
                <i className="fa-solid fa-rotate-left"/> Reset to Default
              </button>
            </div>
            <button className="btn btn-gold" onClick={() => save()} disabled={saving}>
              <i className="fa-solid fa-floppy-disk"/> {saving ? 'Saving…' : 'Save Prompt'}
            </button>
          </div>
        </div>
      )}

      {/* ════ TEST CHATBOT TAB ══════════════════════════════════════════ */}
      {tab === 'test' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="card" style={{padding:0,overflow:'hidden',display:'flex',flexDirection:'column',height:520}}>
            {/* Chat header */}
            <div style={{padding:'14px 18px',background:'linear-gradient(135deg,var(--navy),#1a1a1a)',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
              <div style={{width:38,height:38,borderRadius:10,background:'rgba(208,170,49,.2)',border:'1px solid rgba(208,170,49,.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <i className="fa-solid fa-robot" style={{color:'var(--gold)',fontSize:16}}/>
              </div>
              <div>
                <p style={{color:'white',fontWeight:700,fontSize:'.9rem'}}>DUNIS AI Assistant</p>
                <p style={{color:'rgba(255,255,255,.5)',fontSize:'.72rem'}}>{activeCount} FAQ items active · Test your chatbot configuration</p>
              </div>
              <button
                className="btn btn-outline btn-sm"
                style={{marginLeft:'auto',borderColor:'rgba(255,255,255,.2)',color:'rgba(255,255,255,.7)'}}
                onClick={() => setChatHistory([])}
              >
                <i className="fa-solid fa-broom"/> Clear
              </button>
            </div>

            {/* Messages */}
            <div style={{flex:1,overflowY:'auto',padding:'18px',display:'flex',flexDirection:'column',gap:12,background:'#f9f9f9'}}>
              {chatHistory.length === 0 && (
                <div style={{textAlign:'center',padding:'40px 20px',color:'var(--gray-400)'}}>
                  <i className="fa-solid fa-comments" style={{fontSize:40,marginBottom:12,display:'block',color:'var(--gray-300)'}}/>
                  <p style={{fontWeight:600,color:'var(--gray-500)',marginBottom:4}}>Test the chatbot</p>
                  <p style={{fontSize:'.82rem'}}>Try questions like "What programs do you offer?" or "How do I enroll?"</p>
                  <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',marginTop:16}}>
                    {['What programs are available?','How do I submit an assignment?','Tell me about Dakar campus'].map(q => (
                      <button key={q} className="btn btn-outline btn-sm" style={{fontSize:'.78rem'}} onClick={() => { setChatInput(q); }}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} style={{display:'flex',justifyContent:msg.role==='user'?'flex-end':'flex-start',gap:10,alignItems:'flex-end'}}>
                  {msg.role === 'assistant' && (
                    <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,var(--navy),#1a1a1a)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <i className="fa-solid fa-robot" style={{color:'var(--gold)',fontSize:12}}/>
                    </div>
                  )}
                  <div style={{
                    maxWidth:'75%',
                    padding:'10px 15px',
                    borderRadius: msg.role==='user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role==='user' ? 'var(--navy)' : 'white',
                    color: msg.role==='user' ? 'white' : 'var(--navy)',
                    fontSize:'.875rem',
                    lineHeight:1.65,
                    boxShadow:'0 2px 8px rgba(0,0,0,.06)',
                    whiteSpace:'pre-wrap',
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{display:'flex',gap:10,alignItems:'center'}}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,var(--navy),#1a1a1a)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <i className="fa-solid fa-robot" style={{color:'var(--gold)',fontSize:12}}/>
                  </div>
                  <div style={{padding:'12px 16px',background:'white',borderRadius:'16px 16px 16px 4px',display:'flex',gap:5,boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
                    {[0,1,2].map(n => (
                      <div key={n} style={{width:8,height:8,borderRadius:'50%',background:'var(--gray-300)',animation:`bounce .8s ${n*0.15}s ease-in-out infinite`}}/>
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>

            {/* Input */}
            <div style={{padding:'12px 16px',borderTop:'1px solid var(--gray-200)',display:'flex',gap:10,background:'white',flexShrink:0}}>
              <input
                type="text"
                className="form-input"
                style={{flex:1}}
                placeholder="Ask a question to test the chatbot…"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !chatLoading && sendChat()}
                disabled={chatLoading}
              />
              <button className="btn btn-gold" onClick={sendChat} disabled={chatLoading || !chatInput.trim()} style={{flexShrink:0}}>
                <i className="fa-solid fa-paper-plane"/>
              </button>
            </div>
          </div>

          <div style={{padding:'12px 16px',background:'rgba(59,130,246,.06)',border:'1px solid rgba(59,130,246,.15)',borderRadius:8,fontSize:'.78rem',color:'#1d4ed8',lineHeight:1.7}}>
            <i className="fa-solid fa-circle-info" style={{marginRight:6}}/>
            <strong>Note:</strong> This test uses your current saved configuration. Save your FAQ items and system prompt first,
            then test here to see how students will experience the chatbot.
          </div>
        </div>
      )}

      {/* Bottom save */}
      <div style={{display:'flex',justifyContent:'flex-end'}}>
        <button className="btn btn-gold btn-lg" onClick={() => save()} disabled={saving}>
          <i className="fa-solid fa-floppy-disk"/> {saving ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: .5; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
