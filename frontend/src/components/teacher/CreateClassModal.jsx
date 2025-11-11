import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import NotificationPopup from '../../components/ui/NotificationPopup';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/components/teacher/CreateClassModal.css';

export default function CreateClassModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [maxStudents, setMaxStudents] = useState(30);
  const [studentEmailsInput, setStudentEmailsInput] = useState('');
  const [selectedStudentEmails, setSelectedStudentEmails] = useState([]);

  const [studentEmailsList, setStudentEmailsList] = useState([]);

  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [notifyType, setNotifyType] = useState('info');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await userAPI.getStudentEmails();
        if (!mounted) return;
        if (res?.success && Array.isArray(res.data)) {
          setStudentEmailsList(res.data);
        }
      } catch (err) {
        console.error('Failed to load student emails', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const studentEmails = useMemo(() => studentEmailsList || [], [studentEmailsList]);

  const suggestions = useMemo(() => {
    const q = studentEmailsInput.trim().toLowerCase();
    if (!q) return [];
    return studentEmails.filter((e) => e.toLowerCase().includes(q) && !selectedStudentEmails.includes(e)).slice(0, 10);
  }, [studentEmailsInput, studentEmails, selectedStudentEmails]);

  const addEmail = (email) => {
    if (!email) return;
    if (!studentEmails.includes(email)) {
      setNotifyMsg('Email not found or not a student');
      setNotifyType('error');
      setNotifyOpen(true);
      return;
    }
    if (!selectedStudentEmails.includes(email)) {
      setSelectedStudentEmails((s) => [...s, email]);
    }
    setStudentEmailsInput('');
  };

  const removeEmail = (email) => setSelectedStudentEmails((s) => s.filter((x) => x !== email));

  useEffect(() => {
    if (!open) {
      // reset when modal closes
      setName('');
      setCode('');
      setDescription('');
      setYear(new Date().getFullYear());
      setMaxStudents(30);
      setSelectedStudentEmails([]);
      setStudentEmailsInput('');
    }
  }, [open]);

  const onSubmit = async (e, status = 'active') => {
    // allow calling from a button click (which may pass no event) or from form submit
    if (e?.preventDefault) e.preventDefault();
    if (!name || !code) {
      setNotifyMsg('Please fill in all required fields');
      setNotifyType('error');
      setNotifyOpen(true);
      return;
    }
    try {
      const payload = {
        name,
        code,
        description,
        year: Number(year),
        max_students: Number(maxStudents),
        status: status || 'active',
        studentEmails: selectedStudentEmails,
      };

      const res = await userAPI.createClass(payload);
      if (res?.success) {
        setNotifyMsg('Successfully created class');
        setNotifyType('success');
        setNotifyOpen(true);

        const emailsToNotify = [...selectedStudentEmails];

        // reset form
        setName('');
        setCode('');
        setDescription('');
        setYear(new Date().getFullYear());
        setMaxStudents(30);
        setSelectedStudentEmails([]);

        // notify added students (async, do not block)
        (async () => {
          const failures = [];
          const teacherName = sessionStorage.getItem('full_name') || 'Your teacher';
          const title = `Added to class ${name || code}`;
          const body = `You have been added to class ${name || code} by ${teacherName}. Please check your classes.`;

          for (const email of emailsToNotify) {
            try {
              const u = await userAPI.getUserByEmail(email);
              if (u?.success && u.data && u.data.id) {
                await userAPI.notify(u.data.id, { title, body });
              } else {
                failures.push(email);
              }
            } catch (err) {
              console.error('Notify student failed for', email, err);
              failures.push(email);
            }
          }
          if (failures.length > 0) {
            setNotifyMsg(`Class created but failed to notify: ${failures.join(', ')}`);
            setNotifyType('error');
            setNotifyOpen(true);
          }
        })();

        onCreated?.(res.data);
        onClose?.();
      } else {
        setNotifyMsg(res?.response?.data?.message || 'Failed to create class');
        setNotifyType('error');
        setNotifyOpen(true);
      }
    } catch (err) {
      setNotifyMsg(err?.response?.data?.message || 'Server error');
      setNotifyType('error');
      setNotifyOpen(true);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Class">
      <form onSubmit={onSubmit} className="create-class-modal-form">
        <div className="create-class-row">
          <FormField label="Name" value={name} onChange={(e) => setName(e.target.value)} required={true} />
          <FormField label="Code" value={code} onChange={(e) => setCode(e.target.value)} required={true} />
        </div>
        <div className="create-class-row mt">
          <FormField
            label="Year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required={true}
          />
        </div>
        <div className="create-class-row mt">
          <FormField
            label="Max students"
            type="number"
            value={maxStudents}
            onChange={(e) => setMaxStudents(e.target.value)}
            required={true}
          />
        </div>
        <div className="create-class-row mt">
          <div className="full-width">
            <FormField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              textarea
            />
          </div>
        </div>

        <div className="create-class-student-emails">
          <label className="font-600">Student emails</label>
          <div className="input-row">
            <div className="input-group">
              <input
                className="auth-input"
                value={studentEmailsInput}
                onChange={(e) => setStudentEmailsInput(e.target.value)}
                placeholder="Type to search student emails"
              />
            </div>
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
        </div>

        <div className="create-class-actions">
          <button type="submit" className="btn btn-primary">
            Publish
          </button>
          <button type="button" className="btn btn-signin" onClick={(e) => onSubmit(e, 'draft')}>
            Save Draft
          </button>
          <button
            type="button"
            className="btn btn-signin"
            onClick={() => {
              setName('');
              setCode('');
              setDescription('');
              setSelectedStudentEmails([]);
              setMaxStudents(30);
            }}
          >
            Reset
          </button>
          <button type="button" className="btn btn-signin" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>

      <NotificationPopup message={notifyMsg} open={notifyOpen} type={notifyType} onClose={() => setNotifyOpen(false)} />
    </Modal>
  );
}
