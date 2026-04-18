import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#1e3a8a,#1e40af 55%,#3b82f6)',color:'#fff'}}>
      <nav style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'18px 48px',borderBottom:'1px solid rgba(255,255,255,.12)'}}>
        <h1 style={{fontSize:22,fontWeight:800}}>🎓 FixMyCampus</h1>
        <div style={{display:'flex',gap:10}}>
          <Link to="/login"    className="btn" style={{background:'rgba(255,255,255,.15)',color:'#fff'}}>Login</Link>
          <Link to="/register" className="btn" style={{background:'#fff',color:'#1e40af'}}>Register</Link>
        </div>
      </nav>

      <section style={{textAlign:'center',padding:'90px 24px 70px'}}>
        <div style={{fontSize:60,marginBottom:16}}>🏛️</div>
        <h2 style={{fontSize:44,fontWeight:800,maxWidth:680,margin:'0 auto 18px',lineHeight:1.2}}>
          Smart Campus Problem Reporting System
        </h2>
        <p style={{fontSize:18,opacity:.85,maxWidth:520,margin:'0 auto 36px',lineHeight:1.65}}>
          Report campus issues <strong>anonymously</strong>, track their resolution in real-time, and connect with your university community.
        </p>
        <Link to="/register" className="btn" style={{background:'#fff',color:'#1e40af',fontSize:15,padding:'13px 30px'}}>
          Get Started — It's Free
        </Link>
      </section>

      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:20,maxWidth:960,margin:'0 auto 80px',padding:'0 24px'}}>
        {[
          {icon:'🕵️',t:'Fully Anonymous',d:'Your real identity is never shown. Reports and chats use your unique ANON-ID.'},
          {icon:'📊',t:'Real-time Tracking',d:'Watch your report go from Pending → In Progress → Resolved.'},
          {icon:'💬',t:'Anonymous Chat',d:'Private one-to-one chat and public group discussions — all anonymous.'},
          {icon:'🤖',t:'AI Assistant',d:'24/7 chatbot to guide you through reporting and campus rules.'},
        ].map(f => (
          <div key={f.t} style={{background:'rgba(255,255,255,.1)',borderRadius:12,padding:26,backdropFilter:'blur(8px)'}}>
            <div style={{fontSize:34,marginBottom:10}}>{f.icon}</div>
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:7}}>{f.t}</h3>
            <p style={{opacity:.8,fontSize:13.5,lineHeight:1.6}}>{f.d}</p>
          </div>
        ))}
      </section>

      <footer style={{textAlign:'center',padding:20,borderTop:'1px solid rgba(255,255,255,.1)',opacity:.5,fontSize:13}}>
        FixMyCampus · Daffodil International University · SE-331 Capstone Project
      </footer>
    </div>
  );
}
