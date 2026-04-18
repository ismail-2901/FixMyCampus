import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import api from '../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function SuperAdminDash() {
  const [tab, setTab]     = useState('stats');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [depts, setDepts]  = useState([]);
  const [search, setSearch] = useState('');
  const [newAdmin, setNA]   = useState({ name:'', email:'', password:'', department_id:'' });
  const [msg, setMsg]       = useState('');
  const [msgType, setMsgType] = useState('ok');

  useEffect(() => {
    api.get('/superadmin/stats').then(r=>setStats(r.data));
    api.get('/reports/departments').then(r=>setDepts(r.data));
  }, []);

  useEffect(() => {
    if (tab==='users')   api.get(`/superadmin/users?search=${search}`).then(r=>setUsers(r.data.users||[]));
    if (tab==='reports') api.get('/superadmin/reports').then(r=>setReports(r.data||[]));
  }, [tab, search]);

  const ban = async (id, ban) => {
    await api.patch(`/superadmin/users/${id}/ban`, { ban });
    setUsers(u => u.map(x => x.user_id===id ? {...x, is_banned:ban} : x));
  };

  const del = async id => {
    if (!window.confirm('Delete this user permanently?')) return;
    await api.delete(`/superadmin/users/${id}`);
    setUsers(u => u.filter(x => x.user_id!==id));
  };

  const createAdmin = async () => {
    setMsg('');
    try {
      await api.post('/superadmin/admins', newAdmin);
      setMsg('✅ Admin created successfully!'); setMsgType('ok');
      setNA({ name:'', email:'', password:'', department_id:'' });
    } catch (e) {
      setMsg(`❌ ${e.response?.data?.error || 'Failed'}`); setMsgType('err');
    }
  };

  const approve = async (id, approve) => {
    await api.patch(`/superadmin/reports/${id}/approve`, { approve });
    setReports(r => r.map(x => x.report_id===id ? {...x, is_approved:approve} : x));
  };

  const tabs = [
    {k:'stats',   l:'📊 Statistics'},
    {k:'users',   l:'👥 Users'},
    {k:'reports', l:'📋 All Reports'},
    {k:'create',  l:'➕ Create Admin'},
  ];

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main">
        <h1 className="pg-title">🛡️ Super Admin Panel</h1>
        <p className="pg-sub">Full system control — users, reports, admins, analytics</p>

        <div className="row mb16" style={{gap:8,flexWrap:'wrap'}}>
          {tabs.map(t=>(
            <button key={t.k} className={`btn btn-sm ${tab===t.k?'btn-primary':'btn-secondary'}`} onClick={()=>setTab(t.k)}>
              {t.l}
            </button>
          ))}
        </div>

        {/* Stats */}
        {tab==='stats' && (
          <>
            {/* Summary Cards */}
            <div className="stats" style={{marginBottom:24}}>
              {[
                {l:'Total Users',    v:stats.users||0,   c:'#3b82f6', bg:'#dbeafe'},
                {l:'All Reports',  v:stats.reports||0,  c:'#8b5cf6', bg:'#ede9fe'},
                {l:'Pending',  v:stats.pending||0,  c:'#f59e0b', bg:'#fef3c7'},
                {l:'Resolved', v:stats.resolved||0, c:'#10b981', bg:'#d1fae5'},
                {l:'Total Admins',   v:stats.admins||0,   c:'#06b6d4', bg:'#cffafe'},
              ].map(s=>(
                <div key={s.l} className="stat" style={{background:s.bg,borderRadius:12,padding:16}}>
                  <div className="stat-n" style={{color:s.c,fontSize:28,fontWeight:700}}>{s.v}</div>
                  <div className="stat-l" style={{color:s.c,fontSize:13,fontWeight:600}}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Charts Row 1 */}
            <div className="row" style={{gap:16,marginBottom:24,flexWrap:'wrap'}}>
              {/* Departments Bar Chart */}
              {stats.byDept?.length>0 && (
                <div className="card" style={{flex:1,minWidth:400}}>
                  <h3 style={{fontWeight:700,marginBottom:12}}>📊 Reports by Department</h3>
                  <Bar
                    data={{
                      labels: stats.byDept.map(d=>d.name),
                      datasets: [{
                        label: 'Reports',
                        data: stats.byDept.map(d=>d.count),
                        backgroundColor: [
                          '#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981',
                          '#06b6d4','#ef4444','#6366f1','#14b8a6','#f97316'
                        ],
                        borderColor: '#fff',
                        borderWidth: 2,
                        borderRadius: 6,
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {display:false},
                        tooltip: {backgroundColor:'rgba(0,0,0,0.8)',padding:12,titleFont:{size:13,weight:'bold'},bodyFont:{size:12}}
                      },
                      scales: {
                        y: {beginAtZero:true,grid:{color:'rgba(0,0,0,0.05)'},ticks:{font:{size:11}}}
                      }
                    }}
                  />
                </div>
              )}

              {/* Categories Bar Chart */}
              {stats.byCat?.length>0 && (
                <div className="card" style={{flex:1,minWidth:400}}>
                  <h3 style={{fontWeight:700,marginBottom:12}}>📋 Reports by Category</h3>
                  <Bar
                    data={{
                      labels: stats.byCat.map(c=>c.name),
                      datasets: [{
                        label: 'Count',
                        data: stats.byCat.map(c=>c.count),
                        backgroundColor: [
                          '#ef4444','#f97316','#eab308','#84cc16','#22c55e',
                          '#10b981','#14b8a6','#06b6d4','#0ea5e9','#3b82f6'
                        ],
                        borderColor: '#fff',
                        borderWidth: 2,
                        borderRadius: 6,
                      }]
                    }}
                    options={{
                      indexAxis: 'y',
                      responsive: true,
                      plugins: {
                        legend: {display:false},
                        tooltip: {backgroundColor:'rgba(0,0,0,0.8)',padding:12}
                      },
                      scales: {
                        x: {beginAtZero:true,grid:{color:'rgba(0,0,0,0.05)'},ticks:{font:{size:11}}}
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Charts Row 2 - Status Distribution */}
            <div className="row" style={{gap:16,marginBottom:24,flexWrap:'wrap'}}>
              {/* Report Status Pie Chart */}
              <div className="card" style={{flex:1,minWidth:300,display:'flex',flexDirection:'column',alignItems:'center'}}>
                <h3 style={{fontWeight:700,marginBottom:12,width:'100%'}}>🎯 Report Status Distribution</h3>
                <div style={{width:'100%',height:300}}>
                  <Doughnut
                    data={{
                      labels: ['Approved', 'Pending', 'Rejected'],
                      datasets: [{
                        data: [stats.resolved||0, stats.pending||0, (stats.reports||0)-(stats.resolved||0)-(stats.pending||0)],
                        backgroundColor: ['#10b981','#f59e0b','#ef4444'],
                        borderColor: '#fff',
                        borderWidth: 2,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {position:'bottom',labels:{padding:15,font:{size:12,weight:'bold'}}}
                      }
                    }}
                  />
                </div>
              </div>

              {/* Statistics Summary Table */}
              <div className="card" style={{flex:1,minWidth:300}}>
                <h3 style={{fontWeight:700,marginBottom:16}}>📈 Quick Stats</h3>
                <table className="tbl" style={{width:'100%'}}>
                  <tbody>
                    <tr style={{borderBottom:'1px solid #f3f4f6'}}>
                      <td style={{padding:10,fontWeight:600,color:'#6b7280'}}>Active Users</td>
                      <td style={{padding:10,fontWeight:700,color:'#3b82f6'}}>{stats.users||0}</td>
                    </tr>
                    <tr style={{borderBottom:'1px solid #f3f4f6'}}>
                      <td style={{padding:10,fontWeight:600,color:'#6b7280'}}>Total Reports</td>
                      <td style={{padding:10,fontWeight:700,color:'#8b5cf6'}}>{stats.reports||0}</td>
                    </tr>
                    <tr style={{borderBottom:'1px solid #f3f4f6'}}>
                      <td style={{padding:10,fontWeight:600,color:'#6b7280'}}>Pending Review</td>
                      <td style={{padding:10,fontWeight:700,color:'#f59e0b'}}>{stats.pending||0}</td>
                    </tr>
                    <tr style={{borderBottom:'1px solid #f3f4f6'}}>
                      <td style={{padding:10,fontWeight:600,color:'#6b7280'}}>Approved/Resolved</td>
                      <td style={{padding:10,fontWeight:700,color:'#10b981'}}>{stats.resolved||0}</td>
                    </tr>
                    <tr>
                      <td style={{padding:10,fontWeight:600,color:'#6b7280'}}>Total Admins</td>
                      <td style={{padding:10,fontWeight:700,color:'#06b6d4'}}>{stats.admins||0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Tables */}
            {stats.byDept?.length>0 && (
              <div className="card" style={{marginBottom:16}}>
                <h3 style={{fontWeight:700,marginBottom:12}}>📊 Department Reports Breakdown</h3>
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead>
                      <tr style={{background:'#f9fafb'}}>
                        <th style={{padding:12,fontWeight:700,color:'#374151'}}>Department</th>
                        <th style={{padding:12,fontWeight:700,color:'#374151',textAlign:'center'}}>Reports</th>
                        <th style={{padding:12,fontWeight:700,color:'#374151',textAlign:'center'}}>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.byDept.map((d,i)=>(
                        <tr key={d.name} style={{borderBottom:'1px solid #f3f4f6',background:i%2?'#f9fafb':'#fff'}}>
                          <td style={{padding:12,fontWeight:500}}>{d.name}</td>
                          <td style={{padding:12,textAlign:'center',fontWeight:600,color:'#3b82f6'}}>{d.count}</td>
                          <td style={{padding:12,textAlign:'center'}}>
                            <div style={{background:'#dbeafe',color:'#1e40af',padding:'4px 8px',borderRadius:4,display:'inline-block',fontSize:12,fontWeight:600}}>
                              {((d.count/(stats.reports||1))*100).toFixed(1)}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {stats.byCat?.length>0 && (
              <div className="card">
                <h3 style={{fontWeight:700,marginBottom:12}}>📋 Category Reports Breakdown</h3>
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead>
                      <tr style={{background:'#f9fafb'}}>
                        <th style={{padding:12,fontWeight:700,color:'#374151'}}>Category</th>
                        <th style={{padding:12,fontWeight:700,color:'#374151',textAlign:'center'}}>Reports</th>
                        <th style={{padding:12,fontWeight:700,color:'#374151',textAlign:'center'}}>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.byCat.map((c,i)=>(
                        <tr key={c.name} style={{borderBottom:'1px solid #f3f4f6',background:i%2?'#f9fafb':'#fff'}}>
                          <td style={{padding:12,fontWeight:500}}>{c.name}</td>
                          <td style={{padding:12,textAlign:'center',fontWeight:600,color:'#8b5cf6'}}>{c.count}</td>
                          <td style={{padding:12,textAlign:'center'}}>
                            <div style={{background:'#ede9fe',color:'#6d28d9',padding:'4px 8px',borderRadius:4,display:'inline-block',fontSize:12,fontWeight:600}}>
                              {((c.count/(stats.reports||1))*100).toFixed(1)}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Users */}
        {tab==='users' && (
          <div className="card" style={{padding:0}}>
            <div style={{padding:14,borderBottom:'1px solid #f3f4f6'}}>
              <input className="fi" style={{maxWidth:300}} placeholder="🔍 Search name or email..."
                value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>ANON-ID</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map(u=>(
                    <tr key={u.user_id}>
                      <td style={{fontWeight:500}}>{u.name}</td>
                      <td className="text-sm">{u.email}</td>
                      <td><span className="badge" style={{background:'#dbeafe',color:'#1e40af'}}>{u.role}</span></td>
                      <td className="mono">{u.anon_id}</td>
                      <td>{u.is_banned
                        ? <span className="badge b-rejected">Banned</span>
                        : <span className="badge b-resolved">Active</span>}
                      </td>
                      <td>
                        <div className="row" style={{gap:6}}>
                          <button className={`btn btn-sm ${u.is_banned?'btn-success':'btn-danger'}`}
                            onClick={()=>ban(u.user_id,!u.is_banned)}>
                            {u.is_banned?'Unban':'Ban'}
                          </button>
                          {u.role!=='superadmin' && (
                            <button className="btn btn-danger btn-sm" onClick={()=>del(u.user_id)}>Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports */}
        {tab==='reports' && (
          <div className="card" style={{padding:0}}>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Report ID</th><th>Title</th><th>Author</th><th>Dept</th><th>Status</th><th>Approved</th><th>Action</th></tr></thead>
                <tbody>
                  {reports.map(r=>(
                    <tr key={r.report_id}>
                      <td className="mono">{r.report_id}</td>
                      <td style={{fontWeight:500}}>{r.title}</td>
                      <td className="text-sm text-gray">{r.author}</td>
                      <td className="text-sm">{r.department}</td>
                      <td><span className={`badge b-${r.status.toLowerCase().replace(' ','-').replace(' ','')}`}>{r.status}</span></td>
                      <td>{r.is_approved?'✅':'❌'}</td>
                      <td>
                        <button className={`btn btn-sm ${r.is_approved?'btn-danger':'btn-success'}`}
                          onClick={()=>approve(r.report_id,!r.is_approved)}>
                          {r.is_approved?'Hide':'Approve'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Admin */}
        {tab==='create' && (
          <div className="card" style={{maxWidth:480}}>
            <h3 style={{fontWeight:700,marginBottom:16}}>Create Department Admin Account</h3>
            {msg && <div className={`alert alert-${msgType==='ok'?'ok':'err'}`}>{msg}</div>}
            <div className="fg"><label className="fl">Full Name</label>
              <input className="fi" value={newAdmin.name} onChange={e=>setNA({...newAdmin,name:e.target.value})}/></div>
            <div className="fg"><label className="fl">DIU Email (@diu.edu.bd)</label>
              <input className="fi" type="email" placeholder="admin@diu.edu.bd" value={newAdmin.email} onChange={e=>setNA({...newAdmin,email:e.target.value})}/></div>
            <div className="fg"><label className="fl">Password</label>
              <input className="fi" type="password" value={newAdmin.password} onChange={e=>setNA({...newAdmin,password:e.target.value})}/></div>
            <div className="fg"><label className="fl">Assign Department</label>
              <select className="fs" value={newAdmin.department_id} onChange={e=>setNA({...newAdmin,department_id:e.target.value})}>
                <option value="">— Select department —</option>
                {depts.map(d=><option key={d.department_id} value={d.department_id}>{d.name}</option>)}
              </select></div>
            <button className="btn btn-primary" onClick={createAdmin}>Create Admin Account</button>
          </div>
        )}
      </main>
    </div>
  );
}
