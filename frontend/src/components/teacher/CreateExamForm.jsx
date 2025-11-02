import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import userAPI from '../../../services/userAPI';
import { useNotifications } from '../../contexts/NotificationContext';
import '../../assets/styles/pages/CreateLecture.css';

export default function CreateExamForm({ open, onClose, defaultCourseId = null, onCreated }) {
  const { push } = useNotifications();
  const [form, setForm] = useState({
    course_id: defaultCourseId || '',
    title: '',
    description: '',
    start_date_date: '',
    start_date_time: '',
    end_date_date: '',
    end_date_time: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    setForm((f) => ({ ...f, course_id: defaultCourseId || '' }));
  }, [defaultCourseId, open]);

  const update = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const doSubmit = async (status = 'published') => {
    // If publishing, require course and title. Draft allows partial input but backend may still enforce.
    if (status === 'published' && (!form.course_id || !form.title)) {
      push({ title: 'Validation', body: 'Course and title are required.' });
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      if (form.course_id) fd.append('course_id', form.course_id);
      if (form.title) fd.append('title', form.title);
      if (form.description) fd.append('description', form.description);

      // combine date+time into ISO strings for start_time and end_time
      if (form.start_date_date) {
        const time = form.start_date_time || '00:00';
        try {
          fd.append('start_time', new Date(`${form.start_date_date}T${time}`).toISOString());
        } catch (err) {
          fd.append('start_time', `${form.start_date_date}T${time}`);
        }
      }
      if (form.end_date_date) {
        const time2 = form.end_date_time || '23:59';
        try {
          fd.append('end_time', new Date(`${form.end_date_date}T${time2}`).toISOString());
        } catch (err) {
          fd.append('end_time', `${form.end_date_date}T${time2}`);
        }
      }

      // append file under field 'file' if provided
      const files = fileRef.current?.files;
      if (files && files.length > 0) fd.append('file', files[0]);

      // append status if backend supports it (optional)
      if (status) fd.append('status', status);

      const res = await userAPI.createExam(fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res && res.success) {
        push({ title: 'Success', body: status === 'draft' ? 'Exam saved as draft.' : 'Exam created.' });
        onCreated?.(res.data);
        onClose?.();
        setForm({ course_id: defaultCourseId || '', title: '', description: '', start_date_date: '', start_date_time: '', end_date_date: '', end_date_time: '' });
        if (fileRef.current) fileRef.current.value = null;
      } else {
        push({ title: 'Error', body: res?.message || 'Failed to create exam' });
      }
    } catch (err) {
      console.error('Create exam error', err);
      push({ title: 'Error', body: err?.response?.data?.message || err.message || 'Server error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create new exam">
      <form className="create-lecture-form" onSubmit={(e) => e.preventDefault()}>
        <FormField label="Title" name="title" value={form.title} onChange={update} placeholder="Exam title" required />
        <FormField label="Description" name="description" value={form.description} onChange={update} placeholder="Optional description" textarea />

        <div className="form-row">
          <FormField label="Start date" name="start_date_date" type="date" value={form.start_date_date} onChange={update} />
          <FormField label="Start time" name="start_date_time" type="time" value={form.start_date_time} onChange={update} inputProps={{ min: '00:00', max: '23:59' }} />
        </div>

        <div className="form-row">
          <FormField label="End date" name="end_date_date" type="date" value={form.end_date_date} onChange={update} />
          <FormField label="End time" name="end_date_time" type="time" value={form.end_date_time} onChange={update} inputProps={{ min: '00:00', max: '23:59' }} />
        </div>

        <FormField label="Attachment" name="file" type="file" inputRef={fileRef} />

        <div className="create-lecture-form__actions">
          <button type="button" className="btn btn-signin" onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="button" className="btn btn-outline" onClick={() => doSubmit('draft')} disabled={submitting}>{submitting ? 'Submitting…' : 'Save as draft'}</button>
          <button type="button" className="btn btn-primary" onClick={() => doSubmit('published')} disabled={submitting}>{submitting ? 'Submitting…' : 'Publish'}</button>
        </div>
      </form>
    </Modal>
  );
}
