import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';

export default function VerifyEmail() {
  const { state } = useLocation();
  const email = state?.email || '';
  const [code, setCode]   = useState('');
  const [err, setErr]     = useState('');
  const [ok, setOk]       = useState('');
  const [busy, setBusy]   = useState(false);
  const navigate = useNavigate();

  const verify = async e => {
    e.preventDefault(); setErr(''); setOk(''); setBusy(true);
    try {
      await api.post('/auth/verify-email', { email, code });
      setOk('Email verified! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (e) {
      setErr(e.response?.data?.error || 'Verification failed');
    } finally { setBusy(false); }
  };

  const resend = async () => {
    try {
      await api.post('/auth/resend-code', { email });
      setOk('New code sent! Check your email or server terminal.');
    } catch (e) { setErr(e.response?.data?.error || 'Failed to resend'); }
  };

  return (
    <div className="auth-page">
      <div className="auth-box" style={{textAlign:'center'}}>
        <div style={{fontSize:52,marginBottom:14}}>📧</div>
        <h2 style={{fontSize:22,fontWeight:700,marginBottom:8}}>Check Your Email</h2>
        <p style={{color:'#4b5563',marginBottom:20,fontSize:14}}>
          A 6-digit verification code was sent to:<br/><strong>{email}</strong>
        </p>

        {err && <div className="alert alert-err">{err}</div>}
        {ok  && <div className="alert alert-ok">{ok}</div>}

        <form onSubmit={verify}>
          <input className="fi" placeholder="Enter verification code" value={code}
            onChange={e=>setCode(e.target.value)} maxLength={6} required
            style={{textAlign:'center',fontSize:16,letterSpacing:0,fontFamily:'"Segoe UI", system-ui, sans-serif',marginBottom:14}}/>
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:11}} disabled={busy}>
            {busy ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <button onClick={resend}
          style={{background:'none',border:'none',color:'#1e40af',marginTop:14,fontSize:13.5,cursor:'pointer'}}>
          Didn't get it? Resend code
        </button>
      </div>
    </div>
  );
}
