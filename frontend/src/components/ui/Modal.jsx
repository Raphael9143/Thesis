import React, { useEffect } from 'react';
import '../../assets/styles/components/ui/Modal.css';
import '../../assets/styles/ui.css';

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const stop = (e) => e.stopPropagation();

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-container" onClick={stop}>
        <div className="modal-header">{title && <h3 className="modal-title">{title}</h3>}</div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
