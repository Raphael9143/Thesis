import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import userAPI from '../../../services/userAPI';
import { useNotifications } from '../../contexts/NotificationContext';
import '../../assets/styles/pages/CreateLecture.css';

export default function CreateLectureForm({
  open,
  onClose,
  defaultCourseId = null,
  defaultClassId = null,
  onCreated,
  lecture = null,
  onUpdated,
}) {
  const { push } = useNotifications();
  const [form, setForm] = useState({
    course_id: defaultCourseId || '',
    class_id: defaultClassId || '',
    title: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (lecture) {
      setForm({
        course_id: lecture.course_id || defaultCourseId || '',
        class_id: lecture.class_id || defaultClassId || '',
        title: lecture.title || '',
      });
    } else {
      setForm({ course_id: defaultCourseId || '', class_id: defaultClassId || '', title: '' });
    }
    if (fileRef.current) fileRef.current.value = null;
  }, [defaultCourseId, defaultClassId, open, lecture]);

  const update = (e) => {
    const title = e?.target?.value ?? '';
    setForm((s) => ({ ...s, title }));
  };

  const doSubmit = async (status) => {
    if (!form.course_id || !form.title) {
      push({ title: 'Validation', body: 'Course and title are required.' });
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('course_id', form.course_id);
      if (form.class_id) fd.append('class_id', form.class_id);
      fd.append('title', form.title);
      if (typeof status !== 'undefined' && status !== null && status !== '') {
        fd.append('status', status);
        if (status === 'published') fd.append('publish_date', new Date().toISOString());
      }

      // Only a single file is supported — take the first one
      const file = fileRef.current?.files?.[0];
      if (file) fd.append('attachment', file);

      let res;
      if (lecture && lecture.id) {
        res = await userAPI.updateLecture(lecture.id, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await userAPI.createLecture(fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (res && res.success) {
        push({ title: 'Success', body: lecture ? 'Lecture updated.' : 'Lecture created.' });
        if (lecture) onUpdated?.(res.data);
        else onCreated?.(res.data);
        onClose?.();
        setForm({ course_id: defaultCourseId || '', class_id: defaultClassId || '', title: '' });
        if (fileRef.current) fileRef.current.value = null;
      } else {
        push({ title: 'Error', body: res?.message || 'Failed to create/update lecture' });
      }
    } catch (err) {
      console.error('Create lecture error', err);
      push({ title: 'Error', body: err?.response?.data?.message || err.message || 'Server error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={lecture ? 'Edit lecture' : 'Create new lecture'}>
      <form className="create-lecture-form" onSubmit={(e) => e.preventDefault()}>
        <FormField
          label="Title"
          name="title"
          value={form.title}
          onChange={update}
          placeholder="Lecture title"
          required
        />

        <div className="form-group">
          <label htmlFor="attachment">Attachment</label>
          <input id="attachment" name="attachment" type="file" ref={fileRef} />
        </div>

        <div className="create-lecture-form__actions">
          {lecture ? (
            <>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={onClose}
                disabled={submitting}
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Cancel</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => doSubmit()}
                disabled={submitting}
              >
                <i className="fa-solid fa-check"></i>
                <span>Apply</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={onClose}
                disabled={submitting}
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Cancel</span>
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => doSubmit('draft')}
                disabled={submitting}
              >
                <i className="fa-solid fa-file-pen"></i>
                <span>Draft</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => doSubmit('published')}
                disabled={submitting}
              >
                <i className="fa-solid fa-upload"></i>
                <span>Publish</span>
              </button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
}
