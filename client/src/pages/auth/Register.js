import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function Register() {
  const [form, setForm]   = useState({ name:'', email:'', password:'', confirmPassword:'' });
  const [depts, setDepts] = useState([]);
  const [err, setErr]     = useState('');
  const [busy, setBusy]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/reports/departments').then(r=>r.json()).then(d => Array.isArray(d) && setDepts(d)).catch(()=>{});
  }, []);

  const pwdStrength = (p) => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6)  s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  };

  const strengthLabel = ['','Weak','Fair','Good','Strong'];
  const strengthColor = ['','#EF4444','#F59E0B','#3B82F6','#10B981'];
  const strength = pwdStrength(form.password);

  const go = async e => {
    e.preventDefault(); setErr('');
    if (!form.email.endsWith('@diu.edu.bd')) return setErr('Email must end with @diu.edu.bd');
    if (form.password.length < 6)            return setErr('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return setErr('Passwords do not match');
    setBusy(true);
    try {
      const { confirmPassword, ...submitData } = form;
      await api.post('/auth/register', submitData);
      navigate('/verify-email', { state: { email: form.email } });
    } catch (e) {
      setErr(e.response?.data?.error || 'Registration failed. Try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-box" style={{maxWidth:500}}>
        <div className="auth-logo">
          <div style={{width:54,height:54,background:'linear-gradient(135deg,#6366F1,#8B5CF6)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,margin:'0 auto 14px',boxShadow:'0 8px 24px rgba(99,102,241,0.35)'}}>🎓</div>
          <h1>Create your account</h1>
          <p>Join FixMyCampus — your identity stays anonymous</p>
        </div>

        {err && <div className="alert alert-err">{err}</div>}

        <form onSubmit={go}>
          <div className="fg">
            <label className="fl">Full Name</label>
            <input className="fi" placeholder="Your full name"
              value={form.name} onChange={e => setForm({...form,name:e.target.value})} required/>
          </div>
          <div className="fg">
            <label className="fl">DIU Email</label>
            <input className="fi" type="email" placeholder="name@diu.edu.bd"
              value={form.email} onChange={e => setForm({...form,email:e.target.value})} required/>
            {form.email && !form.email.endsWith('@diu.edu.bd') && (
              <div style={{fontSize:12,color:'var(--danger)',marginTop:4}}>⚠️ Must be a @diu.edu.bd email</div>
            )}
          </div>
          <div className="fg">
            <label className="fl">Password</label>
            <input className="fi" type="password" placeholder="Min 6 characters"
              value={form.password} onChange={e => setForm({...form,password:e.target.value})} required/>
            {form.password && (
              <div style={{marginTop:6}}>
                <div style={{height:4,background:'var(--gray-200)',borderRadius:4,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${(strength/4)*100}%`,background:strengthColor[strength],borderRadius:4,transition:'all .3s'}}/>
                </div>
                <div style={{fontSize:11.5,color:strengthColor[strength],fontWeight:600,marginTop:3}}>
                  {strengthLabel[strength]} password
                </div>
              </div>
            )}
          </div>
          <div className="fg">
            <label className="fl">Confirm Password</label>
            <input className="fi" type="password" placeholder="Repeat your password"
              value={form.confirmPassword} onChange={e => setForm({...form,confirmPassword:e.target.value})} required/>
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <div style={{fontSize:12,color:'var(--danger)',marginTop:4}}>⚠️ Passwords don't match</div>
            )}
          </div>
          <button className="btn btn-primary btn-block" style={{justifyContent:'center',padding:12,marginTop:4}} disabled={busy}>
            {busy ? <><div className="spinner" style={{width:16,height:16,borderWidth:2}}/> Creating account…</> : 'Create Account →'}
          </button>
        </form>

        <p style={{textAlign:'center',marginTop:20,fontSize:13.5,color:'var(--gray-500)'}}>
          Already have an account?{' '}
          <Link to="/login" style={{color:'var(--primary)',fontWeight:600}}>Sign in →</Link>
        </p>
        <div style={{marginTop:14,padding:'10px 12px',background:'var(--primary-light)',borderRadius:10,fontSize:12,color:'var(--primary-dark)',display:'flex',gap:6,alignItems:'flex-start',border:'1px solid var(--primary-mid)'}}>
          <span>🔒</span>
          <span>Your identity is protected. We assign you a unique anonymous ID. Your real name is never visible in reports.</span>
        </div>
      </div>
    </div>
  );
}
