import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Login() {
  const [form, setForm]   = useState({ email:'', password:'' });
  const [err, setErr]     = useState('');
  const [busy, setBusy]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const go = async e => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      if (data.user.role === 'superadmin') navigate('/superadmin');
      else if (data.user.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (e) {
      setErr(e.response?.data?.error || 'Login failed. Check your email and password.');
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <h1>🎓 FixMyCampus</h1>
          <p>Sign in to your account</p>
        </div>
        {err && <div className="alert alert-err">{err}</div>}
        <form onSubmit={go}>
          <div className="fg">
            <label className="fl">DIU Email Address</label>
            <input className="fi" type="email" placeholder="yourname@diu.edu.bd"
              value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
          </div>
          <div className="fg">
            <label className="fl">Password</label>
            <input className="fi" type="password" placeholder="Enter your password"
              value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
          </div>
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:11,marginTop:4}} disabled={busy}>
            {busy ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:18,fontSize:13.5,color:'#4b5563'}}>
          No account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
