import React, { useEffect, useState } from 'react';
import Modal from '../../ui/Modal';
import FormField from '../../ui/FormField';
import NotificationPopup from '../../ui/NotificationPopup';
import userAPI from '../../../../services/userAPI';

export default function CreateQuestionModal({ open, onClose, projectId, onCreated }) {
  const [title, setTitle] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [notifyType, setNotifyType] = useState('info');

  useEffect(() => {
    if (!open) {
      setTitle('');
      setQuestionText('');
      setFile(null);
      setSubmitting(false);
    }
  }, [open]);

  const onSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!title.trim()) {
      setNotifyMsg('Please enter a title');
      setNotifyType('error');
      setNotifyOpen(true);
      return;
    }
    if (!questionText.trim()) {
      setNotifyMsg('Please enter the question text');
      setNotifyType('error');
      setNotifyOpen(true);
      return;
    }
    if (!file) {
      setNotifyMsg('Please upload a .use file');
      setNotifyType('error');
      setNotifyOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('question_text', questionText.trim());
      formData.append('research_project_id', projectId);
      if (file) formData.append('file', file);

      const res = await userAPI.createConstraintQuestion(formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res?.success) {
        setNotifyMsg('Question created');
        setNotifyType('success');
        setNotifyOpen(true);
        onCreated?.(res.data);
        setTimeout(() => {
          onClose?.();
        }, 300);
      } else {
        setNotifyMsg(res?.message || 'Failed to create question');
        setNotifyType('error');
        setNotifyOpen(true);
      }
    } catch (err) {
      console.error('Create question error', err);
      setNotifyMsg(err?.response?.data?.message || err.message || 'Server error');
      setNotifyType('error');
      setNotifyOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create OCL Question">
      <form onSubmit={onSubmit} className="create-question-form">
        <FormField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <FormField
          label="Question Text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          textarea
          required
        />
        <FormField
          label="USE file"
          type="file"
          required
          onChange={(e) => setFile(e.target.files?.[0])}
          inputProps={{ className: 'file-input-no-border' }}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onClose}
            disabled={submitting}
          >
            <i className="fa-solid fa-xmark"></i>
            <span>Cancel</span>
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
            <i className="fa-solid fa-upload"></i>
            <span>Create</span>
          </button>
        </div>
      </form>

      <NotificationPopup
        message={notifyMsg}
        open={notifyOpen}
        type={notifyType}
        onClose={() => setNotifyOpen(false)}
      />
    </Modal>
  );
}
