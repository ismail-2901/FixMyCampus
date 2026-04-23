import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopBar  from '../../components/layout/TopBar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const StatusBadge = ({ s }) => {
  const m = { Pending:'b-pending','In Progress':'b-progress',Resolved:'b-resolved',Rejected:'b-rejected' };
  return <span className={`badge ${m[s]||'b-pending'}`}>{s}</span>;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData]     = useState({ reports:[], total:0 });
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/reports?limit=5').then(r => setData(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const pending  = data.reports.filter(r => r.status === 'Pending').length;
  const progress = data.reports.filter(r => r.status === 'In Progress').length;
  const resolved = data.reports.filter(r => r.status === 'Resolved').length;
  const closure  = data.reports.filter(r => r.awaiting_closure);

  const statCards = [
    { label:'Total Reports', value:data.total||0, color:'#6366F1', bg:'#EEF2FF', icon:'📊' },
    { label:'Pending',        value:pending,        color:'#F59E0B', bg:'#FEF3C7', icon:'⏳' },
    { label:'In Progress',    value:progress,       color:'#3B82F6', bg:'#DBEAFE', icon:'🔄' },
    { label:'Resolved',       value:resolved,       color:'#10B981', bg:'#D1FAE5', icon:'✅' },
  ];

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main">
        <TopBar title="Dashboard"/>

        {closure.map(r => (
          <div key={r.report_id} className="alert alert-warn" style={{marginBottom:12}}>
            ⚠️ Admin is asking if <strong>{r.report_id}</strong> has been resolved.{' '}
            <Link to={`/reports/${r.report_id}`} style={{color:'#92400E',fontWeight:700}}>Respond now →</Link>
          </div>
        ))}

        <div style={{marginBottom:20}}>
          <h1 className="pg-title">👋 Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className="pg-sub">Your anonymous ID: <strong style={{color:'var(--primary)',background:'var(--primary-light)',padding:'2px 8px',borderRadius:6}}>{user?.anonymous_id}</strong></p>
        </div>

        <div className="stats" style={{gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))'}}>
          {statCards.map(s => (
            <div key={s.label} className="stat" style={{borderTop:`3px solid ${s.color}`}}>
              <div style={{width:38,height:38,background:s.bg,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,marginBottom:8}}>{s.icon}</div>
              <div className="stat-n" style={{color:s.color}}>{s.value}</div>
              <div className="stat-l">{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:24}}>
          <Link to="/report"      className="btn btn-primary"><span>📝</span> Report New Issue</Link>
          <Link to="/chatbot"     className="btn btn-secondary"><span>🤖</span> Ask AI</Link>
          <Link to="/groups"      className="btn btn-secondary"><span>💬</span> Group Discussions</Link>
          <Link to="/my-reports"  className="btn btn-secondary"><span>📋</span> All My Reports</Link>
        </div>

        <div className="card no-hover" style={{padding:0}}>
          <div style={{padding:'16px 20px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid var(--gray-100)'}}>
            <h3 style={{fontWeight:700,fontSize:15,fontFamily:'var(--font-display)'}}>Recent Reports</h3>
            <Link to="/my-reports" style={{fontSize:13,color:'var(--primary)',fontWeight:600}}>View all →</Link>
          </div>
          {loading ? (
            <div style={{padding:24}}>{[1,2,3].map(i=>(
              <div key={i} style={{display:'flex',gap:12,marginBottom:14}}>
                <div className="skeleton" style={{width:80,height:14}}/>
                <div className="skeleton" style={{flex:1,height:14}}/>
                <div className="skeleton" style={{width:70,height:22,borderRadius:20}}/>
              </div>
            ))}</div>
          ) : data.reports.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <h3>No reports yet</h3>
              <p>Submit your first campus issue and we'll get it resolved.</p>
              <Link to="/report" className="btn btn-primary btn-sm" style={{marginTop:12}}>Submit Report</Link>
            </div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Report ID</th><th>Title</th><th>Category</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {data.reports.map(r => (
                    <tr key={r.report_id}>
                      <td><Link to={`/reports/${r.report_id}`} className="mono" style={{color:'var(--primary)',fontWeight:600}}>{r.report_id}</Link></td>
                      <td style={{fontWeight:500,maxWidth:220}}><span style={{display:'block',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.title}</span></td>
                      <td className="text-sm text-gray">{r.category}</td>
                      <td><StatusBadge s={r.status}/></td>
                      <td className="text-sm text-gray">{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card" style={{background:'linear-gradient(135deg,#EEF2FF,#F5F3FF)',border:'1px solid var(--primary-mid)'}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{fontSize:34}}>💡</div>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:'var(--primary-dark)',marginBottom:3}}>Tips for faster resolution</div>
              <div style={{fontSize:13,color:'var(--gray-600)',lineHeight:1.6}}>Add clear photos · Choose the correct department · Describe the issue location specifically</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
