import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Badge = ({ s }) => {
  const m = { Pending:'b-pending','In Progress':'b-progress',Resolved:'b-resolved',Rejected:'b-rejected' };
  return <span className={`badge ${m[s]||'b-pending'}`}>{s}</span>;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ reports:[], total:0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports?limit=5').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const pending  = data.reports.filter(r=>r.status==='Pending').length;
  const resolved = data.reports.filter(r=>r.status==='Resolved').length;
  const closure  = data.reports.filter(r=>r.awaiting_closure);

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main">
        <h1 className="pg-title">👋 Welcome back!</h1>
        <p className="pg-sub">Your anonymous ID: <strong style={{color:'#1e40af'}}>{user?.anonymous_id}</strong></p>

        {closure.map(r => (
          <div key={r.report_id} className="alert alert-warn">
            ⚠️ Admin is asking if <strong>{r.report_id}</strong> has been resolved.{' '}
            <Link to={`/reports/${r.report_id}`} style={{color:'#92400e',fontWeight:600}}>Respond →</Link>
          </div>
        ))}

        <div className="stats">
          {[
            {label:'Total Reports',value:data.total||0,     color:'#1e40af'},
            {label:'Pending',      value:pending,            color:'#d97706'},
            {label:'Resolved',     value:resolved,           color:'#16a34a'},
          ].map(s=>(
            <div key={s.label} className="stat">
              <div className="stat-n" style={{color:s.color}}>{s.value}</div>
              <div className="stat-l">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="row mb16" style={{gap:10}}>
          <Link to="/report"  className="btn btn-primary">📝 Report New Issue</Link>
          <Link to="/chatbot" className="btn btn-secondary">🤖 Ask AI</Link>
          <Link to="/groups"  className="btn btn-secondary">👥 Join Discussion</Link>
        </div>

        <div className="card">
          <div className="row jb mb16">
            <h3 style={{fontWeight:700}}>Recent Reports</h3>
            <Link to="/my-reports" className="text-sm" style={{color:'#1e40af'}}>View all →</Link>
          </div>
          {loading ? <p>Loading...</p> : data.reports.length === 0 ? (
            <div className="empty"><h3>No reports yet</h3><p>Submit your first campus issue</p></div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Report ID</th><th>Title</th><th>Category</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {data.reports.map(r=>(
                    <tr key={r.report_id}>
                      <td><Link to={`/reports/${r.report_id}`} className="mono" style={{color:'#1e40af'}}>{r.report_id}</Link></td>
                      <td style={{fontWeight:500}}>{r.title}</td>
                      <td className="text-sm text-gray">{r.category}</td>
                      <td><Badge s={r.status}/></td>
                      <td className="text-sm text-gray">{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
