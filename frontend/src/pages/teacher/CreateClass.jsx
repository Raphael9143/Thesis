import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import FormField from '../../components/ui/FormField';
import NotificationPopup from '../../components/ui/NotificationPopup';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/ui.css';
import '../../assets/styles/pages/teacher/CreateClass.css';

export default function CreateClassPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [semester, setSemester] = useState('');
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
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const studentEmails = useMemo(() => studentEmailsList || [], [studentEmailsList]);

  const suggestions = useMemo(() => {
    const q = studentEmailsInput.trim().toLowerCase();
    if (!q) return [];
    return studentEmails.filter(e => e.toLowerCase().includes(q) && !selectedStudentEmails.includes(e)).slice(0, 10);
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
      setSelectedStudentEmails(s => [...s, email]);
    }
    setStudentEmailsInput('');
  };

  const removeEmail = (email) => setSelectedStudentEmails(s => s.filter(x => x !== email));

  const onSubmit = async (e) => {
    e.preventDefault();
    // basic validation
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
        semester,
        year: Number(year),
        max_students: Number(maxStudents),
        status: 'active',
        studentEmails: selectedStudentEmails,
      };
      console.log(payload)
      const res = await userAPI.createClass(payload);
      if (res?.success) {
        setNotifyMsg('Successfully created class');
        setNotifyType('success');
        setNotifyOpen(true);

        // capture emails to notify before resetting
        const emailsToNotify = [...selectedStudentEmails];

        // reset form
        setName(''); setCode(''); setDescription(''); setSemester(''); setYear(new Date().getFullYear()); setMaxStudents(30); setSelectedStudentEmails([]);

        // notify added students (send title & body)
        (async () => {
          const failures = [];
          const teacherName = sessionStorage.getItem('full_name') || 'Your teacher';
          const title = `Added to class ${name || code}`;
          const body = `You have been added to class ${name || code} by ${teacherName}. Please check your classes.`;

          for (const email of emailsToNotify) {
            try {
              const u = await userAPI.getUserByEmail(email);
              console.log(u)
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

        // navigate back to classes management
        setTimeout(() => navigate('/education/classes'), 700);
      } else {
        setNotifyMsg(res?.message || 'Failed to create class');
        setNotifyType('error');
        setNotifyOpen(true);
      }
    } catch (err) {
      setNotifyMsg(err?.response?.message || 'Server error');
      setNotifyType('error');
      setNotifyOpen(true);
    }
  };

  return (
    <Section title="Create Class" subtitle="Create a new class and invite students">
      <Card className="create-class-form">
        <form onSubmit={onSubmit} style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <FormField label="Name" value={name} onChange={e => setName(e.target.value)} />
            <FormField label="Code" value={code} onChange={e => setCode(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <FormField label="Semester" value={semester} onChange={e => setSemester(e.target.value)} />
            <FormField label="Year" type="number" value={year} onChange={e => setYear(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <FormField label="Max students" type="number" value={maxStudents} onChange={e => setMaxStudents(e.target.value)} />
          </div>
          <div style={{ marginTop: 12 }}>
            <FormField label="Description" value={description} onChange={e => setDescription(e.target.value)} textarea />
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ fontWeight: 600 }}>Student emails (suggestions)</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <input className="auth-input" value={studentEmailsInput} onChange={e => setStudentEmailsInput(e.target.value)} placeholder="Type to search student emails" />
              <button type="button" className="btn" onClick={() => addEmail(studentEmailsInput)}>Add</button>
            </div>
            {suggestions.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {suggestions.map(s => (
                  <button key={s} type="button" className="btn" onClick={() => addEmail(s)}>{s}</button>
                ))}
              </div>
            )}
            {selectedStudentEmails.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selectedStudentEmails.map(e => (
                  <div key={e} style={{ padding: '6px 10px', background: '#f3f4f6', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span>{e}</span>
                    <button type="button" className="btn" onClick={() => removeEmail(e)}>x</button>
                  </div>
                ))}
              </div>
            )}
          </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button type="submit" className="btn btn-primary">Create class</button>
            <button type="button" className="btn" onClick={() => { setName(''); setCode(''); setDescription(''); setSelectedStudentEmails([]); setMaxStudents(30); }}>Reset</button>
            <button type="button" className="btn" onClick={() => navigate('/education/classes')}>Cancel</button>
          </div>
        </form>
      </Card>

      <NotificationPopup message={notifyMsg} open={notifyOpen} type={notifyType} onClose={() => setNotifyOpen(false)} />
    </Section>
  );
}
