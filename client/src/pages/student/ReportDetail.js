import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Badge = ({ s }) => {
  const m = {Pending:'b-pending','In Progress':'b-progress',Resolved:'b-resolved',Rejected:'b-rejected'};
  return <span className={`badge ${m[s]||'b-pending'}`}>{s}</span>;
};

export default function ReportDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [report, setReport]     = useState(null);
  const [comments, setComments] = useState([]);
  const [newCmt, setNewCmt]     = useState('');
  const [loading, setLoading]   = useState(true);
  const isAdmin = ['admin','superadmin'].includes(user?.role);

  const getUploadUrl = (filename) => {
    // Construct the full server URL for uploads
    // Server runs on port 5002 (as per .env configuration)
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:5002/uploads/${filename}`;
  };

  const load = async () => {
    try {
      const [r, c] = await Promise.all([api.get(`/reports/${id}`), api.get(`/comments/${id}`)]);
      setReport(r.data); setComments(c.data);
    } catch { navigate(-1); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const postComment = async () => {
    if (!newCmt.trim()) return;
    await api.post(`/comments/${id}`, { content: newCmt });
    setNewCmt('');
    api.get(`/comments/${id}`).then(r => setComments(r.data));
  };

  const react = async type => {
    await api.post(`/reports/${id}/react`, { type });
  };

  const confirmClosure = async resolved => {
    await api.post(`/reports/${id}/confirm-closure`, { resolved });
    load();
  };

  if (loading) return <div className="full-center"><div className="spinner"/></div>;
  if (!report)  return null;

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main">
        <button className="btn btn-secondary btn-sm" onClick={()=>navigate(-1)} style={{marginBottom:16}}>← Back</button>

        {/* Main report card */}
        <div className="card">
          <div className="row mb8" style={{gap:10,flexWrap:'wrap'}}>
            <Badge s={report.status}/>
            <span className="mono text-gray">{report.report_id}</span>
          </div>
          <h2 style={{fontSize:20,fontWeight:800,marginBottom:10}}>{report.title}</h2>
          <div className="row" style={{gap:18,flexWrap:'wrap',marginBottom:14,fontSize:13,color:'#6b7280'}}>
            <span>📂 {report.category}</span>
            <span>🏛️ {report.department}</span>
            <span>👤 {report.author}</span>
            <span>📅 {new Date(report.created_at).toLocaleString()}</span>
          </div>
          <p style={{lineHeight:1.75,color:'#374151'}}>{report.description}</p>

          {report.attachments?.length > 0 && (
            <div style={{marginTop:14}}>
              <p style={{fontSize:13,fontWeight:600,marginBottom:7}}>Attachments:</p>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {report.attachments.map(a=>(
                  <a key={a.attachment_id} href={getUploadUrl(a.file_path)} target="_blank" rel="noreferrer" className="tag">
                    📎 Open Attachment
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Closure request */}
        {report.awaiting_closure && !isAdmin && (
          <div className="card" style={{border:'2px solid #f59e0b',background:'#fffbeb'}}>
            <p style={{fontWeight:700,marginBottom:12}}>⚠️ The admin wants to know: Has your issue been resolved?</p>
            <div className="row" style={{gap:10}}>
              <button className="btn btn-success btn-sm" onClick={()=>confirmClosure(true)}>✅ Yes, it's resolved</button>
              <button className="btn btn-secondary btn-sm" onClick={()=>confirmClosure(false)}>❌ Not yet</button>
            </div>
          </div>
        )}

        {/* Admin responses */}
        {report.responses?.length > 0 && (
          <div className="card">
            <h3 style={{fontWeight:700,marginBottom:14}}>🏛️ Admin Responses</h3>
            {report.responses.map(r=>(
              <div key={r.response_id} style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:8,padding:14,marginBottom:10}}>
                <p style={{fontSize:12.5,color:'#6b7280',marginBottom:5}}>
                  From <strong>{r.responder}</strong> · {new Date(r.created_at).toLocaleString()}
                </p>
                <p style={{fontSize:14}}>{r.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Admin controls */}
        {isAdmin && <AdminControls reportId={id} report={report} onUpdate={load}/>}

        {/* Comments */}
        <div className="card">
          <h3 style={{fontWeight:700,marginBottom:14}}>💬 Comments ({comments.length})</h3>
          {comments.length === 0 && <p className="text-gray text-sm" style={{marginBottom:14}}>No comments yet. Be the first!</p>}
          {comments.map(c=>(
            <div key={c.comment_id} style={{padding:'11px 0',borderBottom:'1px solid #f3f4f6'}}>
              <div className="text-sm text-gray" style={{marginBottom:4}}>
                <strong>{c.author}</strong> · {new Date(c.created_at).toLocaleString()}
              </div>
              <p style={{fontSize:14}}>{c.content}</p>
            </div>
          ))}
          <div style={{marginTop:14,display:'flex',gap:10}}>
            <textarea className="ft" rows={2} placeholder="Add a comment..."
              value={newCmt} onChange={e=>setNewCmt(e.target.value)} style={{flex:1,minHeight:56}}/>
            <button className="btn btn-primary btn-sm" style={{alignSelf:'flex-end'}} onClick={postComment}>Post</button>
          </div>
        </div>
      </main>
    </div>
  );
}

function AdminControls({ reportId, report, onUpdate }) {
  const [status, setStatus] = useState(report.status);
  const [msg, setMsg]       = useState('');
  const [err, setErr]       = useState('');

  const updateStatus = async () => {
    await api.patch(`/reports/${reportId}/status`, { status });
    onUpdate();
    setErr('');
  };

  const sendReply = async () => {
    if (!msg.trim()) return setErr('Please write a response message');
    await api.post(`/reports/${reportId}/respond`, { message: msg });
    setMsg(''); setErr('');
    onUpdate();
  };

  const askClosure = async () => {
    await api.post(`/reports/${reportId}/ask-closure`);
    onUpdate();
    alert('Closure question sent to the reporter.');
  };

  return (
    <div className="card" style={{border:'2px solid #dbeafe'}}>
      <h3 style={{fontWeight:700,marginBottom:14,color:'#1e40af'}}>⚙️ Admin Controls</h3>
      {err && <div className="alert alert-err">{err}</div>}
      <div className="row mb16" style={{flexWrap:'wrap',gap:10}}>
        <select className="fs" style={{width:'auto'}} value={status} onChange={e=>setStatus(e.target.value)}>
          <option>Pending</option><option>In Progress</option>
          <option>Resolved</option><option>Rejected</option>
        </select>
        <button className="btn btn-primary btn-sm" onClick={updateStatus}>Update Status</button>
        <button className="btn btn-secondary btn-sm" onClick={askClosure}>Ask If Resolved</button>
      </div>
      <label className="fl">Send Response to Reporter</label>
      <textarea className="ft" rows={3} placeholder="Write your official response..."
        value={msg} onChange={e=>setMsg(e.target.value)}/>
      <button className="btn btn-primary btn-sm" style={{marginTop:10}} onClick={sendReply}>Send Response</button>
    </div>
  );
}
