import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import api from '../../services/api';

const Badge = ({ s }) => {
  const m = {Pending:'b-pending','In Progress':'b-progress',Resolved:'b-resolved',Rejected:'b-rejected'};
  return <span className={`badge ${m[s]||'b-pending'}`}>{s}</span>;
};

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter]   = useState({ status:'', search:'' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const p = new URLSearchParams();
    if (filter.status) p.set('status', filter.status);
    if (filter.search) p.set('search', filter.search);
    api.get(`/reports?${p}`).then(r=>setReports(r.data.reports||[])).finally(()=>setLoading(false));
  }, [filter]);

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main">
        <div className="row jb mb8">
          <h1 className="pg-title">📋 My Reports</h1>
          <Link to="/report" className="btn btn-primary btn-sm">+ New Report</Link>
        </div>
        <p className="pg-sub">Track all your submitted campus issues</p>

        <div className="filters">
          <input className="fi" placeholder="🔍 Search..." value={filter.search}
            onChange={e=>setFilter({...filter,search:e.target.value})}/>
          <select className="fs" value={filter.status} onChange={e=>setFilter({...filter,status:e.target.value})}>
            <option value="">All Statuses</option>
            <option>Pending</option><option>In Progress</option>
            <option>Resolved</option><option>Rejected</option>
          </select>
        </div>

        <div className="card" style={{padding:0}}>
          {loading ? <p style={{padding:22}}>Loading...</p> : reports.length===0 ? (
            <div className="empty"><h3>No reports found</h3><p>Try a different filter, or submit a new report</p></div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Report ID</th><th>Title</th><th>Category</th><th>Department</th><th>Status</th><th>Date</th><th></th></tr></thead>
                <tbody>
                  {reports.map(r=>{
                    // Silent logging - check if 0 is in data
                    if (r.title?.endsWith('0')) {
                      console.warn(`⚠️ Title ends with 0: "${r.title}"`);
                    }
                    return (
                    <tr key={r.report_id}>
                      <td className="mono" style={{color:'#1e40af'}}>{r.report_id}</td>
                      <td style={{fontWeight:500}}>
                        {r.title}
                        {r.awaiting_closure && <span style={{marginLeft:6,fontSize:11,color:'#d97706'}}>⚠️ Reply needed</span>}
                      </td>
                      <td className="text-sm text-gray">{r.category}</td>
                      <td className="text-sm text-gray">{r.department}</td>
                      <td><Badge s={r.status}/></td>
                      <td className="text-sm text-gray">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td><Link to={`/reports/${r.report_id}`} className="btn btn-secondary btn-sm">View</Link></td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
