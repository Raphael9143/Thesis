import React from 'react';
import '../../assets/styles/components/ui/NotificationCenter.css';
import { useNotifications } from '../../contexts/NotificationContext';

export default function NotificationCenter({ onClose }) {
  const { notifications, markRead } = useNotifications() || {
    notifications: [],
    markRead: () => {},
  };

  return (
    <div className="notif-center" role="dialog" aria-label="Notifications">
      <div className="notif-center__head">
        <h4>Notifications</h4>
        <span className="notif-center__close" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </span>
      </div>
      <div className="notif-center__body">
        {(!notifications || notifications.length === 0) && (
          <div className="notif-empty">No notifications</div>
        )}
        {notifications.map((n) => (
          <div key={n.id} className={`notif-item ${n.read ? 'notif-item--read' : ''}`}>
            <div className="notif-item__meta">
              <div className="notif-item__title">{n.title}</div>
              <div className="notif-item__time">
                {new Date(n.ts || Date.now()).toLocaleString()}
              </div>
            </div>
            <div className="notif-item__body">{n.body}</div>
            <div className="notif-item__actions">
              {!n.read ? (
                <span className="mark-as-read-notification" onClick={() => markRead(n.id)}>
                  <i className="fa-regular fa-circle-check"></i>
                </span>
              ) : (
                <span className="mark-as-read-notification read">
                  <i className="fa-solid fa-circle-check"></i>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
