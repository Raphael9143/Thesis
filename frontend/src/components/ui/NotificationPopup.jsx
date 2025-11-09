import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import '../../assets/styles/components/ui/NotificationPopup.css';
export default function NotificationPopup({ message, open, duration = 3000, type = 'info', onClose }) {
  const isOpen = Boolean(open ?? message);

  useEffect(() => {
    if (!isOpen || !duration) return;
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [isOpen, duration, onClose, message]);

  const container = useMemo(() => {
    let el = document.getElementById('notify-root');
    if (!el) {
      el = document.createElement('div');
      el.id = 'notify-root';
      document.body.appendChild(el);
    }
    return el;
  }, []);

  if (!isOpen || !message) return null;

  const className = `notify notify--${type}`;

  const content = (
    <div className="notify-container" role="status" aria-live="polite">
      <div className={className}>
        <div className="notify__msg">{message}</div>
        <button className="notify__close" aria-label="Close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );

  return createPortal(content, container);
}
