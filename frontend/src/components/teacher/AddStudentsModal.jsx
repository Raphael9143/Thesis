import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import userAPI from '../../../services/userAPI';
import { useNotifications } from '../../contexts/NotificationContext';
import '../../assets/styles/components/teacher/CreateClassModal.css';

const AddStudentsModal = ({ open, onClose, classId, onAdded }) => {
  const [studentEmailsList, setStudentEmailsList] = useState([]);
  const [studentEmailsInput, setStudentEmailsInput] = useState('');
  const [selectedStudentEmails, setSelectedStudentEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const { push } = useNotifications();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await userAPI.getStudentEmails();
        if (!mounted) return;
        if (res?.success && Array.isArray(res.data)) {
          setStudentEmailsList(res.data);
        }
      } catch {
        /* silent */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setStudentEmailsInput('');
      setSelectedStudentEmails([]);
    }
  }, [open]);

  const studentEmails = useMemo(() => studentEmailsList || [], [studentEmailsList]);

  const addEmail = (email) => {
    if (!email) return;
    // support comma-separated lists
    if (email.includes(',')) {
      const parts = email
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      const invalids = [];
      const toAdd = [];
      for (const p of parts) {
        if (selectedStudentEmails.includes(p)) continue;
        if (studentEmails && studentEmails.length > 0 && !studentEmails.includes(p)) {
          invalids.push(p);
          continue;
        }
        toAdd.push(p);
      }
      if (toAdd.length > 0) setSelectedStudentEmails((s) => [...s, ...toAdd]);
      if (invalids.length > 0)
        push({ title: 'Error', body: `Invalid emails: ${invalids.join(', ')}` });
      setStudentEmailsInput('');
      return;
    }

    const e = email.trim();
    if (!e) return;
    if (studentEmails && studentEmails.length > 0 && !studentEmails.includes(e)) {
      push({ title: 'Error', body: `Email not found or not a student: ${e}` });
      return;
    }
    if (!selectedStudentEmails.includes(e)) {
      setSelectedStudentEmails((s) => [...s, e]);
    }
    setStudentEmailsInput('');
  };

  const removeEmail = (email) => setSelectedStudentEmails((s) => s.filter((x) => x !== email));

  const submit = async () => {
    if (!classId) {
      push({ title: 'Error', body: 'Class not specified' });
      return;
    }

    // Prefer parsing the raw input field (CSV) if present.
    // Otherwise fall back to selectedStudentEmails
    let emailsToSend = [];
    if (studentEmailsInput && studentEmailsInput.trim()) {
      emailsToSend = studentEmailsInput
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
    } else {
      emailsToSend = selectedStudentEmails.slice();
    }

    if (emailsToSend.length === 0) {
      push({ title: 'Error', body: 'Please enter at least one student email' });
      return;
    }
    setLoading(true);
    try {
      const res = await userAPI.addStudentsToClass(classId, {
        studentEmails: emailsToSend,
      });
      if (res?.success) {
        push({ title: 'Success', body: 'Students added to class' });
        onAdded?.(res.data);
        onClose?.();
      } else {
        push({ title: 'Error', body: res?.message || 'Failed to add students' });
      }
    } catch (err) {
      console.error('Add students error', err);
      push({ title: 'Error', body: err?.response?.data?.message || err.message || 'Server error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add students to class">
      <div className="add-student-emails">
        <div className="input-group">
          <input
            className="auth-input"
            value={studentEmailsInput}
            onChange={(e) => setStudentEmailsInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addEmail(studentEmailsInput);
              }
            }}
            placeholder="Type to search student emails"
            style={{ width: '100%' }}
          />
        </div>
        {selectedStudentEmails.length > 0 && (
          <div className="selected-emails">
            {selectedStudentEmails.map((e) => (
              <div key={e} className="email-chip">
                <span>{e}</span>
                <button className="btn btn-icon" title="Remove" onClick={() => removeEmail(e)}>
                  <i className="fa fa-times" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="modal-footer" style={{ marginTop: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={loading}>
            {loading ? 'Adding...' : 'Add students'}
          </button>
          <button className="btn btn-outline btn-sm" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddStudentsModal;
