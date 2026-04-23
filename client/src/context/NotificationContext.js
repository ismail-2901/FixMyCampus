import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotifCtx = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const socketRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count'),
      ]);
      // Ensure is_read is a proper number/boolean, not a MySQL Buffer
      const cleaned = (notifRes.data || []).map(n => ({
        ...n,
        is_read: Number(n.is_read) === 1,
      }));
      setNotifications(cleaned);
      setUnreadCount(Number(countRes.data.count) || 0);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const token = localStorage.getItem('fmc_token');
    const baseURL = process.env.REACT_APP_SOCKET_URL ||
      `http://${window.location.hostname}:5002`;

    socketRef.current = io(baseURL, { auth: { token } });

    socketRef.current.on('connect', () => {
      // Re-fetch on reconnect so we never miss notifications
      fetchNotifications();
    });

    socketRef.current.on('notification', (notif) => {
      const newNotif = {
        ...notif,
        notification_id: notif.notification_id || Date.now(),
        is_read: false,
        created_at: notif.created_at || new Date().toISOString(),
      };
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(c => c + 1);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user, fetchNotifications]);

  const markRead = useCallback(async (id) => {
    // Optimistic update first
    setNotifications(prev =>
      prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount(c => Math.max(0, c - 1));
    // Then persist to server
    await api.patch(`/notifications/${id}/read`).catch(() => {});
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await api.patch('/notifications/mark-all-read').catch(() => {});
  }, []);

  return (
    <NotifCtx.Provider value={{
      notifications,
      unreadCount,
      markRead,
      markAllRead,
      refetch: fetchNotifications,
    }}>
      {children}
    </NotifCtx.Provider>
  );
};

export const useNotifications = () => useContext(NotifCtx);
