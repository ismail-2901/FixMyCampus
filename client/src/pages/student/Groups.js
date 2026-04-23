import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import Sidebar from '../../components/layout/Sidebar';
import TopBar  from '../../components/layout/TopBar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Groups() {
  const { user } = useAuth();
  const [groups,  setGroups]  = useState([]);
  const [active,  setActive]  = useState(null);
  const [posts,   setPosts]   = useState([]);
  const [input,   setInput]   = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newG,    setNewG]    = useState({ title:'', description:'' });
  const socketRef  = useRef(null);
  const activeRef  = useRef(null);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const seenIds    = useRef(new Set());

  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [posts]);

  // Single socket connection for the whole page
  useEffect(() => {
    const token = localStorage.getItem('fmc_token');
    const baseURL = `http://${window.location.hostname}:5002`;
    socketRef.current = io(baseURL, { auth:{ token } });

    socketRef.current.on('connect', () => {
      // Rejoin active group on reconnect
      if (activeRef.current) {
        socketRef.current.emit('join_group', activeRef.current.group_id);
      }
    });

    socketRef.current.on('group_post', p => {
      const active = activeRef.current;
      if (active && String(p.group_id) === String(active.group_id)) {
        // Deduplicate by post_id — never show same post twice
        if (seenIds.current.has(p.post_id)) return;
        seenIds.current.add(p.post_id);
        setPosts(prev => [...prev, p]);
      }
    });

    api.get('/groups').then(r => setGroups(r.data));
    return () => socketRef.current?.disconnect();
  }, []);

  const openGroup = useCallback(async g => {
    if (activeRef.current) socketRef.current.emit('leave_group', activeRef.current.group_id);
    setActive(g);
    seenIds.current.clear();
    socketRef.current.emit('join_group', g.group_id);
    const { data } = await api.get(`/groups/${g.group_id}/posts`);
    // Pre-populate the seen set so socket dupes are filtered
    data.forEach(p => seenIds.current.add(p.post_id));
    setPosts(data);
    inputRef.current?.focus();
  }, []);

  const join = async id => {
    try { await api.post(`/groups/${id}/join`); api.get('/groups').then(r => setGroups(r.data)); } catch {}
  };

  const create = async () => {
    if (!newG.title.trim()) return;
    await api.post('/groups', newG);
    setShowNew(false); setNewG({ title:'', description:'' });
    api.get('/groups').then(r => setGroups(r.data));
  };

  const sendPost = async () => {
    if (!input.trim() || !active) return;
    const text = input.trim();
    setInput('');
    try {
      const { data } = await api.post(`/groups/${active.group_id}/posts`, { content: text });
      // Add from API response (socket won't echo back to sender)
      if (!seenIds.current.has(data.post_id)) {
        seenIds.current.add(data.post_id);
        setPosts(prev => [...prev, data]);
      }
    } catch { setInput(text); }
  };

  const leave = async id => {
    try {
      await api.delete(`/groups/${id}/leave`);
      socketRef.current.emit('leave_group', id);
      setActive(null); setPosts([]); seenIds.current.clear();
      api.get('/groups').then(r => setGroups(r.data));
    } catch {}
  };

  const fmtTime = d => {
    const date = new Date(d), now = new Date();
    if (date.toDateString() === now.toDateString())
      return date.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    return date.toLocaleDateString([], {month:'short',day:'numeric'});
  };

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main" style={{display:'flex',flexDirection:'column',padding:'80px 28px 20px'}}>
        <TopBar title="Group Discussions"/>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
          <h1 className="pg-title">💬 Group Discussions</h1>
          {user?.role === 'superadmin' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowNew(!showNew)}>+ Create Group</button>
          )}
        </div>
        <p className="pg-sub">Anonymous group chat — share solutions and experiences with other students</p>

        {showNew && (
          <div className="card" style={{marginBottom:16,border:'2px solid var(--primary-mid)',background:'var(--primary-light)'}}>
            <h3 style={{fontWeight:700,marginBottom:10,fontSize:14}}>📝 Create New Group</h3>
            <div className="fg"><input className="fi" placeholder="Group title" value={newG.title} onChange={e => setNewG({...newG,title:e.target.value})}/></div>
            <div className="fg" style={{marginBottom:12}}><textarea className="ft" rows={2} placeholder="Description (optional)" value={newG.description} onChange={e => setNewG({...newG,description:e.target.value})}/></div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-primary btn-sm" onClick={create}>Create</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="chat-layout" style={{flex:1,height:'calc(100vh - 240px)'}}>
          {/* Group list */}
          <div className="chat-list">
            <div style={{padding:'12px 14px',borderBottom:'1px solid var(--gray-100)',background:'#fff'}}>
              <div style={{fontSize:12,fontWeight:700,color:'var(--gray-500)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{groups.length} Groups</div>
            </div>
            {groups.length === 0 ? (
              <div className="empty" style={{padding:'32px 16px'}}>
                <div className="empty-icon">💬</div>
                <p style={{fontSize:13,color:'var(--gray-400)'}}>No groups yet. Superadmin will create groups here.</p>
              </div>
            ) : groups.map(g => (
              <div key={g.group_id} className={`chat-item${active?.group_id===g.group_id?' active':''}`} onClick={() => openGroup(g)}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <div style={{width:32,height:32,borderRadius:9,flexShrink:0,background:active?.group_id===g.group_id?'var(--primary)':'var(--gray-200)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,color:active?.group_id===g.group_id?'#fff':'var(--gray-500)'}}>💬</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:13,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{g.title}</div>
                    <div style={{fontSize:11.5,color:'var(--gray-400)'}}>👥 {g.member_count} members</div>
                  </div>
                  {g.is_member
                    ? <span style={{fontSize:10,background:'var(--success-bg)',color:'#065F46',padding:'2px 6px',borderRadius:4,fontWeight:600,whiteSpace:'nowrap'}}>Joined</span>
                    : <button className="btn btn-secondary btn-sm" style={{fontSize:11,padding:'3px 8px'}} onClick={e=>{e.stopPropagation();join(g.group_id);}}>Join</button>
                  }
                </div>
                {g.description && <p style={{fontSize:12,color:'var(--gray-400)',lineHeight:1.4,paddingLeft:40,marginTop:2}}>{g.description}</p>}
              </div>
            ))}
          </div>

          {/* Chat window */}
          <div className="chat-win">
            {!active ? (
              <div className="empty" style={{marginTop:60}}>
                <div className="empty-icon">💬</div>
                <h3>Select a group</h3>
                <p>Choose a discussion group to start chatting anonymously</p>
              </div>
            ) : (
              <>
                <div className="chat-head">
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:36,height:36,background:'linear-gradient(135deg,var(--primary),var(--accent))',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'#fff'}}>💬</div>
                    <div>
                      <div style={{fontWeight:700,fontSize:14}}>{active.title}</div>
                      {active.description && <div style={{fontSize:12,color:'var(--gray-400)'}}>{active.description}</div>}
                    </div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => leave(active.group_id)}>Leave</button>
                </div>

                <div className="chat-msgs">
                  {posts.length === 0 && (
                    <div style={{textAlign:'center',padding:'32px 0',color:'var(--gray-400)',fontSize:13}}>🌟 Be the first to post!</div>
                  )}
                  {posts.map((p,i) => {
                    const mine = p.author === user?.anonymous_id;
                    return (
                      <div key={p.post_id||i} className={`msg ${mine?'mine':'theirs'}`}>
                        {!mine && (
                          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                            <span style={{fontSize:11.5,color:'var(--gray-500)',fontWeight:600,fontFamily:'monospace'}}>{p.author}</span>
                          </div>
                        )}
                        <div className="bubble">{p.content}</div>
                        <div className="msg-meta">{mine?'You · ':''}{fmtTime(p.posted_at)}</div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef}/>
                </div>

                <div className="chat-input">
                  <input ref={inputRef} className="fi"
                    placeholder="Share anonymously… (Enter to send)"
                    value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && !e.shiftKey && sendPost()}
                    style={{flex:1}}/>
                  <button className="btn btn-primary" onClick={sendPost} disabled={!input.trim()}>Send</button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
