import React, { useState, useEffect, useRef } from 'react';
import { FiUploadCloud, FiTrash2, FiCopy, FiImage, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import API from '../../utils/api';

export default function MediaManager() {
  const [images, setImages]     = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [copied, setCopied]     = useState(null);
  const fileRef = useRef();

  const load = () => {
    API.get('/media/images')
      .then(r => setImages(r.data.images || []))
      .catch(() => toast.error('Failed to load images'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    let count = 0;
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is too large (max 5MB)`); continue; }
      const fd = new FormData();
      fd.append('image', file);
      try {
        await API.post('/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        count++;
      } catch (err) { toast.error(`Failed to upload ${file.name}`); }
    }
    if (count > 0) { toast.success(`${count} image${count>1?'s':''} uploaded ✅`); load(); }
    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (filename) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      await API.delete(`/media/${filename}`);
      setImages(prev => prev.filter(img => img.filename !== filename));
      toast.success('Image deleted');
    } catch { toast.error('Delete failed'); }
  };

  const copyUrl = (url, i) => {
    navigator.clipboard.writeText(url);
    setCopied(i);
    toast.success('URL copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  const fmtSize = (bytes) => bytes < 1024*1024 ? `${(bytes/1024).toFixed(0)}KB` : `${(bytes/1024/1024).toFixed(1)}MB`;

  return (
    <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:22}}>
      <div>
        <h1 className="section-title">Media Library</h1>
        <p className="section-sub">{images.length} images · Max 5MB per file · JPG, PNG, GIF, WebP</p>
      </div>

      {/* Upload area */}
      <div
        className="card"
        onClick={() => fileRef.current?.click()}
        style={{padding:'40px 24px',textAlign:'center',border:'2px dashed var(--gray-200)',cursor:'pointer',transition:'var(--transition)',background:'var(--gray-100)'}}
        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--gold)'; }}
        onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; }}
        onDrop={e => {
          e.preventDefault();
          e.currentTarget.style.borderColor = 'var(--gray-200)';
          const dt = new DataTransfer();
          Array.from(e.dataTransfer.files).forEach(f => dt.items.add(f));
          fileRef.current.files = dt.files;
          handleUpload({ target: fileRef.current });
        }}
      >
        <input ref={fileRef} type="file" multiple accept="image/*" style={{display:'none'}} onChange={handleUpload} />
        <FiUploadCloud size={40} color="var(--gray-400)" />
        <p style={{marginTop:12,fontWeight:600,color:'var(--navy)'}}>
          {uploading ? 'Uploading…' : 'Click or drag & drop images here'}
        </p>
        <p style={{fontSize:'.82rem',color:'var(--gray-400)',marginTop:4}}>JPG, PNG, GIF, WebP · Max 5MB each · Multiple files supported</p>
        <button className="btn btn-gold btn-sm" style={{marginTop:14}} disabled={uploading} onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
          <FiUploadCloud size={14}/> {uploading ? 'Uploading…' : 'Upload images'}
        </button>
      </div>

      {/* Image grid */}
      {loading ? <div className="spinner"/> : images.length === 0 ? (
        <div className="empty-state card">
          <FiImage size={40}/>
          <h3>No images yet</h3>
          <p>Upload images to use them in courses, banners, and profiles</p>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16}}>
          {images.map((img, i) => (
            <div key={i} className="card" style={{overflow:'hidden',transition:'var(--transition)'}}>
              <div style={{height:140,background:'var(--gray-100)',overflow:'hidden',position:'relative'}}>
                <img src={img.url} alt={img.filename} style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform .4s'}}
                  onMouseOver={e => e.target.style.transform='scale(1.05)'}
                  onMouseOut={e => e.target.style.transform='scale(1)'}
                />
              </div>
              <div style={{padding:'10px 12px'}}>
                <p style={{fontSize:'.75rem',fontWeight:600,color:'var(--navy)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:3}}>{img.filename}</p>
                <p style={{fontSize:'.7rem',color:'var(--gray-400)',marginBottom:8}}>{fmtSize(img.size)}</p>
                <div style={{display:'flex',gap:6}}>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{flex:1,justifyContent:'center',fontSize:'.72rem',padding:'6px'}}
                    onClick={() => copyUrl(img.url, i)}
                    title="Copy URL"
                  >
                    {copied === i ? <><FiCheck size={12}/> Copied</> : <><FiCopy size={12}/> Copy URL</>}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{padding:'6px 10px'}}
                    onClick={() => handleDelete(img.filename)}
                    title="Delete"
                  >
                    <FiTrash2 size={13}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Usage tip */}
      <div className="card" style={{padding:18,background:'rgba(200,168,75,.06)',border:'1px solid rgba(200,168,75,.2)'}}>
        <h3 style={{fontSize:'.875rem',color:'var(--navy)',marginBottom:8}}>💡 How to use uploaded images</h3>
        <p style={{fontSize:'.82rem',color:'var(--gray-600)',lineHeight:1.7}}>
          After uploading an image, click "Copy URL" to get its link.<br/>
          Paste the URL in: <strong>Course Thumbnail</strong>, <strong>Lesson Video URL</strong> (if it's a video), or share with teachers for their courses.
          <br/>The server URL format is: <code style={{background:'var(--gray-100)',padding:'2px 6px',borderRadius:4,fontFamily:'monospace',fontSize:'.8rem'}}>http://localhost:5000/uploads/images/filename.jpg</code>
        </p>
      </div>
    </div>
  );
}
