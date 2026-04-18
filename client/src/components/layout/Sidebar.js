import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const studentLinks = [
  { to:'/dashboard',  icon:'🏠', label:'Dashboard' },
  { to:'/report',     icon:'📝', label:'Report Issue' },
  { to:'/my-reports', icon:'📋', label:'My Reports' },
  { to:'/groups',     icon:'👥', label:'Group Discussions' },
  { to:'/chatbot',    icon:'🤖', label:'AI Assistant' },
];
const adminLinks      = [{ to:'/admin',      icon:'⚙️', label:'Admin Dashboard' }];
const superAdminLinks = [
  { to:'/superadmin', icon:'🛡️', label:'Super Admin Panel' },
  { to:'/groups',     icon:'👥', label:'Group Discussions' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = user?.role === 'superadmin' ? superAdminLinks
    : user?.role === 'admin' ? adminLinks
    : studentLinks;

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <h2>🎓 FixMyCampus</h2>
        <p>Smart Campus Reporting · DIU</p>
      </div>
      <nav className="sb-nav">
        {links.map(l => (
          <NavLink key={l.to} to={l.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span>{l.icon}</span><span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sb-footer">
        <div className="anon-pill">
          <span>Your Anonymous ID</span>
          <strong>{user?.anonymous_id || '—'}</strong>
        </div>
        <div className="sb-user">{user?.name} · {user?.role}</div>
        <button className="btn-logout" onClick={() => { logout(); navigate('/login'); }}>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
