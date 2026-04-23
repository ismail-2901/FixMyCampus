import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import TopBar  from '../../components/layout/TopBar';
import api from '../../services/api';

const SUGGESTED = [
  'How do I report a campus issue?',
  'How can I track my report?',
  'What is my anonymous ID?',
  'What departments handle AC issues?',
  'How long does resolution usually take?',
];

const WELCOME = `Hi there! 👋 I'm the **FixMyCampus AI Assistant**.

I can help you with:
• How to report campus issues step by step
• Tracking your report status
• Understanding departments and categories
• Campus rules and policies at DIU
• Any questions about using this platform

What would you like to know?`;

function renderMessage(text) {
  return text.split('\n').map((line, i, arr) => {
    const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return <span key={i} dangerouslySetInnerHTML={{__html: bold + (i<arr.length-1?'<br/>':'')}} />;
  });
}

export default function Chatbot() {
  const [msgs, setMsgs]   = useState([{ role:'bot', text:WELCOME, time:new Date() }]);
  const [input, setInput] = useState('');
  const [busy, setBusy]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs]);

  const send = async (text) => {
    const t = (text || input).trim();
    if (!t || busy) return;
    setMsgs(m => [...m, { role:'user', text:t, time:new Date() }]);
    setInput(''); setBusy(true);
    try {
      const history = msgs.slice(-8).map(m => ({ role:m.role==='user'?'user':'assistant', content:m.text }));
      const { data } = await api.post('/chatbot/message', { message:t, history });
      setMsgs(m => [...m, { role:'bot', text:data.response, time:new Date() }]);
    } catch {
      setMsgs(m => [...m, { role:'bot', text:'Sorry, I had a connection issue. Please try again!', time:new Date() }]);
    } finally { setBusy(false); }
  };

  const fmt = (d) => d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main" style={{display:'flex',flexDirection:'column',padding:'20px 28px'}}>
        <TopBar title="AI Assistant"/>
        <div style={{marginBottom:14}}>
          <h1 className="pg-title">🤖 AI Assistant</h1>
          <p className="pg-sub">Powered by Groq AI · Available 24/7 · Fully confidential</p>
        </div>

        {/* Centered chat window */}
        <div style={{display:'flex',justifyContent:'center',flex:1}}>
          <div style={{
            width:'100%', maxWidth:720,
            display:'flex', flexDirection:'column',
            background:'var(--bg-surface)',
            border:'1px solid var(--gray-200)',
            borderRadius:'var(--radius-xl)',
            overflow:'hidden',
            boxShadow:'var(--shadow-md)',
            height:'calc(100vh - 170px)',
          }}>
            {/* Chat header */}
            <div style={{
              padding:'14px 20px', borderBottom:'1px solid var(--gray-100)',
              background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
              display:'flex', alignItems:'center', gap:12,
              flexShrink:0,
            }}>
              <div style={{width:42,height:42,background:'rgba(255,255,255,0.2)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>🤖</div>
              <div>
                <div style={{fontWeight:700,color:'#fff',fontSize:14.5}}>FixMyCampus AI</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,0.75)',display:'flex',alignItems:'center',gap:5}}>
                  <span style={{width:7,height:7,background:'#34D399',borderRadius:'50%',display:'inline-block'}}/>
                  Online 24/7 · Groq AI powered
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{flex:1,overflowY:'auto',padding:'18px 20px',display:'flex',flexDirection:'column',gap:12}}>
              {msgs.map((m, i) => (
                <div key={i} className={`msg ${m.role==='user'?'mine':'theirs'}`}>
                  {m.role === 'bot' && (
                    <div style={{width:28,height:28,background:'linear-gradient(135deg,#6366F1,#8B5CF6)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,marginBottom:4,alignSelf:'flex-start'}}>🤖</div>
                  )}
                  <div className="bubble" style={{
                    background: m.role==='user' ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'var(--gray-50)',
                    color: m.role==='user' ? '#fff' : 'var(--gray-800)',
                    border: m.role==='bot' ? '1px solid var(--gray-200)' : 'none',
                    lineHeight:1.65,
                  }}>
                    {renderMessage(m.text)}
                  </div>
                  <div className="msg-meta">{fmt(m.time)}</div>
                </div>
              ))}

              {busy && (
                <div className="msg theirs">
                  <div style={{width:28,height:28,background:'linear-gradient(135deg,#6366F1,#8B5CF6)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,marginBottom:4}}>🤖</div>
                  <div className="bubble" style={{background:'var(--gray-50)',border:'1px solid var(--gray-200)'}}>
                    <span style={{display:'inline-flex',gap:4,alignItems:'center',color:'var(--gray-400)'}}>
                      <span style={{animation:'bounce 0.8s infinite 0s',display:'inline-block'}}>●</span>
                      <span style={{animation:'bounce 0.8s infinite 0.15s',display:'inline-block'}}>●</span>
                      <span style={{animation:'bounce 0.8s infinite 0.3s',display:'inline-block'}}>●</span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Suggested prompts */}
            {msgs.length <= 2 && !busy && (
              <div style={{padding:'4px 16px 10px',display:'flex',gap:7,flexWrap:'wrap',flexShrink:0}}>
                {SUGGESTED.map(s => (
                  <button key={s} onClick={() => send(s)} style={{
                    fontSize:12,padding:'5px 12px',borderRadius:20,
                    border:'1px solid var(--primary-mid)',
                    background:'var(--primary-light)',color:'var(--primary-dark)',
                    cursor:'pointer',fontFamily:'var(--font-body)',fontWeight:500,
                    transition:'all .15s',whiteSpace:'nowrap',
                  }}>{s}</button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{padding:'12px 16px',borderTop:'1px solid var(--gray-100)',background:'var(--gray-50)',display:'flex',gap:10,alignItems:'flex-end',flexShrink:0}}>
              <textarea ref={inputRef} className="fi" rows={1}
                style={{resize:'none',flex:1,minHeight:42,maxHeight:120,lineHeight:'1.5',padding:'10px 14px'}}
                placeholder="Ask me anything… (Enter to send, Shift+Enter for new line)"
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}/>
              <button className="btn btn-primary" onClick={() => send()} disabled={busy||!input.trim()} style={{flexShrink:0,height:42}}>
                ➤
              </button>
            </div>
          </div>
        </div>

        <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}`}</style>
      </main>
    </div>
  );
}
