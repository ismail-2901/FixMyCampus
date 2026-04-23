import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import TopBar  from '../../components/layout/TopBar';
import api from '../../services/api';

function formatDuration(hours) {
  if (!hours || hours <= 0) return '< 1h';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const rem  = hours % 24;
  return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
}

function SpeedBadge({ hours }) {
  const fast   = hours !== null && hours <= 24;
  const medium = hours !== null && hours > 24 && hours <= 72;
  const slow   = hours === null || hours > 72;
  const bg    = fast ? 'rgba(16,185,129,0.15)'  : medium ? 'rgba(245,158,11,0.15)'  : 'rgba(239,68,68,0.12)';
  const color = fast ? '#065F46'                : medium ? '#92400E'               : '#991B1B';
  const label = fast ? '⚡ Fast'               : medium ? '⏳ Normal'              : '🐢 Slow';
  return (
    <span style={{ fontSize:11.5, fontWeight:700, padding:'3px 9px', borderRadius:20, background:bg, color }}>
      {label} · {formatDuration(hours)}
    </span>
  );
}

export default function Transparency() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState({ dept:'', search:'' });

  useEffect(() => {
    api.get('/reports/public').then(r => setReports(r.data || [])).finally(() => setLoading(false));
  }, []);

  const depts    = [...new Set(reports.map(r => r.department).filter(Boolean))].sort();
  const filtered = reports.filter(r => {
    const matchDept   = !filter.dept   || r.department === filter.dept;
    const matchSearch = !filter.search || r.title.toLowerCase().includes(filter.search.toLowerCase());
    return matchDept && matchSearch;
  });

  // Sidebar dark background colour for cards
  const DARK = '#0F0F23';

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main">
        <TopBar title="Transparency Board"/>

        {/* Header */}
        <div style={{marginBottom:20}}>
          <h1 className="pg-title">🌐 Public Transparency Board</h1>
          <p className="pg-sub">Every resolved campus issue — published anonymously to show real accountability</p>
        </div>

        {/* Hero stats bar — sidebar-coloured */}
        <div style={{
          background:DARK,
          borderRadius:16, padding:'22px 28px', marginBottom:24,
          display:'flex', alignItems:'center', gap:32, flexWrap:'wrap',
        }}>
          <div style={{flex:1,minWidth:160}}>
            <div style={{fontSize:34,fontWeight:800,color:'#fff',fontFamily:'var(--font-display)',lineHeight:1}}>
              {loading ? '—' : reports.length}
            </div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginTop:4}}>Total issues resolved</div>
          </div>
          {[
            { label:'Resolved fast (≤24h)',   value: reports.filter(r=>r.hours_taken<=24).length,               color:'#34D399' },
            { label:'Resolved normal (≤72h)',  value: reports.filter(r=>r.hours_taken>24&&r.hours_taken<=72).length, color:'#FBBF24' },
            { label:'Departments active',     value: new Set(reports.map(r=>r.department)).size,                 color:'#818CF8' },
          ].map(s => (
            <div key={s.label} style={{textAlign:'center',padding:'0 8px'}}>
              <div style={{fontSize:26,fontWeight:800,color:s.color,fontFamily:'var(--font-display)',lineHeight:1}}>{s.value}</div>
              <div style={{fontSize:11.5,color:'rgba(255,255,255,0.45)',marginTop:4}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="filters" style={{marginBottom:20}}>
          <input className="fi" placeholder="🔍 Search resolved issues…"
            value={filter.search} onChange={e => setFilter({...filter,search:e.target.value})}
            style={{maxWidth:260}}/>
          <select className="fs" value={filter.dept} onChange={e => setFilter({...filter,dept:e.target.value})} style={{width:'auto'}}>
            <option value="">All Departments</option>
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {(filter.dept||filter.search) && (
            <button className="btn btn-secondary btn-sm" onClick={() => setFilter({dept:'',search:''})}>Clear</button>
          )}
          <span style={{marginLeft:'auto',fontSize:12.5,color:'var(--gray-400)',fontWeight:500}}>
            {filtered.length} result{filtered.length!==1?'s':''}
          </span>
        </div>

        {/* Cards grid */}
        {loading ? (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="card" style={{height:130}}>
                <div className="skeleton" style={{height:14,width:'70%',marginBottom:10}}/>
                <div className="skeleton" style={{height:12,width:'50%',marginBottom:8}}/>
                <div className="skeleton" style={{height:12,width:'40%'}}/>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty">
              <div className="empty-icon">🔍</div>
              <h3>No resolved issues found</h3>
              <p>{filter.dept||filter.search ? 'Try a different filter.' : 'Resolved issues will appear here once admins close them.'}</p>
            </div>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
            {filtered.map(r => (
              <div key={r.report_id} style={{
                background:'#fff',
                border:'1px solid var(--gray-200)',
                borderRadius:14,
                overflow:'hidden',
                boxShadow:'var(--shadow-xs)',
                transition:'transform .2s, box-shadow .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)';    e.currentTarget.style.boxShadow='var(--shadow-xs)'; }}
              >
                {/* Card top — sidebar coloured */}
                <div style={{ background:DARK, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span className="badge b-resolved" style={{fontSize:11}}>✅ Resolved</span>
                  <SpeedBadge hours={r.hours_taken}/>
                </div>

                {/* Card body */}
                <div style={{ padding:'14px 16px' }}>
                  <div style={{ fontWeight:700, fontSize:14, color:'var(--gray-800)', lineHeight:1.4, marginBottom:8,
                    display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                    {r.title}
                  </div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                    <span style={{ fontSize:11.5, background:'var(--primary-light)', color:'var(--primary-dark)', padding:'2px 8px', borderRadius:10, fontWeight:500 }}>
                      {r.category}
                    </span>
                    <span style={{ fontSize:11.5, background:'var(--gray-100)', color:'var(--gray-600)', padding:'2px 8px', borderRadius:10, fontWeight:500 }}>
                      🏛️ {r.department}
                    </span>
                  </div>
                  <div style={{ fontSize:11.5, color:'var(--gray-400)' }}>
                    📅 {new Date(r.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{marginTop:16,fontSize:12,color:'var(--gray-400)',textAlign:'center'}}>
            🔒 All reports are fully anonymised. No student names, IDs, or personal details are ever shown.
          </div>
        )}
      </main>
    </div>
  );
}
