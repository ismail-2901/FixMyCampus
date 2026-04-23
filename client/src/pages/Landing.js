import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  { icon:'🕵️', title:'Fully Anonymous',    desc:'Your real identity is never revealed. All reports use your unique ANON-ID only.' },
  { icon:'📊', title:'Real-time Tracking',  desc:'Watch your report progress from Pending → Approved → In Progress → Resolved live.' },
  { icon:'🔔', title:'Smart Notifications', desc:'Instant alerts for report updates, admin responses, and group messages.' },
  { icon:'🤖', title:'AI Assistant',         desc:'24/7 Groq-powered assistant to guide you through reporting and campus queries.' },
  { icon:'💬', title:'Group Discussions',   desc:'Anonymous group chat to share experiences and solutions with other students.' },
  { icon:'🛡️', title:'Admin Oversight',     desc:'Multi-layer approval ensures every report is reviewed and handled properly.' },
];

const steps = [
  { icon:'📝', title:'Register',      desc:'Create your account with your DIU email. We generate a unique anonymous ID for you.' },
  { icon:'📤', title:'Report Issue',  desc:'Describe the campus problem, attach photos, and choose the right department.' },
  { icon:'📣', title:'Track Progress',desc:'Get notified as admins review, approve, and work on resolving your report.' },
];

export default function Landing() {
  return (
    <div style={{ minHeight:'100vh', background:'#0A0920', color:'#fff', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>

      {/* ── Navbar ───────────────────────────────── */}
      <nav style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'16px 48px',
        borderBottom:'1px solid rgba(255,255,255,0.07)',
        position:'sticky', top:0,
        background:'rgba(10,9,32,0.92)',
        backdropFilter:'blur(14px)',
        zIndex:100,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🎓</div>
          <span style={{ fontSize:18, fontWeight:800, letterSpacing:'-0.01em' }}>FixMyCampus</span>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Link to="/login"    className="btn" style={{ background:'rgba(255,255,255,0.08)', color:'#fff', border:'1px solid rgba(255,255,255,0.15)' }}>Sign In</Link>
          <Link to="/register" className="btn" style={{ background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', border:'none', boxShadow:'0 4px 14px rgba(99,102,241,0.4)' }}>Get Started</Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────── */}
      <section style={{ textAlign:'center', padding:'96px 24px 80px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 50% 0%,rgba(99,102,241,0.18),transparent)', pointerEvents:'none' }}/>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:6,
          background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)',
          borderRadius:20, padding:'5px 16px', marginBottom:24,
          fontSize:13, color:'#A5B4FC',
        }}>
          <span style={{ width:7, height:7, background:'#34D399', borderRadius:'50%', display:'inline-block' }}/>
          Daffodil International University · Smart Campus Platform
        </div>
        <h1 style={{ fontSize:'clamp(34px,5vw,58px)', fontWeight:800, maxWidth:700, margin:'0 auto 20px', lineHeight:1.12, letterSpacing:'-0.02em' }}>
          Fix Campus Issues{' '}
          <span style={{ background:'linear-gradient(135deg,#6366F1,#A78BFA,#EC4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            Anonymously
          </span>
        </h1>
        <p style={{ fontSize:18, opacity:0.72, maxWidth:520, margin:'0 auto 38px', lineHeight:1.7 }}>
          Report broken infrastructure, academic problems, or safety issues without ever revealing your identity.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/register" className="btn" style={{ background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', border:'none', padding:'14px 32px', fontSize:15, boxShadow:'0 6px 20px rgba(99,102,241,0.45)', borderRadius:12 }}>
            Start Reporting Free →
          </Link>
          <Link to="/login" className="btn" style={{ background:'rgba(255,255,255,0.07)', color:'#fff', border:'1px solid rgba(255,255,255,0.18)', padding:'14px 32px', fontSize:15, borderRadius:12 }}>
            Sign In
          </Link>
        </div>
      </section>

      {/* ── How it works ─────────────────────────── */}
      <section style={{ padding:'64px 24px', maxWidth:900, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:44 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#818CF8', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>How it works</div>
          <h2 style={{ fontSize:30, fontWeight:800, letterSpacing:'-0.02em' }}>Three simple steps</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:20 }}>
          {steps.map((s, i) => (
            <div key={s.title} style={{
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.09)',
              borderRadius:16, padding:'28px 24px',
              position:'relative', overflow:'hidden',
            }}>
              {/* Step number — small pill, not overflow */}
              <div style={{
                display:'inline-flex', alignItems:'center', justifyContent:'center',
                width:28, height:28,
                background:'rgba(99,102,241,0.25)',
                border:'1px solid rgba(99,102,241,0.4)',
                borderRadius:8,
                fontSize:12, fontWeight:800, color:'#A5B4FC',
                marginBottom:14,
              }}>
                {String(i + 1).padStart(2,'0')}
              </div>
              <div style={{ width:40, height:40, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, marginBottom:14 }}>{s.icon}</div>
              <h3 style={{ fontWeight:700, fontSize:17, marginBottom:8 }}>{s.title}</h3>
              <p style={{ fontSize:13.5, opacity:0.65, lineHeight:1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────── */}
      <section style={{ padding:'64px 24px', maxWidth:1000, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:44 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#818CF8', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>Features</div>
          <h2 style={{ fontSize:30, fontWeight:800, letterSpacing:'-0.02em' }}>Everything you need</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
          {features.map(f => (
            <div key={f.title}
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'22px', transition:'all .2s', cursor:'default' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(99,102,241,0.09)'; e.currentTarget.style.borderColor='rgba(99,102,241,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; }}>
              <div style={{ fontSize:28, marginBottom:10 }}>{f.icon}</div>
              <h3 style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>{f.title}</h3>
              <p style={{ fontSize:13, opacity:0.62, lineHeight:1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────── */}
      <section style={{ padding:'72px 24px', textAlign:'center' }}>
        <div style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))', border:'1px solid rgba(99,102,241,0.22)', borderRadius:24, padding:'52px 24px', maxWidth:600, margin:'0 auto' }}>
          <h2 style={{ fontSize:28, fontWeight:800, marginBottom:14, letterSpacing:'-0.01em' }}>Ready to fix your campus?</h2>
          <p style={{ opacity:0.65, marginBottom:28, fontSize:15, lineHeight:1.6 }}>Join your fellow DIU students in making the campus better — one anonymous report at a time.</p>
          <Link to="/register" className="btn" style={{ background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', border:'none', padding:'14px 34px', fontSize:15, boxShadow:'0 6px 20px rgba(99,102,241,0.4)', borderRadius:12 }}>
            Create Free Account →
          </Link>
        </div>
      </section>

      <footer style={{ textAlign:'center', padding:'24px', borderTop:'1px solid rgba(255,255,255,0.06)', opacity:0.4, fontSize:13 }}>
        FixMyCampus · Daffodil International University · SE-331 Capstone Project
      </footer>
    </div>
  );
}
