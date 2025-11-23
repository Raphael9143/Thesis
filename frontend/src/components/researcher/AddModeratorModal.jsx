import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import NotificationPopup from '../ui/NotificationPopup';
import userAPI from '../../../services/userAPI';

export default function AddModeratorModal({ open, onClose, onAdded, projectId }) {
  const [email, setEmail] = useState('');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [notifyType, setNotifyType] = useState('info');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setSubmitting(false);
    }
  }, [open]);

  const onSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!email.trim()) {
      setNotifyMsg('Please enter an email address');
      setNotifyType('error');
      setNotifyOpen(true);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setNotifyMsg('Please enter a valid email address');
      setNotifyType('error');
      setNotifyOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await userAPI.addResearchProjectModerator(projectId, email.trim());
      if (res?.success) {
        setNotifyMsg('Moderator added successfully');
        setNotifyType('success');
        setNotifyOpen(true);
        setEmail('');
        onAdded?.();
        setTimeout(() => {
          onClose?.();
        }, 500);
      } else {
        setNotifyMsg(res?.message || 'Failed to add moderator');
        setNotifyType('error');
        setNotifyOpen(true);
      }
    } catch (err) {
      console.error('Add moderator error', err);
      setNotifyMsg(err?.response?.data?.message || err.message || 'Server error');
      setNotifyType('error');
      setNotifyOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Moderator">
      <form onSubmit={onSubmit} className="create-project-modal-form">
        <FormField
          label="Moderator Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required={true}
          placeholder="moderator@example.com"
        />

        <div className="create-project-modal-actions">
          <button type="button" className="btn btn-signin" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Moderator'}
          </button>
        </div>
      </form>

      <NotificationPopup message={notifyMsg} open={notifyOpen} type={notifyType} onClose={() => setNotifyOpen(false)} />
    </Modal>
  );
}
