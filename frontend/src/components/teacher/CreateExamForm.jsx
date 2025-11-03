import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import userAPI from '../../../services/userAPI';
import { useNotifications } from '../../contexts/NotificationContext';
import '../../assets/styles/pages/CreateLecture.css';

export default function CreateExamForm({ open, onClose, defaultCourseId = null, onCreated, exam = null, onUpdated }) {
  const { push } = useNotifications();
  const [form, setForm] = useState({
    course_id: defaultCourseId || '',
    title: '',
    type: '',
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

  // when editing an existing exam, populate form
  useEffect(() => {
    if (exam && open) {
      const s = {
        course_id: exam.course_id || exam.courseId || defaultCourseId || '',
        title: exam.title || '',
        type: exam.type || '',
        description: exam.description || '',
        start_date_date: '',
        start_date_time: '',
        end_date_date: '',
        end_date_time: '',
      };
      // parse ISO datetimes into date + time fields if present
      try {
        if (exam.start_date) {
          const sd = new Date(exam.start_date);
          if (!isNaN(sd)) {
            s.start_date_date = sd.toISOString().slice(0,10);
            s.start_date_time = sd.toTimeString().slice(0,5);
          }
        }
      } catch (_) {}
      try {
        if (exam.end_date) {
          const ed = new Date(exam.end_date);
          if (!isNaN(ed)) {
            s.end_date_date = ed.toISOString().slice(0,10);
            s.end_date_time = ed.toTimeString().slice(0,5);
          }
        }
      } catch (_) {}
      setForm(s);
      if (fileRef.current) fileRef.current.value = null;
    }
  }, [exam, open, defaultCourseId]);

  const update = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const doSubmit = async (status = 'published') => {
    // Validate required fields: course, title and type are mandatory
    if (!form.course_id || !form.title || !form.type) {
      push({ title: 'Validation', body: 'Course, title and type are required.' });
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      if (form.course_id) fd.append('course_id', form.course_id);
      if (form.title) fd.append('title', form.title);
  if (form.type) fd.append('type', form.type);
      if (form.description) fd.append('description', form.description);

      // combine date+time into ISO strings for start_date and end_date
      if (form.start_date_date) {
        const time = form.start_date_time || '00:00';
        try {
          fd.append('start_date', new Date(`${form.start_date_date}T${time}`).toISOString());
        } catch (err) {
          fd.append('start_date', `${form.start_date_date}T${time}`);
        }
      }
      if (form.end_date_date) {
        const time2 = form.end_date_time || '23:59';
        try {
          fd.append('end_date', new Date(`${form.end_date_date}T${time2}`).toISOString());
        } catch (err) {
          fd.append('end_date', `${form.end_date_date}T${time2}`);
        }
      }

      // append file under field 'file' if provided
      const files = fileRef.current?.files;
      if (files && files.length > 0) fd.append('file', files[0]);

      // append status if backend supports it (optional)
      if (status) fd.append('status', status);

      let res;
      if (exam && (exam.id || exam.exam_id)) {
        // update
        const id = exam.id || exam.exam_id;
        res = await userAPI.updateExam(id, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res && res.success) {
          push({ title: 'Success', body: status === 'draft' ? 'Exam saved as draft.' : 'Exam updated.' });
          onUpdated?.(res.data);
          onClose?.();
        } else {
          push({ title: 'Error', body: res?.message || 'Failed to update exam' });
        }
      } else {
        // create
        res = await userAPI.createExam(fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res && res.success) {
          push({ title: 'Success', body: status === 'draft' ? 'Exam saved as draft.' : 'Exam created.' });
          onCreated?.(res.data);
          onClose?.();
          setForm({ course_id: defaultCourseId || '', title: '', type: '', description: '', start_date_date: '', start_date_time: '', end_date_date: '', end_date_time: '' });
          if (fileRef.current) fileRef.current.value = null;
        } else {
          push({ title: 'Error', body: res?.message || 'Failed to create exam' });
        }
      }
    } catch (err) {
      console.error('Create exam error', err);
      push({ title: 'Error', body: err?.response?.data?.message || err.message || 'Server error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={exam ? 'Edit exam' : 'Create new exam'}>
      <form className="create-lecture-form" onSubmit={(e) => e.preventDefault()}>
        <FormField label="Title" name="title" value={form.title} onChange={update} placeholder="Exam title" required />
          <FormField label="Type" name="type" value={form.type} onChange={update} options={[{ value: 'SINGLE', label: 'Single' }, { value: 'GROUP', label: 'Group' }]} required />
        <FormField label="Description" name="description" value={form.description} onChange={update} placeholder="Optional description" textarea />

        <div className="form-row">
          <FormField label="Start date" name="start_date_date" type="date" value={form.start_date_date} onChange={update} required />
          <FormField label="Start time" name="start_date_time" type="time" value={form.start_date_time} onChange={update} inputProps={{ min: '00:00', max: '23:59' }} required />
        </div>

        <div className="form-row">
          <FormField label="End date" name="end_date_date" type="date" value={form.end_date_date} onChange={update} required />
          <FormField label="End time" name="end_date_time" type="time" value={form.end_date_time} onChange={update} inputProps={{ min: '00:00', max: '23:59' }} required />
        </div>

        <FormField label="Attachment" name="file" type="file" inputRef={fileRef} />

        <div className="create-lecture-form__actions">
          <button type="button" className="btn btn-signin" onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={() => doSubmit('published')} disabled={submitting}>{submitting ? 'Submitting…' : 'Apply'}</button>
        </div>
      </form>
    </Modal>
  );
}
