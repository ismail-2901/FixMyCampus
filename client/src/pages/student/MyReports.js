import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import Sidebar from '../../components/layout/Sidebar';
import TopBar  from '../../components/layout/TopBar';
import api from '../../services/api';

const StatusBadge = ({ s }) => {
  const m = { Pending:'b-pending','In Progress':'b-progress',Resolved:'b-resolved',Rejected:'b-rejected' };
  return <span className={`badge ${m[s]||'b-pending'}`}>{s}</span>;
};

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [filter,  setFilter]  = useState({ status:'', search:'' });
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const load = (f = filter) => {
    setLoading(true);
    const p = new URLSearchParams();
    if (f.status) p.set('status', f.status);
    if (f.search) p.set('search', f.search);
    api.get(`/reports?${p}`).then(r => setReports(r.data.reports||[])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  // Real-time: refresh when any of the user's reports gets updated
  useEffect(() => {
    const token = localStorage.getItem('fmc_token');
    const baseURL = `http://${window.location.hostname}:5002`;
    socketRef.current = io(baseURL, { auth:{ token } });
    socketRef.current.on('notification', () => load());
    return () => socketRef.current?.disconnect();
  }, []);

  const statusCounts = reports.reduce((acc,r) => { acc[r.status]=(acc[r.status]||0)+1; return acc; }, {});

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main">
        <TopBar title="My Reports"/>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
          <h1 className="pg-title">📋 My Reports</h1>
          <Link to="/report" className="btn btn-primary btn-sm">+ New Report</Link>
        </div>
        <p className="pg-sub">Track all your submitted campus issues in real-time</p>

        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>
          {[
            {label:'All',      val:reports.length,               color:'var(--primary)',  bg:'var(--primary-light)'},
            {label:'Pending',  val:statusCounts['Pending']||0,   color:'#92400E',         bg:'#FEF3C7'},
            {label:'Progress', val:statusCounts['In Progress']||0,color:'#1D4ED8',        bg:'#DBEAFE'},
            {label:'Resolved', val:statusCounts['Resolved']||0,  color:'#065F46',         bg:'#D1FAE5'},
            {label:'Rejected', val:statusCounts['Rejected']||0,  color:'#991B1B',         bg:'#FEE2E2'},
          ].map(s => (
            <div key={s.label} style={{background:s.bg,color:s.color,padding:'5px 14px',borderRadius:20,fontSize:12.5,fontWeight:700,display:'flex',gap:6,alignItems:'center'}}>
              <span>{s.val}</span><span style={{fontWeight:500,opacity:0.8}}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="filters">
          <input className="fi" placeholder="🔍 Search reports…" value={filter.search}
            onChange={e => setFilter({...filter,search:e.target.value})} style={{maxWidth:260}}/>
          <select className="fs" value={filter.status} onChange={e => setFilter({...filter,status:e.target.value})} style={{width:'auto'}}>
            <option value="">All Statuses</option>
            <option>Pending</option><option>In Progress</option>
            <option>Resolved</option><option>Rejected</option>
          </select>
        </div>

        <div className="card no-hover" style={{padding:0}}>
          {loading ? (
            <div style={{padding:24}}>{[1,2,3,4].map(i=>(
              <div key={i} style={{display:'flex',gap:12,marginBottom:14}}>
                <div className="skeleton" style={{width:90,height:14}}/><div className="skeleton" style={{flex:1,height:14}}/>
                <div className="skeleton" style={{width:70,height:14}}/><div className="skeleton" style={{width:70,height:22,borderRadius:20}}/>
              </div>
            ))}</div>
          ) : reports.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <h3>No reports found</h3>
              <p>Try a different filter, or submit a new report.</p>
              <Link to="/report" className="btn btn-primary btn-sm" style={{marginTop:14}}>Submit First Report</Link>
            </div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Report ID</th><th>Title</th><th>Category</th><th>Department</th><th>Status</th><th>Date</th><th></th></tr></thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r.report_id}>
                      <td><span className="mono" style={{color:'var(--primary)',fontWeight:600}}>{r.report_id}</span></td>
                      <td style={{fontWeight:500,maxWidth:200}}>
                        <span style={{display:'block',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.title}</span>
                        {!!r.awaiting_closure && <span style={{fontSize:11,color:'#92400E',background:'#FEF3C7',padding:'1px 6px',borderRadius:4,marginTop:2,display:'inline-block',fontWeight:600}}>⚠️ Awaiting your response</span>}
                      </td>
                      <td className="text-sm text-gray">{r.category}</td>
                      <td className="text-sm text-gray">{r.department}</td>
                      <td><StatusBadge s={r.status}/></td>
                      <td className="text-sm text-gray">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td><Link to={`/reports/${r.report_id}`} className="btn btn-secondary btn-sm">View</Link></td>
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
