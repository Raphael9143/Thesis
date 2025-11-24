import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import NotificationPopup from '../ui/NotificationPopup';
import userAPI from '../../../services/userAPI';

export default function AddContributorsModal({ open, onClose, onAdded, projectId }) {
  const [emailsText, setEmailsText] = useState('');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [notifyType, setNotifyType] = useState('info');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmailsText('');
      setSubmitting(false);
    }
  }, [open]);

  const parseEmails = (text) => {
    if (!text) return [];
    // split by comma or newline and trim
    return text
      .split(/[,\n\r]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const onSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const emails = parseEmails(emailsText);
    if (!emails.length) {
      setNotifyMsg('Please enter at least one email address');
      setNotifyType('error');
      setNotifyOpen(true);
      return;
    }

    // basic validation - quick check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const em of emails) {
      if (!emailRegex.test(em)) {
        setNotifyMsg(`Invalid email: ${em}`);
        setNotifyType('error');
        setNotifyOpen(true);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await userAPI.addResearchProjectContributors(projectId, { emails });
      if (res?.success) {
        setNotifyMsg('Contributors added successfully');
        setNotifyType('success');
        setNotifyOpen(true);
        setEmailsText('');
        onAdded?.();
        setTimeout(() => onClose?.(), 600);
      } else {
        setNotifyMsg(res?.message || 'Failed to add contributors');
        setNotifyType('error');
        setNotifyOpen(true);
      }
    } catch (err) {
      console.error('Add contributors error', err);
      setNotifyMsg(err?.response?.data?.message || err.message || 'Server error');
      setNotifyType('error');
      setNotifyOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Contributors">
      <form onSubmit={onSubmit} className="create-project-modal-form">
        <FormField
          label="Contributor emails"
          type="textarea"
          value={emailsText}
          onChange={(e) => setEmailsText(e.target.value)}
          required={true}
          placeholder={'Seperate emails by comma'}
        />

        <div className="create-project-modal-actions">
          <button type="button" className="btn btn-signin" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Contributors'}
          </button>
        </div>
      </form>

      <NotificationPopup message={notifyMsg} open={notifyOpen} type={notifyType} onClose={() => setNotifyOpen(false)} />
    </Modal>
  );
}
