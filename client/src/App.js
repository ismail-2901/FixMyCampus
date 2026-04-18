import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

import Landing    from './pages/Landing';
import Login      from './pages/auth/Login';
import Register   from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import Dashboard  from './pages/student/Dashboard';
import ReportIssue from './pages/student/ReportIssue';
import MyReports  from './pages/student/MyReports';
import ReportDetail from './pages/student/ReportDetail';
import Groups     from './pages/student/Groups';
import Chatbot    from './pages/student/Chatbot';
import AdminDash  from './pages/admin/AdminDash';
import SuperAdminDash from './pages/superadmin/SuperAdminDash';

const Guard = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-center"><div className="spinner"/></div>;
  if (!user) return <Navigate to="/login" replace/>;
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'superadmin') return <Navigate to="/superadmin" replace/>;
    if (user.role === 'admin')      return <Navigate to="/admin" replace/>;
    return <Navigate to="/dashboard" replace/>;
  }
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"             element={<Landing/>}/>
          <Route path="/login"        element={<Login/>}/>
          <Route path="/register"     element={<Register/>}/>
          <Route path="/verify-email" element={<VerifyEmail/>}/>
          <Route path="/dashboard"    element={<Guard roles={['student','staff']}><Dashboard/></Guard>}/>
          <Route path="/report"       element={<Guard roles={['student','staff']}><ReportIssue/></Guard>}/>
          <Route path="/my-reports"   element={<Guard roles={['student','staff']}><MyReports/></Guard>}/>
          <Route path="/reports/:id"  element={<Guard><ReportDetail/></Guard>}/>
          <Route path="/groups"       element={<Guard roles={['student','staff','superadmin','admin']}><Groups/></Guard>}/>
          <Route path="/chatbot"      element={<Guard roles={['student','staff','superadmin','admin']}><Chatbot/></Guard>}/>
          <Route path="/admin"        element={<Guard roles={['admin']}><AdminDash/></Guard>}/>
          <Route path="/superadmin"   element={<Guard roles={['superadmin']}><SuperAdminDash/></Guard>}/>
          <Route path="*"             element={<Navigate to="/" replace/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
