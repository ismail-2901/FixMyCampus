import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Sidebar from '../../components/layout/Sidebar';
import TopBar  from '../../components/layout/TopBar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const StatusBadge = ({ s }) => {
  const m = { Pending:'b-pending','In Progress':'b-progress',Resolved:'b-resolved',Rejected:'b-rejected' };
  return <span className={`badge ${m[s]||'b-pending'}`}>{s}</span>;
};

function StatusTimeline({ status, isApproved }) {
  if (status === 'Rejected') {
    return (
      <div style={{background:'#FEE2E2',border:'1px solid #FCA5A5',borderRadius:12,padding:'14px 18px',display:'flex',alignItems:'center',gap:12}}>
        <div style={{fontSize:24}}>❌</div>
        <div>
          <div style={{fontWeight:700,color:'#991B1B',fontSize:14}}>Report Rejected</div>
          <div style={{fontSize:13,color:'#B91C1C',marginTop:2}}>This report was not approved by the administration.</div>
        </div>
      </div>
    );
  }
  const steps = [
    { label:'Submitted',   icon:'📤', done:true },
    { label:'Approved',    icon:'✅', done:!!isApproved },
    { label:'In Progress', icon:'🔄', done:status==='In Progress'||status==='Resolved' },
    { label:'Resolved',    icon:'🎉', done:status==='Resolved' },
  ];
  return (
    <div style={{display:'flex',alignItems:'center'}}>
      {steps.map((step,i) => (
        <React.Fragment key={step.label}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',flex:1,minWidth:0}}>
            <div style={{
              width:34,height:34,borderRadius:'50%',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,marginBottom:5,
              background:step.done?'var(--success-bg)':'var(--gray-100)',
              border:`2px solid ${step.done?'var(--success)':'var(--gray-300)'}`,
            }}>{step.icon}</div>
            <div style={{fontSize:11,fontWeight:step.done?700:400,color:step.done?'var(--success)':'var(--gray-400)',textAlign:'center',lineHeight:1.3}}>{step.label}</div>
          </div>
          {i < steps.length-1 && (
            <div style={{height:2,flex:'0 0 20px',background:step.done&&steps[i+1].done?'var(--success)':'var(--gray-200)',marginBottom:18}}/>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function ClosureConfirm({ reportId, onUpdate }) {
  const [busy, setBusy] = useState(false);
  const confirm = async resolved => {
    setBusy(true);
    await api.post(`/reports/${reportId}/confirm-closure`, { resolved });
    onUpdate();
    setBusy(false);
  };
  return (
    <div className="card" style={{border:'2px solid #F59E0B',background:'#FFFBEB',marginBottom:20}}>
      <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
        <div style={{fontSize:28}}>⚠️</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:15,color:'#92400E',marginBottom:6}}>Has your issue been resolved?</div>
          <div style={{fontSize:13,color:'#B45309',marginBottom:14,lineHeight:1.6}}>
            The admin has asked if your reported issue has been fixed. Please confirm so we can properly close or continue working on this case.
          </div>
          <div style={{display:'flex',gap:10}}>
            <button className="btn btn-success btn-sm" onClick={() => confirm(true)} disabled={busy}>✅ Yes, it's resolved!</button>
            <button className="btn btn-secondary btn-sm" onClick={() => confirm(false)} disabled={busy}>❌ Not yet</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminControls({ reportId, report, onUpdate }) {
  const [status,    setStatus]    = useState(report.status);
  const [msg,       setMsg]       = useState('');
  const [feedback,  setFeedback]  = useState({ text:'', ok:true });
  const [showModal, setShowModal] = useState(false);
  const [busy,      setBusy]      = useState(false);

  const updateStatus = async () => {
    setBusy(true);
    try {
      await api.patch(`/reports/${reportId}/status`, { status });
      setFeedback({ text:'Status updated', ok:true });
      onUpdate();
    } catch (e) { setFeedback({ text: e.response?.data?.error||'Failed', ok:false }); }
    setBusy(false);
  };
  const sendReply = async () => {
    if (!msg.trim()) return setFeedback({ text:'Please write a response message', ok:false });
    setBusy(true);
    try {
      await api.post(`/reports/${reportId}/respond`, { message: msg });
      setMsg(''); setFeedback({ text:'Response sent to reporter', ok:true });
      onUpdate();
    } catch (e) { setFeedback({ text: e.response?.data?.error||'Failed', ok:false }); }
    setBusy(false);
  };
  const askClosure = async () => {
    setBusy(true);
    await api.post(`/reports/${reportId}/ask-closure`);
    setShowModal(false);
    setFeedback({ text:'Closure confirmation sent to reporter', ok:true });
    onUpdate();
    setBusy(false);
  };

  return (
    <>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ask Reporter: Is This Resolved?</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{fontSize:14,color:'var(--gray-600)',lineHeight:1.6}}>
                This will send a real-time notification to the reporter asking them to confirm whether the issue has been resolved.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={askClosure} disabled={busy}>
                {busy ? 'Sending…' : 'Send Confirmation Request'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="card" style={{border:'2px solid var(--primary-mid)',background:'#FAFAFF'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
          <div style={{width:34,height:34,background:'var(--primary-light)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>⚙️</div>
          <h3 style={{fontWeight:700,fontSize:15,color:'var(--primary-dark)',fontFamily:'var(--font-display)'}}>Admin Controls</h3>
        </div>
        {feedback.text && (
          <div className={`alert alert-${feedback.ok?'ok':'err'}`}>{feedback.text}</div>
        )}
        <div style={{marginBottom:18}}>
          <label className="fl">Update Report Status</label>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
            <select className="fs" style={{width:'auto',minWidth:160}} value={status} onChange={e => setStatus(e.target.value)}>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Rejected</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={updateStatus} disabled={busy}>Update Status</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(true)}>💬 Ask If Resolved</button>
          </div>
        </div>
        <div>
          <label className="fl">Send Official Response to Reporter</label>
          <textarea className="ft" rows={3} placeholder="Write your official response…"
            value={msg} onChange={e => setMsg(e.target.value)}/>
          <button className="btn btn-primary btn-sm" style={{marginTop:10}} onClick={sendReply} disabled={busy}>
            📤 Send Response
          </button>
        </div>
      </div>
    </>
  );
}

function SuperAdminView() {
  return (
    <div className="card" style={{border:'2px solid #E0E7FF',background:'#F5F3FF'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
        <div style={{width:34,height:34,background:'#EDE9FE',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🛡️</div>
        <h3 style={{fontWeight:700,fontSize:15,color:'#4C1D95',fontFamily:'var(--font-display)'}}>Superadmin View — Read Only</h3>
      </div>
      <div style={{fontSize:13,color:'#5B21B6',background:'#EDE9FE',borderRadius:8,padding:'10px 14px',lineHeight:1.6}}>
        ℹ️ Use the <strong>All Reports</strong> tab in your Control Panel to approve or reject this report. Status updates and responses are handled by department admins.
      </div>
    </div>
  );
}

export default function ReportDetail() {
  const { id }    = useParams();
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [report,   setReport]   = useState(null);
  const [comments, setComments] = useState([]);
  const [newCmt,   setNewCmt]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [liveMsg,  setLiveMsg]  = useState('');
  const socketRef = useRef(null);

  const isAdmin      = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'superadmin';
  const isStudent    = user?.role === 'student' || user?.role === 'staff';

  const getUploadUrl = f => `${window.location.protocol}//${window.location.hostname}:5002/uploads/${f}`;

  const load = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([api.get(`/reports/${id}`), api.get(`/comments/${id}`)]);
      setReport(r.data); setComments(c.data);
    } catch { navigate(-1); }
    finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  // Join report watch room for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('fmc_token');
    const baseURL = `http://${window.location.hostname}:5002`;
    socketRef.current = io(baseURL, { auth:{ token } });
    socketRef.current.on('connect', () => {
      socketRef.current.emit('watch_report', id);
    });
    socketRef.current.on('report_update', data => {
      // Auto-reload the report when admin makes any change
      setLiveMsg('Report updated — refreshing…');
      load().then(() => setTimeout(() => setLiveMsg(''), 2500));
    });
    return () => {
      socketRef.current?.emit('unwatch_report', id);
      socketRef.current?.disconnect();
    };
  }, [id, load]);

  const postComment = async () => {
    if (!newCmt.trim()) return;
    await api.post(`/comments/${id}`, { content: newCmt });
    setNewCmt('');
    api.get(`/comments/${id}`).then(r => setComments(r.data));
  };

  if (loading) return <div className="full-center"><div className="spinner"/></div>;
  if (!report)  return null;

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main">
        <TopBar title="Report Details"/>

        {liveMsg && (
          <div className="alert alert-info" style={{marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
            <span style={{animation:'spin 1s linear infinite',display:'inline-block'}}>⟳</span>
            {liveMsg}
          </div>
        )}

        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{marginBottom:18}}>← Back</button>

        {/* Report header */}
        <div className="card" style={{marginBottom:16}}>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',marginBottom:12}}>
            <StatusBadge s={report.status}/>
            {!report.is_approved && <span className="badge" style={{background:'#FEF3C7',color:'#92400E'}}>⏳ Awaiting Approval</span>}
            <span className="mono text-gray" style={{fontSize:12}}>{report.report_id}</span>
          </div>
          <h2 style={{fontSize:22,fontWeight:800,marginBottom:10,fontFamily:'var(--font-display)'}}>{report.title}</h2>
          <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:16,fontSize:13,color:'var(--gray-500)'}}>
            <span>📂 {report.category}</span>
            <span>🏛️ {report.department}</span>
            <span>👤 {report.author}</span>
            <span>📅 {new Date(report.created_at).toLocaleString()}</span>
          </div>

          <div style={{background:'var(--gray-50)',borderRadius:12,padding:'16px 20px',marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--gray-500)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:12}}>Progress</div>
            <StatusTimeline status={report.status} isApproved={!!report.is_approved}/>
          </div>

          <p style={{lineHeight:1.8,color:'var(--gray-700)',fontSize:14}}>{report.description}</p>

          {report.attachments?.length > 0 && (
            <div style={{marginTop:14}}>
              <p style={{fontSize:13,fontWeight:600,marginBottom:7,color:'var(--gray-600)'}}>Attachments:</p>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {report.attachments.map(a => (
                  <a key={a.attachment_id} href={getUploadUrl(a.file_path)} target="_blank" rel="noreferrer" className="tag">📎 View</a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Closure confirmation — students only */}
        {!!report.awaiting_closure && isStudent && (
          <ClosureConfirm reportId={id} onUpdate={load}/>
        )}

        {/* Official responses */}
        {report.responses?.length > 0 && (
          <div className="card" style={{marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
              <div style={{width:34,height:34,background:'#D1FAE5',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🏛️</div>
              <h3 style={{fontWeight:700,fontSize:15,fontFamily:'var(--font-display)'}}>Official Responses</h3>
            </div>
            {report.responses.map(r => (
              <div key={r.response_id} style={{background:'#F0FDF4',border:'1px solid #86EFAC',borderRadius:10,padding:'14px 16px',marginBottom:10}}>
                <div style={{display:'flex',flexDirection:'column',marginBottom:6}}>
                  <span style={{fontSize:12.5,fontWeight:600,color:'#065F46',fontFamily:'monospace'}}>{r.responder}</span>
                  <span style={{fontSize:11.5,color:'#6EE7B7'}}>{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <p style={{fontSize:14,color:'#065F46',lineHeight:1.6}}>{r.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        {isAdmin      && <AdminControls reportId={id} report={report} onUpdate={load}/>}
        {isSuperAdmin && <SuperAdminView/>}

        {/* Comments */}
        <div className="card no-hover" style={{padding:0}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',gap:8}}>
            <div style={{fontSize:18}}>💬</div>
            <h3 style={{fontWeight:700,fontSize:15,fontFamily:'var(--font-display)'}}>Comments ({comments.length})</h3>
          </div>
          <div>
            {comments.length === 0 && (
              <p style={{padding:'16px 20px',color:'var(--gray-400)',fontSize:13}}>No comments yet.</p>
            )}
            {comments.map(c => (
              <div key={c.comment_id} style={{padding:'12px 20px',borderBottom:'1px solid var(--gray-50)'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:600,color:'var(--gray-700)',fontFamily:'monospace'}}>{c.author}</span>
                  <span style={{fontSize:11.5,color:'var(--gray-400)'}}>{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <p style={{fontSize:13.5,color:'var(--gray-700)',lineHeight:1.6}}>{c.content}</p>
              </div>
            ))}
          </div>
          <div style={{padding:'12px 20px',borderTop:'1px solid var(--gray-100)',background:'var(--gray-50)',display:'flex',gap:10}}>
            <textarea className="ft" rows={2} placeholder="Add a comment… (Ctrl+Enter to post)"
              value={newCmt} onChange={e => setNewCmt(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter'&&e.ctrlKey) postComment(); }}
              style={{flex:1,minHeight:48,resize:'none'}}/>
            <button className="btn btn-primary btn-sm" style={{alignSelf:'flex-end'}} onClick={postComment}>Post</button>
          </div>
        </div>
      </main>
    </div>
  );
}
