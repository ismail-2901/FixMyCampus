import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function Register() {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirmPassword:'' });
  const [depts, setDepts] = useState([]);
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/reports/departments')
      .then(r => r.json())
      .then(d => Array.isArray(d) && setDepts(d))
      .catch(() => {});
  }, []);

  const go = async e => {
    e.preventDefault(); setErr('');
    if (!form.email.endsWith('@diu.edu.bd'))
      return setErr('Email must end with @diu.edu.bd');
    if (form.password.length < 6)
      return setErr('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword)
      return setErr('Passwords do not match');
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
          <h1>🎓 FixMyCampus</h1>
          <p>Create your anonymous account</p>
        </div>
        {err && <div className="alert alert-err">{err}</div>}
        <form onSubmit={go}>
          <div className="grid2">
            <div className="fg span2">
              <label className="fl">Full Name</label>
              <input className="fi" placeholder="Your full name" value={form.name}
                onChange={e=>setForm({...form,name:e.target.value})} required/>
            </div>
            <div className="fg span2">
              <label className="fl">DIU Email</label>
              <input className="fi" type="email" placeholder="name@diu.edu.bd" value={form.email}
                onChange={e=>setForm({...form,email:e.target.value})} required/>
            </div>
            <div className="fg span2">
              <label className="fl">Password</label>
              <input className="fi" type="password" placeholder="Min 6 characters" value={form.password}
                onChange={e=>setForm({...form,password:e.target.value})} required/>
            </div>
            <div className="fg span2">
              <label className="fl">Confirm Password</label>
              <input className="fi" type="password" placeholder="Confirm your password" value={form.confirmPassword}
                onChange={e=>setForm({...form,confirmPassword:e.target.value})} required/>
            </div>
          </div>
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:11,marginTop:4}} disabled={busy}>
            {busy ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:18,fontSize:13.5,color:'#4b5563'}}>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
