import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import socketClient from '../services/socketClient';
import NotificationPopup from '../components/ui/NotificationPopup';

const NotificationContext = createContext(null);

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);

  const push = useCallback((n) => {
    setNotifications((s) => [n, ...s]);
    setToast(n);
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    const sock = socketClient.initSocket(token);
    const off = socketClient.onNotification((data, ack) => {
      // debug log incoming payload
      try {
        console.debug('[NotificationContext] incoming notification', data, { hasAck: typeof ack === 'function' });
      } catch (err) {}

      // default push
      const notif = {
        id: data?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: data?.title || 'Notification',
        body: data?.body || '',
        data: data?.data || {},
        ts: data?.ts || Date.now(),
      };
      push(notif);
      // optional immediate ack response
      if (typeof ack === 'function') {
        try {
          ack({ ok: true, receivedAt: Date.now() });
        } catch (err) {
          console.error('ack error', err);
        }
      }
    });

    return () => {
      off?.();
      // do not disconnect socket globally; other components may use it
    };
  }, [push]);

  const markRead = (id) => {
    setNotifications((s) => s.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (toast?.id === id) setToast(null);
  };

  const value = {
    notifications,
    push,
    markRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationPopup
        open={Boolean(toast)}
        message={toast ? `${toast.title}: ${toast.body}` : ''}
        type="info"
        onClose={() => setToast(null)}
        duration={6000}
      />
    </NotificationContext.Provider>
  );
}

export default NotificationContext;
