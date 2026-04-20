import React, { useState, useEffect } from 'react';
import DunisLogo from '../../components/DunisLogo/DunisLogo';
import { getMyCertificates, generateCertificate } from '../../utils/api';
import { FiAward, FiExternalLink } from 'react-icons/fi';
import { format } from 'date-fns';
import './StudentPages.css';

export default function Certificates() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyCertificates().then(r => setCerts(r.data.certificates)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div className="certificates-page fade-up">
      <div style={{ marginBottom:24 }}>
        <h1 className="section-title">My Certificates</h1>
        <p className="section-sub">{certs.length} certificate{certs.length !== 1 ? 's' : ''} earned</p>
      </div>

      {certs.length === 0 ? (
        <div className="empty-state card">
          <FiAward size={52} />
          <h3>No certificates yet</h3>
          <p>Complete a course to earn your first DUNIS Africa certificate.</p>
        </div>
      ) : (
        <div className="certs-grid">
          {certs.map((cert, i) => (
            <div key={i} className="cert-card card">
              <div className="cert-top">
                <div className="cert-logo-wrap">
                  <DunisLogo size="sm" variant="white" />
                </div>
                <div className="cert-badge">🏆</div>
                <h3 className="cert-card-title">{cert.course?.title}</h3>
                <p className="cert-teacher">
                  Issued by {cert.teacher?.firstName} {cert.teacher?.lastName}
                </p>
                <div className="cert-ribbon">{cert.course?.level || 'Certified'}</div>
              </div>

              <div className="cert-bottom">
                <div className="cert-id-row">
                  <span className="cert-id">{cert.certificateId}</span>
                  <span className="cert-date">{format(new Date(cert.issuedAt), 'MMM dd, yyyy')}</span>
                </div>

                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:4 }}>
                  <span className="badge badge-navy">{cert.course?.category}</span>
                  <span className="badge badge-green">Completed</span>
                </div>

                {cert.finalScore != null && (
                  <div className="cert-score">
                    <span style={{ fontSize:'.8rem', color:'var(--gray-600)' }}>Final Score</span>
                    <span className="cert-score-val">{cert.finalScore}%</span>
                  </div>
                )}

                {/* Verification link */}
                <div style={{ display:'flex', gap:6, marginTop:4 }}>
                  <a
                    href={`/verify/${cert.certificateId}`}
                    target="_blank" rel="noreferrer"
                    className="btn btn-outline-gold btn-sm"
                    style={{ flex:1, justifyContent:'center' }}
                  >
                    <FiExternalLink size={13} /> Verify
                  </a>
                  <a
                    href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/certificates/generate/${cert.certificateId}`}
                    target="_blank" rel="noreferrer"
                    className="btn btn-navy btn-sm"
                    style={{ flex:1, justifyContent:'center' }}
                    title="Download / Print certificate"
                  >
                    🎓 Download
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info block */}
      {certs.length > 0 && (
        <div className="card" style={{ padding:22, background:'linear-gradient(135deg,rgba(200,168,75,.08),rgba(200,168,75,.04))', border:'1px solid rgba(200,168,75,.25)' }}>
          <h3 style={{ fontSize:'1rem', color:'var(--navy)', marginBottom:6 }}>🎓 About DUNIS Africa Certificates</h3>
          <p style={{ fontSize:'.85rem', color:'var(--gray-600)', lineHeight:1.7 }}>
            Your DUNIS Africa certificates are officially recognized and can be verified using the unique certificate ID. 
            Each certificate confirms your successful completion of an accredited course at DUNIS Africa — Dakar University of International Studies.
          </p>
        </div>
      )}
    </div>
  );
}
