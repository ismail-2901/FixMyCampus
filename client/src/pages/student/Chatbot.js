import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import api from '../../services/api';

const WELCOME = `👋 Hi! I'm the FixMyCampus AI Assistant powered by ChatGPT.\n\nI can help you with:\n• How to register & verify your account\n• How to report campus issues\n• Tracking your report status\n• Campus departments and categories\n• Questions about Daffodil International University\n• Any other questions you may have\n\nWhat would you like to know?`;

export default function Chatbot() {
  const [msgs, setMsgs]   = useState([{ role:'bot', text:WELCOME }]);
  const [input, setInput] = useState('');
  const [busy, setBusy]   = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setMsgs(m => [...m, { role:'user', text }]);
    setInput(''); setBusy(true);
    try {
      const history = msgs.slice(-8).map(m => ({ role:m.role==='user'?'user':'assistant', content:m.text }));
      const { data } = await api.post('/chatbot/message', { message: text, history });
      setMsgs(m => [...m, { role:'bot', text: data.response }]);
    } catch {
      setMsgs(m => [...m, { role:'bot', text:'Sorry, I had an error. Please try again.' }]);
    } finally { setBusy(false); }
  };

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main">
        <h1 className="pg-title">🤖 AI Assistant</h1>
        <p className="pg-sub">Ask anything about campus rules, reporting, or how to use FixMyCampus</p>

        <div className="chat-win" style={{height:'calc(100vh - 190px)'}}>
          <div className="chat-head">
            🤖 FixMyCampus AI <span style={{fontSize:12,color:'#16a34a',fontWeight:400,marginLeft:8}}>● Online 24/7</span>
          </div>
          <div className="chat-msgs">
            {msgs.map((m,i)=>(
              <div key={i} className={`msg ${m.role==='user'?'mine':'theirs'}`}>
                <div className="bubble" style={{whiteSpace:'pre-wrap'}}>
                  {m.role==='bot'&&<span style={{marginRight:6}}>🤖</span>}{m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="msg theirs">
                <div className="bubble" style={{color:'#9ca3af'}}>🤖 Thinking...</div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
          <div className="chat-input">
            <textarea className="fi" rows={2} style={{resize:'none',flex:1}}
              placeholder="Ask a question... (Enter to send, Shift+Enter for new line)"
              value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}/>
            <button className="btn btn-primary" onClick={send} disabled={busy}>Send</button>
          </div>
        </div>
      </main>
    </div>
  );
}
