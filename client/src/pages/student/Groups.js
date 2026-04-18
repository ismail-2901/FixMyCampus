import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups]   = useState([]);
  const [active, setActive]   = useState(null);
  const [posts, setPosts]     = useState([]);
  const [input, setInput]     = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newG, setNewG]       = useState({ title:'', description:'' });
  const socketRef = useRef(null);
  const activeRef = useRef(null);
  const bottomRef = useRef(null);

  // Track active group in ref so socket listener always has latest value
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Socket connection - create once on mount, disconnect on unmount
  useEffect(() => {
    const token = localStorage.getItem('fmc_token');
    const baseURL = process.env.REACT_APP_SOCKET_URL || `http://${window.location.hostname}:5002`;
    socketRef.current = io(baseURL, { auth:{ token } });
    socketRef.current.on('group_post', p => {
      // Only add message if it's for the currently active group
      if (activeRef.current && p.group_id === activeRef.current.group_id) {
        setPosts(prev => {
          // Find and replace optimistic post (without post_id) with confirmed post
          const idx = prev.findIndex(post => 
            post.content === p.content && post.author === p.author && !post.post_id
          );
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = p;
            return updated;
          }
          // If not found (shouldn't happen), just add it
          return [...prev, p];
        });
      }
    });
    api.get('/groups').then(r => setGroups(r.data));
    return () => socketRef.current.disconnect();
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [posts]);

  const openGroup = async g => {
    if (active) socketRef.current.emit('leave_group', active.group_id);
    setActive(g);
    socketRef.current.emit('join_group', g.group_id);
    const { data } = await api.get(`/groups/${g.group_id}/posts`);
    setPosts(data);
  };

  const join = async id => {
    try {
      await api.post(`/groups/${id}/join`);
      api.get('/groups').then(r => setGroups(r.data));
    } catch (err) {
      console.log('Join error:', err.message);
    }
  };

  const create = async () => {
    if (!newG.title.trim()) return;
    await api.post('/groups', newG);
    setShowNew(false); setNewG({ title:'', description:'' });
    api.get('/groups').then(r => setGroups(r.data));
  };

  const sendPost = async () => {
    if (!input.trim() || !active) return;
    
    try {
      const { data } = await api.post(`/groups/${active.group_id}/posts`, { content: input });
      setPosts(prev => [...prev, data]);
      setInput('');
    } catch (err) {
      console.error('Failed to post:', err);
    }
  };

  const leave = async id => {
    try {
      await api.delete(`/groups/${id}/leave`);
      setActive(null);
      setPosts([]);
      api.get('/groups').then(r => setGroups(r.data));
    } catch (err) {
      console.log('Leave error:', err.message);
    }
  };

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main">
        <div className="row jb mb8">
          <h1 className="pg-title">👥 Group Discussions</h1>
          {user?.role === 'superadmin' && (
            <button className="btn btn-primary btn-sm" onClick={()=>setShowNew(!showNew)}>+ Create Discussion Group</button>
          )}
        </div>
        <p className="pg-sub">Join problem-based discussion groups to share solutions and experiences anonymously</p>

        {showNew && (
          <div className="card" style={{marginBottom:18,border:'2px solid #dbeafe'}}>
            <h3 style={{fontWeight:700,marginBottom:12}}>📝 Create New Discussion Group</h3>
            <p style={{fontSize:13,color:'#6b7280',marginBottom:12}}>Groups are created for specific problems or issues. All students can join to share solutions and discuss anonymously.</p>
            <div className="fg"><input className="fi" placeholder="Problem/Issue title (e.g., 'Internet Connectivity Issues')" value={newG.title} onChange={e=>setNewG({...newG,title:e.target.value})}/></div>
            <div className="fg"><textarea className="ft" rows={2} placeholder="Description: What is this group about? (optional)" value={newG.description} onChange={e=>setNewG({...newG,description:e.target.value})}/></div>
            <div className="row" style={{gap:8}}>
              <button className="btn btn-primary btn-sm" onClick={create}>Create Group</button>
              <button className="btn btn-secondary btn-sm" onClick={()=>setShowNew(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="chat-layout">
          <div className="chat-list">
            {groups.length === 0 ? (
              <div className="empty" style={{padding:20,textAlign:'center'}}>
                <p style={{color:'#9ca3af',fontSize:13}}>No groups yet. Superadmin will create discussion groups here.</p>
              </div>
            ) : (
              groups.map(g=>(
                <div key={g.group_id} className={`chat-item${active?.group_id===g.group_id?' active':''}`} onClick={()=>openGroup(g)}>
                  <h4>🔹 {g.title}</h4>
                  {g.description && <p style={{fontSize:12,color:'#9ca3af',marginTop:4}}>{g.description}</p>}
                  <p style={{fontSize:12,marginTop:6}}>👥 {g.member_count} members</p>
                  {!g.is_member && (
                    <button className="btn btn-secondary btn-sm" style={{marginTop:8,fontSize:11}}
                      onClick={e=>{e.stopPropagation();join(g.group_id);}}>Join Group</button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="chat-win">
            {!active
              ? <div className="empty" style={{marginTop:80}}><h3>Select a group</h3><p>Choose a discussion group or create one (superadmin) to share solutions</p></div>
              : <>
                  <div className="chat-head">
                    <div>
                      <h3 style={{margin:'0 0 5px 0'}}>🔹 {active.title}</h3>
                      {active.description && <p style={{fontSize:12,color:'#6b7280',fontWeight:400,margin:0}}>{active.description}</p>}
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{fontSize:11}} onClick={()=>leave(active.group_id)}>Leave Group</button>
                  </div>
                  <div className="chat-msgs">
                    {posts.map((p,i)=>{
                      const mine = p.author===user?.anonymous_id;
                      return (
                        <div key={i} className={`msg ${mine?'mine':'theirs'}`}>
                          <div className="bubble">{p.content}</div>
                          <div className="msg-meta">{p.author} · {new Date(p.posted_at).toLocaleTimeString()}</div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef}/>
                  </div>
                  <div className="chat-input">
                    <input className="fi" placeholder="Share your solution or experience..."
                      value={input} onChange={e=>setInput(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&sendPost()}/>
                    <button className="btn btn-primary" onClick={sendPost}>Post</button>
                  </div>
                </>
            }
          </div>
        </div>
      </main>
    </div>
  );
}
