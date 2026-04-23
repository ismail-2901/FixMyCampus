import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopBar  from '../../components/layout/TopBar';
import { io } from 'socket.io-client';
import api from '../../services/api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const chartOpts = (horizontal=false) => ({
  responsive:true, maintainAspectRatio:false,
  indexAxis: horizontal?'y':'x',
  plugins:{
    legend:{display:false},
    tooltip:{backgroundColor:'rgba(15,14,47,0.9)',padding:12,titleFont:{size:12,weight:'bold'},bodyFont:{size:12},cornerRadius:8}
  },
  scales:{
    x:{beginAtZero:true,grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:11},color:'#9B98C0'}},
    y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:11},color:'#9B98C0'}}
  }
});

const doughnutOpts = {
  responsive:true, maintainAspectRatio:false, cutout:'65%',
  plugins:{
    legend:{position:'bottom',labels:{padding:16,font:{size:12,weight:'600'},color:'#4A4770'}},
    tooltip:{backgroundColor:'rgba(15,14,47,0.9)',padding:12}
  }
};

export default function SuperAdminDash() {
  const [tab, setTab]       = useState('stats');
  const [stats, setStats]   = useState({});
  const [users, setUsers]   = useState([]);
  const [reports, setReports] = useState([]);
  const [depts, setDepts]   = useState([]);
  const [search, setSearch] = useState('');
  const [newAdmin, setNA]   = useState({ name:'', email:'', password:'', department_id:'' });
  const [msg, setMsg]       = useState('');
  const [msgType, setMsgType] = useState('ok');
  const [loading, setLoading] = useState(false);
  const [approveModal, setApproveModal] = useState(null);

  useEffect(() => {
    api.get('/superadmin/stats').then(r => setStats(r.data));
    api.get('/reports/departments').then(r => setDepts(r.data));
  }, []);

  // Real-time: refresh stats and reports list when notifications arrive
  useEffect(() => {
    const token = localStorage.getItem('fmc_token');
    const sock = io(`http://${window.location.hostname}:5002`, { auth:{ token } });
    sock.on('notification', () => {
      api.get('/superadmin/stats').then(r => setStats(r.data));
      if (tab === 'reports') api.get('/superadmin/reports').then(r => setReports(r.data||[]));
    });
    return () => sock.disconnect();
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    if (tab==='users')   api.get(`/superadmin/users?search=${search}`).then(r => setUsers(r.data.users||[])).finally(()=>setLoading(false));
    if (tab==='reports') api.get('/superadmin/reports').then(r => setReports(r.data||[])).finally(()=>setLoading(false));
    if (tab!=='users'&&tab!=='reports') setLoading(false);
  }, [tab, search]);

  const ban = async (id, isBan) => {
    await api.patch(`/superadmin/users/${id}/ban`, { ban:isBan });
    setUsers(u => u.map(x => x.user_id===id ? {...x,is_banned:isBan} : x));
  };

  const del = async id => {
    if (!window.confirm('Permanently delete this user?')) return;
    await api.delete(`/superadmin/users/${id}`);
    setUsers(u => u.filter(x => x.user_id!==id));
  };

  const createAdmin = async () => {
    setMsg('');
    try {
      await api.post('/superadmin/admins', newAdmin);
      setMsg('Admin account created successfully!'); setMsgType('ok');
      setNA({ name:'', email:'', password:'', department_id:'' });
    } catch(e) {
      setMsg(e.response?.data?.error || 'Failed to create admin'); setMsgType('err');
    }
  };

  const doApprove = async (id, approved) => {
    await api.patch(`/superadmin/reports/${id}/approve`, { approve:approved });
    setReports(r => r.map(x => x.report_id===id ? {...x,is_approved:approved?1:0} : x));
    setApproveModal(null);
  };

  const summaryCards = [
    { label:'Total Students', value:stats.users||0,    color:'#6366F1', bg:'#EEF2FF', icon:'👨‍🎓' },
    { label:'All Reports',    value:stats.reports||0,  color:'#8B5CF6', bg:'#EDE9FE', icon:'📋' },
    { label:'Pending Approval',value:stats.pending||0, color:'#F59E0B', bg:'#FEF3C7', icon:'⏳' },
    { label:'Resolved',       value:stats.resolved||0, color:'#10B981', bg:'#D1FAE5', icon:'✅' },
    { label:'Active Admins',  value:stats.admins||0,   color:'#06B6D4', bg:'#CFFAFE', icon:'👮' },
  ];

  const tabs = [
    { k:'stats',   label:'📊 Statistics',     desc:'Platform overview' },
    { k:'reports', label:'📋 All Reports',     desc:'Review & approve' },
    { k:'users',   label:'👥 User Management', desc:'Ban & delete' },
    { k:'create',  label:'➕ Create Admin',    desc:'Add department admin' },
  ];

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main">
        <TopBar title="Super Admin Panel"/>
        <div style={{marginBottom:24}}>
          <h1 className="pg-title">🛡️ Super Admin Panel</h1>
          <p className="pg-sub">Full system control — reports, users, admins, analytics</p>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:24}}>
          {tabs.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{
              padding:'10px 18px', borderRadius:12, border:'1.5px solid',
              borderColor: tab===t.k ? 'var(--primary)' : 'var(--gray-200)',
              background: tab===t.k ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : '#fff',
              color: tab===t.k ? '#fff' : 'var(--gray-600)',
              fontWeight:600, fontSize:13, cursor:'pointer',
              fontFamily:'var(--font-body)', transition:'all .2s',
              boxShadow: tab===t.k ? '0 4px 14px rgba(99,102,241,0.35)' : 'var(--shadow-xs)',
              display:'flex', flexDirection:'column', alignItems:'flex-start', gap:1,
            }}>
              <span>{t.label}</span>
              <span style={{fontSize:11,fontWeight:400,opacity:0.75}}>{t.desc}</span>
            </button>
          ))}
        </div>

        {/* ── STATISTICS ── */}
        {tab==='stats' && (
          <>
            <div className="stats" style={{gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))'}}>
              {summaryCards.map(s => (
                <div key={s.label} className="stat" style={{borderTop:`3px solid ${s.color}`}}>
                  <div style={{width:42,height:42,background:s.bg,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:10}}>{s.icon}</div>
                  <div className="stat-n" style={{color:s.color}}>{s.value}</div>
                  <div className="stat-l">{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
              {stats.byDept?.length>0 && (
                <div className="card" style={{height:320}}>
                  <h3 style={{fontWeight:700,marginBottom:14,fontSize:14,fontFamily:'var(--font-display)'}}>📊 Reports by Department</h3>
                  <div style={{height:250}}>
                    <Bar data={{
                      labels:stats.byDept.map(d=>d.name),
                      datasets:[{label:'Reports',data:stats.byDept.map(d=>d.count),
                        backgroundColor:['#6366F1','#8B5CF6','#EC4899','#F59E0B','#10B981','#06B6D4','#EF4444'],
                        borderRadius:6,borderSkipped:false}]
                    }} options={chartOpts()}/>
                  </div>
                </div>
              )}
              {stats.byCat?.length>0 && (
                <div className="card" style={{height:320}}>
                  <h3 style={{fontWeight:700,marginBottom:14,fontSize:14,fontFamily:'var(--font-display)'}}>📋 Reports by Category</h3>
                  <div style={{height:250}}>
                    <Bar data={{
                      labels:stats.byCat.map(c=>c.name),
                      datasets:[{label:'Count',data:stats.byCat.map(c=>c.count),
                        backgroundColor:['#EF4444','#F97316','#EAB308','#84CC16','#22C55E','#14B8A6','#06B6D4','#3B82F6','#8B5CF6'],
                        borderRadius:6,borderSkipped:false}]
                    }} options={chartOpts(true)}/>
                  </div>
                </div>
              )}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div className="card" style={{display:'flex',flexDirection:'column',alignItems:'center',height:300}}>
                <h3 style={{fontWeight:700,marginBottom:14,fontSize:14,fontFamily:'var(--font-display)',width:'100%'}}>🎯 Status Distribution</h3>
                <div style={{height:230,width:'100%'}}>
                  <Doughnut data={{
                    labels:['Resolved','Pending','In Progress'],
                    datasets:[{
                      data:[stats.resolved||0, stats.pending||0,
                        Math.max(0,(stats.reports||0)-(stats.resolved||0)-(stats.pending||0))],
                      backgroundColor:['#10B981','#F59E0B','#3B82F6'],
                      borderColor:'#fff',borderWidth:2,
                    }]
                  }} options={doughnutOpts}/>
                </div>
              </div>
              <div className="card">
                <h3 style={{fontWeight:700,marginBottom:14,fontSize:14,fontFamily:'var(--font-display)'}}>📈 Quick Stats</h3>
                {[
                  {label:'Total Students/Staff', value:stats.users||0,    color:'var(--primary)'},
                  {label:'Total Reports',         value:stats.reports||0,  color:'var(--accent)'},
                  {label:'Pending Approval',       value:stats.pending||0,  color:'#F59E0B'},
                  {label:'Resolved',               value:stats.resolved||0, color:'#10B981'},
                  {label:'Active Dept Admins',      value:stats.admins||0,   color:'#06B6D4'},
                ].map(item => (
                  <div key={item.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--gray-100)'}}>
                    <span style={{fontSize:13,color:'var(--gray-600)'}}>{item.label}</span>
                    <span style={{fontSize:16,fontWeight:700,color:item.color}}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── ALL REPORTS ── */}
        {tab==='reports' && (
          <>
            {approveModal && (
              <div className="modal-overlay" onClick={() => setApproveModal(null)}>
                <div className="modal-box" onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>{approveModal.action==='approve' ? '✅ Approve Report' : '❌ Reject Report'}</h2>
                    <button className="modal-close" onClick={() => setApproveModal(null)}>✕</button>
                  </div>
                  <div className="modal-body">
                    <p style={{fontSize:14,color:'var(--gray-600)',lineHeight:1.6}}>
                      {approveModal.action==='approve'
                        ? `Approving "${approveModal.title}" will assign it to the department admin and notify the student.`
                        : `Rejecting "${approveModal.title}" will notify the student that their report was not approved.`}
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary btn-sm" onClick={() => setApproveModal(null)}>Cancel</button>
                    <button
                      className={`btn btn-sm ${approveModal.action==='approve'?'btn-success':'btn-danger'}`}
                      onClick={() => doApprove(approveModal.id, approveModal.action==='approve')}>
                      {approveModal.action==='approve' ? 'Yes, Approve' : 'Yes, Reject'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="card no-hover" style={{padding:0}}>
              <div style={{padding:'16px 20px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',gap:8}}>
                <h3 style={{fontWeight:700,fontSize:15,fontFamily:'var(--font-display)'}}>All Reports</h3>
                <span style={{background:'var(--primary-light)',color:'var(--primary)',fontSize:11.5,fontWeight:700,padding:'2px 8px',borderRadius:12}}>{reports.length}</span>
                <div style={{marginLeft:'auto',fontSize:12,color:'var(--gray-400)'}}>
                  <span style={{color:'#10B981',fontWeight:700}}>{reports.filter(r=>r.is_approved).length}</span> approved ·{' '}
                  <span style={{color:'#F59E0B',fontWeight:700}}>{reports.filter(r=>!r.is_approved).length}</span> pending
                </div>
              </div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr><th>ID</th><th>Title</th><th>Author</th><th>Dept</th><th>Status</th><th>Approval</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r.report_id}>
                        <td><span className="mono" style={{color:'var(--primary)',fontSize:12}}>{r.report_id}</span></td>
                        <td style={{fontWeight:500,maxWidth:220}}>
                          <span style={{display:'block',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.title}</span>
                        </td>
                        <td className="text-sm text-gray" style={{fontFamily:'monospace'}}>{r.author}</td>
                        <td className="text-sm">
                          <span style={{fontSize:11.5,background:'var(--gray-100)',color:'var(--gray-600)',padding:'2px 7px',borderRadius:5,fontWeight:500}}>{r.department}</span>
                        </td>
                        <td><span className={`badge b-${r.status.toLowerCase().replace(/ /g,'-')}`}>{r.status}</span></td>
                        <td>
                          {r.is_approved
                            ? <span className="badge" style={{background:'#D1FAE5',color:'#065F46'}}>✅ Approved</span>
                            : <span className="badge" style={{background:'#FEF3C7',color:'#92400E'}}>⏳ Pending</span>}
                        </td>
                        <td>
                          <div style={{display:'flex',gap:6,alignItems:'center'}}>
                            {/* View Details — opens report to verify before approving */}
                            <Link to={`/reports/${r.report_id}`} className="btn btn-secondary btn-sm">
                              View
                            </Link>
                            {!r.is_approved
                              ? <button className="btn btn-success btn-sm"
                                  onClick={() => setApproveModal({id:r.report_id,title:r.title,action:'approve'})}>
                                  Approve
                                </button>
                              : <button className="btn btn-danger btn-sm"
                                  onClick={() => setApproveModal({id:r.report_id,title:r.title,action:'reject'})}>
                                  Revoke
                                </button>
                            }
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── USERS ── */}
        {tab==='users' && (
          <div className="card no-hover" style={{padding:0}}>
            <div style={{padding:'14px 20px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',gap:10}}>
              <input className="fi" style={{maxWidth:280}} placeholder="🔍 Search name or email…"
                value={search} onChange={e => setSearch(e.target.value)}/>
              <span style={{fontSize:12.5,color:'var(--gray-400)',marginLeft:'auto'}}>{users.length} users</span>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>ANON-ID</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.user_id}>
                      <td style={{fontWeight:600}}>
                        {/* Removed avatar letter circle — just show the name */}
                        {u.name}
                      </td>
                      <td className="text-sm" style={{color:'var(--gray-500)'}}>{u.email}</td>
                      <td>
                        <span className="badge" style={{background:'var(--primary-light)',color:'var(--primary-dark)'}}>{u.role}</span>
                      </td>
                      <td className="mono" style={{fontSize:12}}>{u.anon_id}</td>
                      <td>
                        {u.is_banned
                          ? <span className="badge b-rejected">Banned</span>
                          : <span className="badge b-resolved">Active</span>}
                      </td>
                      <td>
                        <div style={{display:'flex',gap:6}}>
                          <button className={`btn btn-sm ${u.is_banned?'btn-success':'btn-warning'}`}
                            onClick={() => ban(u.user_id, !u.is_banned)}>
                            {u.is_banned ? 'Unban' : 'Ban'}
                          </button>
                          {u.role !== 'superadmin' && (
                            <button className="btn btn-danger btn-sm" onClick={() => del(u.user_id)}>Delete</button>
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

        {/* ── CREATE ADMIN ── */}
        {tab==='create' && (
          <div style={{display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'0 16px'}}>
            <div style={{width:'100%',maxWidth:520}}>
              <div className="card">
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                  <div style={{width:42,height:42,background:'linear-gradient(135deg,#6366F1,#8B5CF6)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>👮</div>
                  <div>
                    <h3 style={{fontWeight:700,fontSize:15,fontFamily:'var(--font-display)'}}>Create Department Admin</h3>
                    <p style={{fontSize:12.5,color:'var(--gray-500)',marginTop:2}}>Admin accounts manage reports for their assigned department</p>
                  </div>
                </div>

                {msg && <div className={`alert alert-${msgType==='ok'?'ok':'err'}`}>{msg}</div>}

                <div className="fg">
                  <label className="fl">Full Name</label>
                  <input className="fi" placeholder="Admin's full name"
                    value={newAdmin.name} onChange={e => setNA({...newAdmin,name:e.target.value})}/>
                </div>
                <div className="fg">
                  <label className="fl">DIU Email (@diu.edu.bd)</label>
                  <input className="fi" type="email" placeholder="admin@diu.edu.bd"
                    value={newAdmin.email} onChange={e => setNA({...newAdmin,email:e.target.value})}/>
                </div>
                <div className="fg">
                  <label className="fl">Password</label>
                  <input className="fi" type="password" placeholder="Minimum 6 characters"
                    value={newAdmin.password} onChange={e => setNA({...newAdmin,password:e.target.value})}/>
                </div>
                <div className="fg">
                  <label className="fl">Assign Department</label>
                  <select className="fs" value={newAdmin.department_id}
                    onChange={e => setNA({...newAdmin,department_id:e.target.value})}>
                    <option value="">— Select department —</option>
                    {depts.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
                  </select>
                </div>
                <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={createAdmin}>
                  Create Admin Account
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
