import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopBar  from '../../components/layout/TopBar';
import { io } from 'socket.io-client';
import api from '../../services/api';

const StatusBadge = ({ s }) => {
  const m = { Pending:'b-pending','In Progress':'b-progress',Resolved:'b-resolved',Rejected:'b-rejected' };
  return <span className={`badge ${m[s]||'b-pending'}`}>{s}</span>;
};

const statCards = [
  { key:'pending',    label:'Pending',     icon:'⏳', color:'#F59E0B', bg:'#FEF3C7', border:'#FCD34D' },
  { key:'inprogress', label:'In Progress', icon:'🔄', color:'#3B82F6', bg:'#DBEAFE', border:'#93C5FD' },
  { key:'resolved',   label:'Resolved',    icon:'✅', color:'#10B981', bg:'#D1FAE5', border:'#6EE7B7' },
];

export default function AdminDash() {
  const [data, setData]     = useState({ reports:[], stats:{} });
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/admin/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  // Real-time: reload dashboard when new reports arrive or status changes
  useEffect(() => {
    const token = localStorage.getItem('fmc_token');
    const sock = io(`http://${window.location.hostname}:5002`, { auth:{ token } });
    sock.on('notification', () => load());
    return () => sock.disconnect();
  }, []);

  const rows = filter ? data.reports.filter(r => r.status === filter) : data.reports;
  const newCount = data.reports.filter(r => r.status === 'Pending').length;

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main">
        <TopBar title="Admin Dashboard"/>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:4}}>
          <div>
            <h1 className="pg-title">⚙️ Admin Dashboard</h1>
            <p className="pg-sub">Manage and resolve reports for your assigned department</p>
          </div>
          {newCount > 0 && (
            <div style={{background:'linear-gradient(135deg,#FEF3C7,#FDE68A)',border:'1px solid #FCD34D',borderRadius:12,padding:'8px 16px',display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:18}}>🔔</span>
              <div>
                <div style={{fontSize:12.5,fontWeight:700,color:'#92400E'}}>{newCount} New Report{newCount>1?'s':''}</div>
                <div style={{fontSize:11.5,color:'#B45309'}}>Awaiting your action</div>
              </div>
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="stats">
          {statCards.map(s => (
            <div key={s.key} className="stat" style={{borderTop:`3px solid ${s.color}`}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div style={{width:40,height:40,background:s.bg,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{s.icon}</div>
                <div style={{fontSize:11,fontWeight:700,color:s.color,background:s.bg,padding:'3px 8px',borderRadius:6,border:`1px solid ${s.border}`}}>
                  {s.label}
                </div>
              </div>
              <div className="stat-n" style={{color:s.color}}>{data.stats[s.key]||0}</div>
              <div className="stat-l">{s.label} Reports</div>
            </div>
          ))}
        </div>

        {/* Filter and table */}
        <div className="card no-hover" style={{padding:0}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <h3 style={{fontWeight:700,fontSize:15,fontFamily:'var(--font-display)'}}>All Reports</h3>
              <span style={{background:'var(--primary-light)',color:'var(--primary)',fontSize:11.5,fontWeight:700,padding:'2px 8px',borderRadius:12}}>{rows.length}</span>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {['', 'Pending', 'In Progress', 'Resolved', 'Rejected'].map(f => (
                <button key={f||'all'} onClick={() => setFilter(f)}
                  className={`btn btn-sm ${filter===f?'btn-primary':'btn-secondary'}`}>
                  {f || 'All'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{padding:24}}>
              {[1,2,3,4,5].map(i=>(
                <div key={i} style={{display:'flex',gap:12,marginBottom:14}}>
                  <div className="skeleton" style={{width:90,height:14}}/>
                  <div className="skeleton" style={{flex:1,height:14}}/>
                  <div className="skeleton" style={{width:70,height:14}}/>
                  <div className="skeleton" style={{width:80,height:22,borderRadius:20}}/>
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <h3>No reports found</h3>
              <p>No reports match the current filter. All approved reports will appear here.</p>
            </div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Report ID</th>
                    <th>Title</th>
                    <th>Reporter</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.report_id}>
                      <td>
                        <span className="mono" style={{color:'var(--primary)',fontWeight:600}}>{r.report_id}</span>
                      </td>
                      <td style={{fontWeight:500,maxWidth:220}}>
                        <span style={{display:'block',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                          {r.title}
                        </span>
                        {r.awaiting_closure && (
                          <span style={{fontSize:10.5,color:'#92400E',background:'#FEF3C7',padding:'1px 6px',borderRadius:4,marginTop:3,display:'inline-block',fontWeight:600}}>
                            ⚠️ Awaiting reporter confirmation
                          </span>
                        )}
                      </td>
                      <td className="text-sm text-gray">{r.author}</td>
                      <td>
                        <span style={{fontSize:12,background:'var(--gray-100)',color:'var(--gray-600)',padding:'3px 8px',borderRadius:6,fontWeight:500}}>
                          {r.category}
                        </span>
                      </td>
                      <td><StatusBadge s={r.status}/></td>
                      <td className="text-sm text-gray">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td>
                        <Link to={`/reports/${r.report_id}`} className="btn btn-primary btn-sm">Manage</Link>
                      </td>
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
