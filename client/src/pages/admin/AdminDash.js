import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import api from '../../services/api';

const Badge = ({ s }) => {
  const m = {Pending:'b-pending','In Progress':'b-progress',Resolved:'b-resolved',Rejected:'b-rejected'};
  return <span className={`badge ${m[s]||'b-pending'}`}>{s}</span>;
};

export default function AdminDash() {
  const [data, setData]   = useState({ reports:[], stats:{} });
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(r=>{
      console.log('\n===== ADMIN DASHBOARD API RESPONSE =====');
      console.log('Reports data:', r.data.reports);
      r.data.reports.slice(0, 3).forEach((report, i) => {
        console.log(`\nReport ${i + 1}:`);
        console.log(`  report_id: "${report.report_id}"`);
        console.log(`  title: "${report.title}" (typeof: ${typeof report.title}, length: ${report.title?.length})`);
        console.log(`  category: "${report.category}"`);
        console.log(`  department: "${report.department}"`);
        console.log(`  title ends with 0? ${report.title?.endsWith('0')}`);
        console.log(`  title + category: "${report.title}${report.category}"`);
      });
      setData(r.data);
    }).finally(()=>setLoading(false));
  }, []);

  const rows = filter ? data.reports.filter(r=>r.status===filter) : data.reports;

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main">
        <h1 className="pg-title">⚙️ Admin Dashboard</h1>
        <p className="pg-sub">Manage reports for your assigned department</p>

        <div className="stats">
          {[
            {l:'Pending',     v:data.stats.pending||0,    c:'#d97706'},
            {l:'In Progress', v:data.stats.inprogress||0, c:'#1e40af'},
            {l:'Resolved',    v:data.stats.resolved||0,   c:'#16a34a'},
          ].map(s=>(
            <div key={s.l} className="stat">
              <div className="stat-n" style={{color:s.c}}>{s.v}</div>
              <div className="stat-l">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="filters">
          <select className="fs" value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option>Pending</option><option>In Progress</option>
            <option>Resolved</option><option>Rejected</option>
          </select>
        </div>

        <div className="card" style={{padding:0}}>
          {loading ? <p style={{padding:22}}>Loading...</p> : rows.length===0
            ? <div className="empty"><h3>No reports found</h3></div>
            : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Report ID</th><th>Title</th><th>Reporter</th><th>Category</th><th>Status</th><th>Date</th><th></th></tr></thead>
                  <tbody>
                    {rows.map(r=>{
                      // Silent logging - check if 0 is in data
                      if (r.title?.endsWith('0')) {
                        console.warn(`⚠️ Title ends with 0: "${r.title}"`);
                      }
                      return (
                      <tr key={r.report_id}>
                        <td className="mono" style={{color:'#1e40af'}}>{r.report_id}</td>
                        <td style={{fontWeight:500}}>
                          {r.title}
                          {r.awaiting_closure&&<span style={{marginLeft:6,fontSize:11,color:'#d97706'}}>⚠️</span>}
                        </td>
                        <td className="text-sm text-gray">{r.author}</td>
                        <td className="text-sm">{r.category}</td>
                        <td><Badge s={r.status}/></td>
                        <td className="text-sm text-gray">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td><Link to={`/reports/${r.report_id}`} className="btn btn-primary btn-sm">Manage</Link></td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      </main>
    </div>
  );
}
