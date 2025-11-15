import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import NotificationPopup from '../ui/NotificationPopup';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/components/researcher/CreateProjectModal.css';

export default function CreateProjectModal({ open, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [notifyType, setNotifyType] = useState('info');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      // reset when modal closes
      setTitle('');
      setDescription('');
      setSubmitting(false);
    }
  }, [open]);

  const onSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!title.trim()) {
      setNotifyMsg('Please enter a project title');
      setNotifyType('error');
      setNotifyOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || '',
      };

      const res = await userAPI.createResearchProject(payload);
      if (res?.success) {
        setNotifyMsg('Project created successfully');
        setNotifyType('success');
        setNotifyOpen(true);

        // reset form
        setTitle('');
        setDescription('');

        onCreated?.(res.data);
        setTimeout(() => {
          onClose?.();
        }, 500);
      } else {
        setNotifyMsg(res?.message || 'Failed to create project');
        setNotifyType('error');
        setNotifyOpen(true);
      }
    } catch (err) {
      console.error('Create project error', err);
      setNotifyMsg(err?.response?.data?.message || err.message || 'Server error');
      setNotifyType('error');
      setNotifyOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Project">
      <form onSubmit={onSubmit} className="create-project-modal-form">
        <FormField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required={true} />
        <FormField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} textarea />

        <div className="create-project-modal-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create'}
          </button>
          <button type="button" className="btn btn-signin" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
        </div>
      </form>

      <NotificationPopup message={notifyMsg} open={notifyOpen} type={notifyType} onClose={() => setNotifyOpen(false)} />
    </Modal>
  );
}
