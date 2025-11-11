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

  const suggestions = useMemo(() => {
    const q = studentEmailsInput.trim().toLowerCase();
    if (!q) return [];
    return studentEmails.filter((e) => e.toLowerCase().includes(q) && !selectedStudentEmails.includes(e)).slice(0, 10);
  }, [studentEmailsInput, studentEmails, selectedStudentEmails]);

  const addEmail = (email) => {
    if (!email) return;
    if (!studentEmails.includes(email)) {
      push({ title: 'Error', body: 'Email not found or not a student' });
      return;
    }
    if (!selectedStudentEmails.includes(email)) {
      setSelectedStudentEmails((s) => [...s, email]);
    }
    setStudentEmailsInput('');
  };

  const removeEmail = (email) => setSelectedStudentEmails((s) => s.filter((x) => x !== email));

  const submit = async () => {
    if (!classId) {
      push({ title: 'Error', body: 'Class not specified' });
      return;
    }
    if (selectedStudentEmails.length === 0) {
      push({ title: 'Error', body: 'Please enter at least one student email' });
      return;
    }
    setLoading(true);
    try {
      const res = await userAPI.addStudentsToClass(classId, { studentEmails: selectedStudentEmails });
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
        {suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map((s) => (
              <button key={s} className="btn btn-signin btn-sm" onClick={() => addEmail(s)} style={{ margin: 4 }}>
                {s}
              </button>
            ))}
          </div>
        )}
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
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? 'Adding...' : 'Add students'}
          </button>
          <button className="btn btn-signin" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddStudentsModal;
