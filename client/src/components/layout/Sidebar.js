import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const studentLinks = [
  { to:'/dashboard',    icon:'🏠', label:'Dashboard' },
  { to:'/report',       icon:'📝', label:'Report Issue' },
  { to:'/my-reports',   icon:'📋', label:'My Reports' },
  { to:'/transparency', icon:'🌐', label:'Transparency Board' },
  { to:'/groups',       icon:'💬', label:'Group Discussions' },
  { to:'/chatbot',      icon:'🤖', label:'AI Assistant' },
];
const adminLinks = [
  { to:'/admin',   icon:'⚙️', label:'Dashboard' },
  { to:'/chatbot', icon:'🤖', label:'AI Assistant' },
];
const superAdminLinks = [
  { to:'/superadmin',   icon:'🛡️', label:'Control Panel' },
  { to:'/transparency', icon:'🌐', label:'Transparency Board' },
  { to:'/groups',       icon:'💬', label:'Group Discussions' },
  { to:'/chatbot',      icon:'🤖', label:'AI Assistant' },
];

const ROLE_LABEL = {
  student:    'Student',
  staff:      'Staff',
  admin:      'Admin',
  superadmin: 'Super Admin',
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = user?.role === 'superadmin' ? superAdminLinks
    : user?.role === 'admin' ? adminLinks
    : studentLinks;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sb-logo">
        <div className="sb-logo-inner">
          <div className="sb-logo-icon">🎓</div>
          <div>
            <h2>FixMyCampus</h2>
            <p>DIU Smart Reporting</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="sb-section-label">Menu</div>
      <nav className="sb-nav">
        {links.map(l => (
          <NavLink key={l.to} to={l.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer — show role once, no duplication */}
      <div className="sb-footer">
        <div className="anon-pill">
          <span>Anonymous ID</span>
          <strong>{user?.anonymous_id || '—'}</strong>
        </div>
        <div style={{ marginBottom:6, padding:'0 2px' }}>
          <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)' }}>{user?.name}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2, textTransform:'uppercase', letterSpacing:'0.05em' }}>
            {ROLE_LABEL[user?.role] || user?.role}
          </div>
        </div>
        <button className="btn-logout" onClick={() => { logout(); navigate('/'); }}>
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
