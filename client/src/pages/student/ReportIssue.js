import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopBar  from '../../components/layout/TopBar';
import api from '../../services/api';

export default function ReportIssue() {
  const [form, setForm]   = useState({ title:'', description:'', category_id:'', department_id:'' });
  const [files, setFiles] = useState([]);
  const [cats, setCats]   = useState([]);
  const [depts, setDepts] = useState([]);
  const [err, setErr]     = useState('');
  const [ok, setOk]       = useState('');
  const [busy, setBusy]   = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/reports/categories').then(r => setCats(r.data));
    api.get('/reports/departments').then(r => setDepts(r.data));
  }, []);

  const handleFiles = (incoming) => setFiles(Array.from(incoming).slice(0,5));

  const go = async e => {
    e.preventDefault(); setErr(''); setOk('');
    const title       = (form.title || '').trim();
    const description = (form.description || '').trim();
    const cat_id      = parseInt(form.category_id);
    const dept_id     = parseInt(form.department_id);

    if (!title || title.length < 3)              return setErr('Title is required (min 3 characters)');
    if (!description || description.length < 10) return setErr('Description is required (min 10 characters)');
    if (isNaN(cat_id)  || cat_id  <= 0)          return setErr('Please select a valid category');
    if (isNaN(dept_id) || dept_id <= 0)           return setErr('Please select a valid department');

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', description);
      fd.append('category_id', cat_id);
      fd.append('department_id', dept_id);
      files.forEach(f => fd.append('attachments', f));
      const { data } = await api.post('/reports', fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      setOk(`✅ Report submitted! ID: ${data.report_id} — Awaiting superadmin approval.`);
      setTimeout(() => navigate('/my-reports'), 2500);
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to submit. Try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main">
        <TopBar title="Report an Issue"/>
        <h1 className="pg-title">📝 Report an Issue</h1>
        <p className="pg-sub">🔒 Your identity is fully protected — reports use your anonymous ID only.</p>

        {/* Centered form container */}
        <div style={{display:'flex',justifyContent:'center'}}>
          <div style={{width:'100%',maxWidth:680}}>

            {err && <div className="alert alert-err" style={{marginBottom:16}}>⚠️ {err}</div>}
            {ok  && <div className="alert alert-ok"  style={{marginBottom:16}}>{ok}</div>}

            <form onSubmit={go}>
              {/* Basic info card */}
              <div className="card" style={{marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                  <div style={{width:30,height:30,background:'var(--primary-light)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>📌</div>
                  <h3 style={{fontWeight:700,fontSize:14,color:'var(--gray-700)'}}>Basic Information</h3>
                </div>
                <div className="fg">
                  <label className="fl label-required">Issue Title</label>
                  <input className="fi" placeholder="e.g. Broken AC in Lab 4, Floor 3 of CS Building"
                    value={form.title} onChange={e => setForm({...form,title:e.target.value})} required/>
                  <div style={{fontSize:11.5,color:'var(--gray-400)',marginTop:4}}>Be specific — good titles get faster responses</div>
                </div>
                <div className="grid2">
                  <div className="fg" style={{marginBottom:0}}>
                    <label className="fl label-required">Category</label>
                    <select className="fs" value={form.category_id||''}
                      onChange={e => setForm({...form,category_id:parseInt(e.target.value)||''})} required>
                      <option value="">Select category</option>
                      {cats.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="fg" style={{marginBottom:0}}>
                    <label className="fl label-required">Department</label>
                    <select className="fs" value={form.department_id||''}
                      onChange={e => setForm({...form,department_id:parseInt(e.target.value)||''})} required>
                      <option value="">Select department</option>
                      {depts.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Description card */}
              <div className="card" style={{marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                  <div style={{width:30,height:30,background:'#EDE9FE',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>📄</div>
                  <h3 style={{fontWeight:700,fontSize:14,color:'var(--gray-700)'}}>Detailed Description</h3>
                </div>
                <div className="fg" style={{marginBottom:0}}>
                  <label className="fl label-required">Describe the problem</label>
                  <textarea className="ft" rows={6}
                    placeholder="Describe the issue in detail:&#10;• Where exactly is the problem located?&#10;• When did it start?&#10;• How severe is it?&#10;• Has it happened before?"
                    value={form.description} onChange={e => setForm({...form,description:e.target.value})} required/>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:5}}>
                    <span style={{fontSize:11.5,color:'var(--gray-400)'}}>Min 10 characters</span>
                    <span style={{fontSize:11.5,color:form.description.length>=10?'var(--success)':'var(--gray-400)',fontWeight:600}}>{form.description.length} chars</span>
                  </div>
                </div>
              </div>

              {/* Attachments card */}
              <div className="card" style={{marginBottom:20}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                  <div style={{width:30,height:30,background:'#D1FAE5',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>📎</div>
                  <h3 style={{fontWeight:700,fontSize:14,color:'var(--gray-700)'}}>Attachments <span style={{fontSize:12,fontWeight:400,color:'var(--gray-400)'}}>optional</span></h3>
                </div>
                <div className={`upload-zone${dragging?' drag-over':''}`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}>
                  <div className="upload-icon">☁️</div>
                  <p style={{fontWeight:600,color:'var(--gray-600)',marginBottom:4}}>Drop files here or click to browse</p>
                  <p>Images or PDF · Max 5 files · 5MB each</p>
                  <input ref={fileRef} type="file" multiple accept="image/*,.pdf"
                    onChange={e => handleFiles(e.target.files)} style={{display:'none'}}/>
                </div>
                {files.length > 0 && (
                  <div style={{marginTop:12,display:'flex',gap:8,flexWrap:'wrap'}}>
                    {files.map(f => (
                      <div key={f.name} className="tag" style={{display:'flex',gap:6,alignItems:'center'}}>
                        <span>📎</span>
                        <span>{f.name.length>22?f.name.substring(0,22)+'…':f.name}</span>
                        <button type="button" onClick={() => setFiles(files.filter(x=>x!==f))}
                          style={{background:'none',border:'none',cursor:'pointer',color:'inherit',fontSize:12,padding:0}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div style={{display:'flex',gap:12,alignItems:'center'}}>
                <button className="btn btn-primary" disabled={busy} style={{minWidth:160}}>
                  {busy ? <><div className="spinner" style={{width:16,height:16,borderWidth:2}}/> Submitting…</> : '📤 Submit Report'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Cancel</button>
              </div>

              <div style={{marginTop:14,padding:'10px 14px',background:'var(--primary-light)',borderRadius:10,fontSize:12.5,color:'var(--primary-dark)',border:'1px solid var(--primary-mid)'}}>
                🔒 <strong>Privacy protected.</strong> Your real name and student ID are never shared. Reports are linked only to your ANON-ID.
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
