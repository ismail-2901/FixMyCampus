import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const NOTIF_ICONS = {
  new_report:      { icon:'📋', bg:'#DBEAFE', color:'#1D4ED8' },
  status_change:   { icon:'🔄', bg:'#D1FAE5', color:'#065F46' },
  admin_response:  { icon:'💬', bg:'#EDE9FE', color:'#6D28D9' },
  closure_request: { icon:'⚠️', bg:'#FEF3C7', color:'#92400E' },
  group_message:   { icon:'👥', bg:'#FCE7F3', color:'#9D174D' },
  report_approved: { icon:'✅', bg:'#D1FAE5', color:'#065F46' },
  report_rejected: { icon:'❌', bg:'#FEE2E2', color:'#991B1B' },
};

const ROLE_LABEL = {
  student:    'Student',
  staff:      'Staff',
  admin:      'Admin',
  superadmin: 'Super Admin',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function TopBar({ title }) {
  const { user }      = useAuth();
  const navigate      = useNavigate();
  const {
    notifications = [],
    unreadCount   = 0,
    markRead,
    markAllRead,
  } = useNotifications() || {};

  const [open, setOpen]     = useState(false);
  const bellRef             = useRef(null);
  const panelRef            = useRef(null);

  /* Close when clicking outside both bell and panel */
  useEffect(() => {
    const handler = e => {
      if (!bellRef.current?.contains(e.target) && !panelRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = useCallback(n => {
    markRead(n.notification_id);
    setOpen(false);
    if (n.link && n.link !== '#') navigate(n.link);
  }, [markRead, navigate]);

  return (
    <>
      {/* ── Top bar ───────────────────────────────────────── */}
      <header style={{
        position:'fixed',
        top:0,
        left:'var(--sidebar-w)',
        right:0,
        height:56,
        background:'rgba(255,255,255,0.95)',
        backdropFilter:'blur(10px)',
        borderBottom:'1px solid var(--gray-200)',
        display:'flex',
        alignItems:'center',
        justifyContent:'space-between',
        padding:'0 28px 0 24px',
        zIndex:150,
        boxShadow:'0 1px 4px rgba(99,102,241,0.06)',
      }}>
        {/* Left: page title passed from page */}
        <div style={{ fontSize:15, fontWeight:700, color:'var(--gray-800)', fontFamily:'var(--font-display)' }}>
          {title || 'FixMyCampus'}
        </div>

        {/* Right: bell + user chip */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>

          {/* Notification bell */}
          <div ref={bellRef} style={{ position:'relative' }}>
            <button
              onClick={() => setOpen(v => !v)}
              aria-label="Notifications"
              style={{
                width:38, height:38,
                background: open ? 'var(--primary-light)' : 'var(--gray-50)',
                border:`1.5px solid ${open ? 'var(--primary-mid)' : 'var(--gray-200)'}`,
                borderRadius:10,
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', fontSize:17,
                transition:'all .15s',
                color: open ? 'var(--primary)' : 'var(--gray-600)',
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position:'absolute', top:3, right:3,
                  width:9, height:9,
                  background:'#EF4444',
                  borderRadius:'50%',
                  border:'2px solid #fff',
                  display:'block',
                }}/>
              )}
            </button>
          </div>

          {/* User role chip */}
          <div style={{
            display:'flex', alignItems:'center', gap:8,
            background:'var(--gray-50)',
            border:'1.5px solid var(--gray-200)',
            borderRadius:10, padding:'5px 12px',
          }}>
            <div style={{
              width:26, height:26,
              background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
              borderRadius:7,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:13, color:'#fff', fontWeight:700,
            }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:12.5, fontWeight:600, color:'var(--gray-800)', lineHeight:1.2 }}>{user?.name?.split(' ')[0]}</div>
              <div style={{ fontSize:10.5, color:'var(--gray-400)', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                {ROLE_LABEL[user?.role] || user?.role}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Notification Panel ─────────────────────────────── */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position:'fixed',
            top:64,              /* just below topbar */
            right:20,
            width:360,
            background:'#fff',
            borderRadius:16,
            border:'1px solid var(--gray-200)',
            boxShadow:'0 24px 60px rgba(0,0,0,0.14)',
            zIndex:9999,
            overflow:'hidden',
            animation:'notifSlideIn .2s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Panel header */}
          <div style={{
            padding:'14px 18px',
            borderBottom:'1px solid var(--gray-100)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:16 }}>🔔</span>
              <span style={{ fontSize:14, fontWeight:700, color:'#fff' }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{
                  background:'rgba(255,255,255,0.25)', color:'#fff',
                  fontSize:11, fontWeight:700, padding:'1px 7px', borderRadius:10,
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={e => { e.stopPropagation(); markAllRead(); }}
                style={{
                  fontSize:11.5, color:'rgba(255,255,255,0.85)',
                  background:'rgba(255,255,255,0.15)',
                  border:'1px solid rgba(255,255,255,0.2)',
                  borderRadius:6,
                  padding:'3px 10px',
                  cursor:'pointer', fontWeight:600,
                  fontFamily:'var(--font-body)',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight:420, overflowY:'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding:'44px 16px', textAlign:'center', color:'var(--gray-400)', fontSize:13 }}>
                <div style={{ fontSize:36, marginBottom:12 }}>🔕</div>
                <div style={{ fontWeight:600, marginBottom:4, color:'var(--gray-600)' }}>You're all caught up!</div>
                <div style={{ fontSize:12 }}>Notifications will appear here when something new happens</div>
              </div>
            ) : (
              notifications.slice(0, 25).map(n => {
                const meta     = NOTIF_ICONS[n.type] || { icon:'🔔', bg:'#F3F4F6', color:'#374151' };
                const isUnread = !n.is_read;
                return (
                  <div
                    key={n.notification_id}
                    onClick={() => handleClick(n)}
                    style={{
                      display:'flex', gap:12, padding:'13px 18px',
                      borderBottom:'1px solid var(--gray-50)',
                      cursor:'pointer',
                      background: isUnread ? '#EEF2FF' : '#fff',
                      transition:'background .1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isUnread ? '#E0E7FF' : 'var(--gray-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = isUnread ? '#EEF2FF' : '#fff'}
                  >
                    {/* Icon bubble */}
                    <div style={{
                      width:40, height:40, borderRadius:11, flexShrink:0,
                      background:meta.bg,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:19,
                    }}>
                      {meta.icon}
                    </div>

                    {/* Text */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{
                        fontSize:13, fontWeight: isUnread ? 700 : 500,
                        color:'var(--gray-800)', lineHeight:1.35, marginBottom:3,
                      }}>
                        {n.title}
                      </div>
                      <div style={{
                        fontSize:12, color:'var(--gray-500)', lineHeight:1.5,
                        display:'-webkit-box', WebkitLineClamp:2,
                        WebkitBoxOrient:'vertical', overflow:'hidden',
                        marginBottom:4,
                      }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize:11, color:'var(--gray-400)' }}>
                        {timeAgo(n.created_at)}
                      </div>
                    </div>

                    {/* Unread dot */}
                    {isUnread && (
                      <div style={{ width:8, height:8, background:'#6366F1', borderRadius:'50%', flexShrink:0, marginTop:5 }}/>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{ padding:'10px 18px', borderTop:'1px solid var(--gray-100)', background:'var(--gray-50)', textAlign:'center' }}>
              <button
                onClick={() => setOpen(false)}
                style={{ fontSize:12, color:'var(--primary)', background:'none', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'var(--font-body)' }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes notifSlideIn {
          from { opacity:0; transform:translateY(-10px) scale(0.97); }
          to   { opacity:1; transform:translateY(0)     scale(1); }
        }
      `}</style>
    </>
  );
}
