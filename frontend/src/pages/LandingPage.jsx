import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DunisLogo from '../components/DunisLogo/DunisLogo';
import { getSiteSettings } from '../utils/api';
import imgCampus   from '../assets/images/campus-dakar.jpg';
import imgCS       from '../assets/images/slide-cs-banner.png';
import imgBusiness from '../assets/images/slide-business-banner.png';
import imgBBA      from '../assets/images/slide-bba-fhsu.png';
import imgBanner   from '../assets/images/banner-business.jpg';
import './LandingPage.css';

const DEFAULT = {
  heroTitle:    'Learn Without Borders',
  heroSubtitle: 'The official e-learning platform of DUNIS Africa — connecting students and teachers across Dakar, Abidjan, Douala and Banjul.',
  heroImage:    '',
  logoUrl:      '',
  aboutTitle:   'Dakar University of International Studies',
  aboutText:    'Founded in 2019 in partnership with Fort Hays State University (USA), DUNIS Africa offers world-class education with a uniquely African perspective. Study locally, graduate globally.',
  campusImage:  '', campusDakarImage:'', campusAbidjanImage:'', campusDoualaImage:'', campusBanjulImage:'',
  stat1Val:'4', stat1Label:'Campuses',
  stat2Val:'21+', stat2Label:'Partner Universities',
  stat3Val:'500+', stat3Label:'Students',
  stat4Val:'2+2', stat4Label:'Study Model',
  announcementActive:false, announcementText:'', announcementColor:'#d0aa31',
  contactDakar:'+221 77 864 94 94', contactAbidjan:'+225 07 69 12 02 47',
  contactDouala:'+237 6 95 56 37 37', contactBanjul:'+220 401 2475',
  footerTagline:'Beyond Boundaries, Go Further',
  ctaBgImage:'',
  programs:[],
};

const DEFAULT_PROGRAMS = [
  { img:imgCS,       badge:'2+2',   color:'#2563eb', title:'Computer Science',        sub:'2 yrs DUNIS + 2 yrs USA',    campuses:['Dakar','Douala'] },
  { img:imgBusiness, badge:'2+2',   color:'#d0aa31', title:'Business Administration', sub:'2 yrs DUNIS + 2 yrs Abroad', campuses:['Dakar','Abidjan','Douala'] },
  { img:imgBBA,      badge:'BBA-4', color:'#dc2626', title:'BBA — FHSU',              sub:'4 yrs Dakar → US Degree',    campuses:['Dakar'] },
  { img:imgCampus,   badge:'1+1',   color:'#059669', title:'MBA — Business',          sub:'1 yr DUNIS + 1 yr Abroad',   campuses:['Dakar','Abidjan'] },
];

const CAMPUSES_INFO = [
  { flag:'🇸🇳', name:'Dakar',    country:'Senegal',       key:'Dakar',    imgKey:'campusDakarImage',   desc:'Main campus · Historic heart of DUNIS Africa', contact:'+221 77 864 94 94' },
  { flag:'🇨🇮', name:'Abidjan',  country:'Côte d\'Ivoire', key:'Abidjan',  imgKey:'campusAbidjanImage', desc:'West Africa hub · Business & Management focus', contact:'+225 07 69 12 02 47' },
  { flag:'🇨🇲', name:'Douala',   country:'Cameroon',       key:'Douala',   imgKey:'campusDoualaImage',  desc:'Central Africa campus · Tech & Engineering',    contact:'+237 6 95 56 37 37' },
  { flag:'🇬🇲', name:'Banjul',   country:'Gambia',         key:'Banjul',   imgKey:'campusBanjulImage',  desc:'The Smiling Coast campus · Growing community', contact:'+220 401 2475' },
];

const PLATFORM_FEATURES = [
  { icon:'fa-video',           img:'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=400&q=80', title:'Live Virtual Classes',    desc:'Google Meet, Zoom or Teams — scheduled, recorded, and available for replay.' },
  { icon:'fa-photo-film',      img:'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80', title:'Video & PDF Lessons',     desc:'HD videos and downloadable PDFs accessible anytime, at your own pace.' },
  { icon:'fa-clipboard-list',  img:'https://images.unsplash.com/photo-1434030216411-0b793f4b6f62?w=400&q=80', title:'Assignments & Grading',   desc:'Submit work online. Receive detailed feedback and scores from your teacher.' },
  { icon:'fa-circle-question', img:'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400&q=80', title:'Auto-graded Quizzes',    desc:'Timed quizzes with instant results, pass/fail status, and answer explanations.' },
  { icon:'fa-certificate',     img:'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&q=80', title:'Verified Certificates',   desc:'Auto-generated DUNIS certificates with unique IDs you can share and verify.' },
];

export default function LandingPage() {
  const [s, setS]           = useState(DEFAULT);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [activeCampus, setActiveCampus] = useState(0);

  useEffect(() => {
    getSiteSettings().then(r => setS({ ...DEFAULT, ...r.data.settings })).catch(() => {});
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      ['programs','features','campuses'].forEach(sec => {
        const el = document.getElementById(sec);
        if (el && window.scrollY >= el.offsetTop - 120) setActiveSection(sec);
      });
    };
    window.addEventListener('scroll', onScroll, { passive:true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const heroImg  = s.heroImage  || imgCampus;
  const ctaBg    = s.ctaBgImage || imgBanner;
  const stats    = [
    { val:s.stat1Val, lbl:s.stat1Label },
    { val:s.stat2Val, lbl:s.stat2Label },
    { val:s.stat3Val, lbl:s.stat3Label },
    { val:s.stat4Val, lbl:s.stat4Label },
  ];

  // Programs: use admin-managed ones if available, else defaults
  const programs = s.programs?.filter(p => p.active !== false).length > 0
    ? s.programs.filter(p => p.active !== false)
    : DEFAULT_PROGRAMS;

  const scrollTo = id => { document.getElementById(id)?.scrollIntoView({ behavior:'smooth' }); setMenuOpen(false); };

  return (
    <div className="lp">

      {/* ── Announcement ─────────────────────────────────── */}
      {s.announcementActive && s.announcementText && (
        <div className="lp-announce" style={{ background:s.announcementColor }}>
          <span>{s.announcementText}</span>
          <Link to="/login" className="lp-announce-cta">Sign In →</Link>
        </div>
      )}

      {/* ── Navbar ───────────────────────────────────────── */}
      <header className={`lp-nav ${scrolled?'lp-nav--solid':''} ${s.announcementActive&&s.announcementText?'lp-nav--offset':''}`}>
        <div className="lp-nav__inner">
          <Link to="/" className="lp-nav__logo">
            {s.logoUrl
              ? <img src={s.logoUrl} alt="DUNIS" className="lp-custom-logo"/>
              : <DunisLogo size="sm" variant="white"/>
            }
          </Link>
          <nav className={`lp-nav__links ${menuOpen?'lp-nav__links--open':''}`}>
            {[{id:'programs',label:'Programs'},{id:'features',label:'Platform'},{id:'campuses',label:'Campus'}].map(item => (
              <button key={item.id} className={`lp-nav-link ${activeSection===item.id?'active':''}`} onClick={()=>scrollTo(item.id)}>
                {item.label}
              </button>
            ))}
            <Link to="/login" className="lp-nav-signin" onClick={()=>setMenuOpen(false)}>Sign In</Link>
          </nav>
          <button className={`lp-burger ${menuOpen?'open':''}`} onClick={()=>setMenuOpen(v=>!v)}>
            <span/><span/><span/>
          </button>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero__parallax" style={{ backgroundImage:`url(${heroImg})` }}/>
        <div className="lp-hero__gradient"/>
        <div className="lp-hero__content">
          <div className="lp-hero__eyebrow">
            <span className="lp-eyebrow-dot"/>
            Official E-Learning Platform · DUNIS Africa
          </div>
          <h1 className="lp-hero__title">
            {s.heroTitle.includes(' ')
              ? <>{s.heroTitle.split(' ').slice(0,-1).join(' ')}{' '}<em>{s.heroTitle.split(' ').slice(-1)[0]}</em></>
              : s.heroTitle
            }
          </h1>
          <p className="lp-hero__sub">{s.heroSubtitle}</p>
          <div className="lp-hero__actions">
            <Link to="/login" className="lp-btn lp-btn--gold">
              <i className="fa-solid fa-arrow-right-to-bracket"/> Sign In
            </Link>
            <button className="lp-btn lp-btn--glass" onClick={()=>scrollTo('programs')}>
              <i className="fa-solid fa-graduation-cap"/> Our Programs
            </button>
          </div>
        </div>
        <div className="lp-hero__stats">
          {stats.map((st,i) => (
            <div key={i} className="lp-hero__stat">
              <span className="lp-hero__stat-val">{st.val}</span>
              <span className="lp-hero__stat-lbl">{st.lbl}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROGRAMS ─────────────────────────────────────── */}
      <section className="lp-section lp-section--white" id="programs">
        <div className="lp-container">
          <div className="lp-sh">
            <div className="lp-sh__eyebrow">Academic Programs</div>
            <h2>Start in Africa.<br/><span className="lp-text-gold">Finish Abroad.</span></h2>
            <p>Our unique 2+2 model: 2 years at DUNIS Africa, then 2 years at one of our 21+ partner universities worldwide to earn your international degree.</p>
          </div>
          <div className="lp-programs">
            {programs.map((p, i) => (
              <article key={i} className="lp-prog" style={{'--pc': p.color || '#d0aa31'}}>
                <div className="lp-prog__media">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.title} loading="lazy"/>
                    : DEFAULT_PROGRAMS[i % DEFAULT_PROGRAMS.length]?.img
                      ? <img src={DEFAULT_PROGRAMS[i % DEFAULT_PROGRAMS.length].img} alt={p.title} loading="lazy"/>
                      : <div style={{width:'100%',height:'100%',background:`linear-gradient(135deg,${p.color}33,${p.color}11)`,display:'flex',alignItems:'center',justifyContent:'center'}}><i className="fa-solid fa-graduation-cap" style={{fontSize:48,color:p.color,opacity:.5}}/></div>
                  }
                  <div className="lp-prog__media-overlay"/>
                  <div className="lp-prog__badge">{p.badge}</div>
                </div>
                <div className="lp-prog__content">
                  <div className="lp-prog__accent"/>
                  <h3>{p.title}</h3>
                  <p>{p.sub}</p>
                  <div className="lp-prog__campuses">
                    {(p.campuses||[]).map(c => <span key={c}>{c}</span>)}
                  </div>
                  <Link to="/login" className="lp-prog__cta">
                    Learn more <i className="fa-solid fa-arrow-right" style={{fontSize:11}}/>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM FEATURES ────────────────────────────── */}
      <section className="lp-section lp-section--dark" id="features">
        <div className="lp-container">
          <div className="lp-sh lp-sh--light">
            <div className="lp-sh__eyebrow lp-sh__eyebrow--dark">The Platform</div>
            <h2>Everything You Need<br/><span className="lp-text-gold">In One Place</span></h2>
            <p style={{color:'rgba(255,255,255,.6)'}}>A complete digital campus — from live classes to AI tutoring, built for African students and teachers.</p>
          </div>
          <div className="lp-features-grid">
            {PLATFORM_FEATURES.map((f, i) => (
              <div key={i} className="lp-feat-card">
                <div className="lp-feat-card__img">
                  <img src={f.img} alt={f.title} loading="lazy"/>
                  <div className="lp-feat-card__overlay"/>
                  <div className="lp-feat-card__icon">
                    <i className={`fa-solid ${f.icon}`}/>
                  </div>
                </div>
                <div className="lp-feat-card__body">
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4 CAMPUSES ───────────────────────────────────── */}
      <section className="lp-section lp-section--white" id="campuses">
        <div className="lp-container">
          <div className="lp-sh">
            <div className="lp-sh__eyebrow">Our Campuses</div>
            <h2>4 Campuses Across <span className="lp-text-gold">West & Central Africa</span></h2>
            <p>The same high-quality curriculum delivered at every location — supported by a shared digital platform.</p>
          </div>
          {/* Campus tabs */}
          <div className="lp-campus-tabs">
            {CAMPUSES_INFO.map((c, i) => (
              <button key={i} className={`lp-campus-tab ${activeCampus===i?'active':''}`} onClick={()=>setActiveCampus(i)}>
                <span className="lp-campus-tab-flag">{c.flag}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
          {/* Active campus card */}
          <div className="lp-campus-card">
            <div className="lp-campus-card__img">
              {/* Use admin-uploaded image or fallback to default */}
              {s[CAMPUSES_INFO[activeCampus].imgKey]
                ? <img src={s[CAMPUSES_INFO[activeCampus].imgKey]} alt={CAMPUSES_INFO[activeCampus].name} loading="lazy"/>
                : <img src={s.campusImage || imgCampus} alt={CAMPUSES_INFO[activeCampus].name} loading="lazy"/>
              }
              <div className="lp-campus-card__overlay"/>
              <div className="lp-campus-card__badge">
                <span>{CAMPUSES_INFO[activeCampus].flag}</span>
                <span>{CAMPUSES_INFO[activeCampus].name}, {CAMPUSES_INFO[activeCampus].country}</span>
              </div>
            </div>
            <div className="lp-campus-card__info">
              <div className="lp-campus-card__icon">
                {CAMPUSES_INFO[activeCampus].flag}
              </div>
              <h3>{CAMPUSES_INFO[activeCampus].name} Campus</h3>
              <p className="lp-campus-card__country">{CAMPUSES_INFO[activeCampus].country}</p>
              <p className="lp-campus-card__desc">{CAMPUSES_INFO[activeCampus].desc}</p>
              <div className="lp-campus-card__contact">
                <i className="fa-solid fa-phone" style={{color:'var(--gold)'}}/>
                <span>{s['contact' + CAMPUSES_INFO[activeCampus].key] || CAMPUSES_INFO[activeCampus].contact}</span>
              </div>
              <div className="lp-campus-card__programs">
                <p style={{fontSize:'.75rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'rgba(255,255,255,.5)',marginBottom:8}}>Programs available:</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {programs.filter(p => p.campuses?.includes(CAMPUSES_INFO[activeCampus].key)).map((p,j) => (
                    <span key={j} style={{background:`${p.color||'#d0aa31'}22`,border:`1px solid ${p.color||'#d0aa31'}44`,color:p.color||'var(--gold)',fontSize:'.72rem',fontWeight:600,padding:'3px 10px',borderRadius:999}}>
                      {p.title}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT / DUNIS ────────────────────────────────── */}
      <section className="lp-campus" id="about">
        <div className="lp-campus__visual">
          <img src={s.campusImage || imgCampus} alt="DUNIS Africa Campus" loading="lazy"/>
          <div className="lp-campus__visual-overlay"/>
          <div className="lp-campus__visual-badge">
            <span>📍</span><span>Dakar, Senegal</span>
          </div>
        </div>
        <div className="lp-campus__content">
          {s.logoUrl
            ? <img src={s.logoUrl} alt="DUNIS" className="lp-campus__logo"/>
            : <DunisLogo size="md" variant="white"/>
          }
          <div className="lp-campus__divider"/>
          <h2>{s.aboutTitle}</h2>
          <p>{s.aboutText}</p>
          <div className="lp-campus__chips">
            {['🇸🇳 Dakar','🇨🇮 Abidjan','🇨🇲 Douala','🇬🇲 Banjul'].map(c => <span key={c}>{c}</span>)}
          </div>
          <Link to="/login" className="lp-btn lp-btn--navy">
            <i className="fa-solid fa-arrow-right-to-bracket"/> Sign In to Learn →
          </Link>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <div className="lp-cta">
        <div className="lp-cta__bg" style={{ backgroundImage:`url(${ctaBg})` }}/>
        <div className="lp-cta__overlay"/>
        <div className="lp-cta__content">
          {s.logoUrl
            ? <img src={s.logoUrl} alt="DUNIS" className="lp-cta__logo"/>
            : <DunisLogo size="lg" variant="white"/>
          }
          <div className="lp-cta__eyebrow">
            <i className="fa-solid fa-graduation-cap"/>
            DUNIS Africa — Official E-Learning Platform
          </div>
          <h2>Ready to Begin Your Journey?</h2>
          <p>Sign in with your institutional credentials to access your courses and classes.</p>
          <div className="lp-cta__btns">
            <Link to="/login" className="lp-btn lp-btn--gold lp-btn--lg">
              <i className="fa-solid fa-arrow-right-to-bracket"/> Sign In
            </Link>
          </div>
          <div className="lp-cta__badges">
            <span><i className="fa-solid fa-shield-halved"/> Secure</span>
            <span><i className="fa-solid fa-earth-africa"/> 4 Campuses</span>
            <span><i className="fa-solid fa-certificate"/> Certified Courses</span>
            <span><i className="fa-solid fa-robot"/> AI Tutor</span>
          </div>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer__grid">
            <div className="lp-footer__brand">
              {s.logoUrl
                ? <img src={s.logoUrl} alt="DUNIS" className="lp-footer__logo-img"/>
                : <DunisLogo size="sm" variant="white"/>
              }
              <p>{s.footerTagline}</p>
              <a href="https://dunis.africa" target="_blank" rel="noreferrer">www.dunis.africa ↗</a>
            </div>
            <div className="lp-footer__col">
              <h4>Programs</h4>
              <ul>
                {(programs.length > 0 ? programs : DEFAULT_PROGRAMS).map((p,i) => (
                  <li key={i}>{p.title} {p.badge && <span style={{fontSize:'.65rem',color:'var(--gold)',fontWeight:600}}>[{p.badge}]</span>}</li>
                ))}
              </ul>
            </div>
            <div className="lp-footer__col">
              <h4>Campuses</h4>
              <ul>
                <li>🇸🇳 Dakar — {s.contactDakar}</li>
                <li>🇨🇮 Abidjan — {s.contactAbidjan}</li>
                <li>🇨🇲 Douala — {s.contactDouala}</li>
                <li>🇬🇲 Banjul — {s.contactBanjul}</li>
              </ul>
            </div>
            <div className="lp-footer__col">
              <h4>Platform</h4>
              <ul>
                <li><Link to="/login">Sign In</Link></li>
                <li><a href="https://dunis.africa/admissions" target="_blank" rel="noreferrer">Admissions</a></li>
                <li><a href="https://dunis.africa" target="_blank" rel="noreferrer">Official Website</a></li>
              </ul>
            </div>
          </div>
          <div className="lp-footer__bottom">
            <p>© 2024 DUNIS Africa — Dakar University of International Studies. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
