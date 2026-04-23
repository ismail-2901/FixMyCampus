import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import './App.css';

import Landing       from './pages/Landing';
import Login         from './pages/auth/Login';
import Register      from './pages/auth/Register';
import VerifyEmail   from './pages/auth/VerifyEmail';
import Dashboard     from './pages/student/Dashboard';
import ReportIssue   from './pages/student/ReportIssue';
import MyReports     from './pages/student/MyReports';
import ReportDetail  from './pages/student/ReportDetail';
import Groups        from './pages/student/Groups';
import Chatbot       from './pages/student/Chatbot';
import Transparency  from './pages/student/Transparency';
import AdminDash     from './pages/admin/AdminDash';
import SuperAdminDash from './pages/superadmin/SuperAdminDash';

// Guard: if not logged-in → show landing, never /login
// If logged-in but wrong role → redirect to correct dashboard
const Guard = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="full-center">
      <div className="spinner"/>
      <p style={{ color:'var(--gray-400)', fontSize:13 }}>Loading…</p>
    </div>
  );
  // Not logged in → send to landing so they see the product first
  if (!user) return <Navigate to="/" replace/>;
  // Wrong role → redirect to correct home
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'superadmin') return <Navigate to="/superadmin" replace/>;
    if (user.role === 'admin')      return <Navigate to="/admin"      replace/>;
    return <Navigate to="/dashboard" replace/>;
  }
  return children;
};

// Redirect already-logged-in users away from landing/login/register
const PublicOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-center"><div className="spinner"/></div>;
  if (user) {
    if (user.role === 'superadmin') return <Navigate to="/superadmin" replace/>;
    if (user.role === 'admin')      return <Navigate to="/admin"      replace/>;
    return <Navigate to="/dashboard" replace/>;
  }
  return children;
};

const AppInner = () => (
  <BrowserRouter>
    <Routes>
      {/* Public pages — redirect to dashboard if already logged in */}
      <Route path="/"              element={<PublicOnly><Landing/></PublicOnly>}/>
      <Route path="/login"         element={<PublicOnly><Login/></PublicOnly>}/>
      <Route path="/register"      element={<PublicOnly><Register/></PublicOnly>}/>
      <Route path="/verify-email"  element={<VerifyEmail/>}/>

      {/* Student routes */}
      <Route path="/dashboard"    element={<Guard roles={['student','staff']}><Dashboard/></Guard>}/>
      <Route path="/report"       element={<Guard roles={['student','staff']}><ReportIssue/></Guard>}/>
      <Route path="/my-reports"   element={<Guard roles={['student','staff']}><MyReports/></Guard>}/>
      <Route path="/reports/:id"  element={<Guard><ReportDetail/></Guard>}/>
      <Route path="/groups"       element={<Guard roles={['student','staff','superadmin','admin']}><Groups/></Guard>}/>
      <Route path="/chatbot"      element={<Guard><Chatbot/></Guard>}/>
      <Route path="/transparency" element={<Guard><Transparency/></Guard>}/>

      {/* Admin routes */}
      <Route path="/admin"      element={<Guard roles={['admin']}><AdminDash/></Guard>}/>
      <Route path="/superadmin" element={<Guard roles={['superadmin']}><SuperAdminDash/></Guard>}/>

      {/* Catch-all → landing */}
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  </BrowserRouter>
);

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppInner />
      </NotificationProvider>
    </AuthProvider>
  );
}
