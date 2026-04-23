import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Login() {
  const [form, setForm] = useState({ email:'', password:'' });
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const go = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      if (data.user.role === 'superadmin') navigate('/superadmin');
      else if (data.user.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (e) {
      setErr(e.response?.data?.error || 'Login failed. Check your credentials.');
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <div style={{width:54,height:54,background:'linear-gradient(135deg,#6366F1,#8B5CF6)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,margin:'0 auto 14px',boxShadow:'0 8px 24px rgba(99,102,241,0.35)'}}>🎓</div>
          <h1>Welcome back</h1>
          <p>Sign in to FixMyCampus</p>
        </div>

        {err && <div className="alert alert-err">{err}</div>}

        <form onSubmit={go}>
          <div className="fg">
            <label className="fl">DIU Email Address</label>
            <input className="fi" type="email" placeholder="yourname@diu.edu.bd"
              value={form.email} onChange={e => setForm({...form,email:e.target.value})} required/>
          </div>
          <div className="fg" style={{position:'relative'}}>
            <label className="fl">Password</label>
            <input className="fi" type={showPwd?'text':'password'} placeholder="Enter your password"
              value={form.password} onChange={e => setForm({...form,password:e.target.value})} required
              style={{paddingRight:44}}/>
            <button type="button" onClick={() => setShowPwd(v=>!v)}
              style={{position:'absolute',right:12,top:32,background:'none',border:'none',cursor:'pointer',fontSize:16,color:'var(--gray-400)',padding:4}}>
              {showPwd ? '🙈' : '👁️'}
            </button>
          </div>
          <button className="btn btn-primary btn-block" style={{justifyContent:'center',padding:12,marginTop:4}} disabled={busy}>
            {busy ? <><div className="spinner" style={{width:16,height:16,borderWidth:2}}/> Signing in…</> : 'Sign In →'}
          </button>
        </form>

        <p style={{textAlign:'center',marginTop:20,fontSize:13.5,color:'var(--gray-500)'}}>
          Don't have an account?{' '}
          <Link to="/register" style={{color:'var(--primary)',fontWeight:600}}>Create one free →</Link>
        </p>
        <p style={{textAlign:'center',marginTop:8,fontSize:12,color:'var(--gray-400)'}}>
          By signing in you agree to use your real DIU email.
        </p>
      </div>
    </div>
  );
}
