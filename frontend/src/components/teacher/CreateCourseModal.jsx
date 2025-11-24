import React, { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import NotificationPopup from '../../components/ui/NotificationPopup';
import userAPI from '../../../services/userAPI';
import generateRandomCode from '../../utils/generateRandomCode';
import '../../assets/styles/components/teacher/CreateClassModal.css';

export default function CreateCourseModal({ open, onClose, defaultClassId = null, onCreated }) {
  const [courseName, setCourseName] = useState('');
  const [description, setDescription] = useState('');
  const [semester, setSemester] = useState('');

  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [notifyType, setNotifyType] = useState('info');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setCourseName('');
      setDescription('');
      setSemester('');
    }
  }, [open]);

  const onSubmit = async (e, status = 'ACTIVE') => {
    if (e?.preventDefault) e.preventDefault();
    if (!courseName || !defaultClassId) {
      setNotifyMsg('course_name and class_id are required');
      setNotifyType('error');
      setNotifyOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      const codeToUse = generateRandomCode(5);
      const payload = {
        course_name: courseName,
        course_code: codeToUse,
        description,
        semester,
        class_id: defaultClassId,
      };
      if (typeof status !== 'undefined' && status !== null && status !== '')
        payload.status = status;

      const res = await userAPI.createCourse(payload);
      if (res?.success) {
        setNotifyMsg(status === 'DRAFT' ? 'Course saved as draft' : 'Course created');
        setNotifyType('success');
        setNotifyOpen(true);
        onCreated?.(res.data);
        onClose?.();
      } else {
        setNotifyMsg(res?.message || 'Failed to create course');
        setNotifyType('error');
        setNotifyOpen(true);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Server error';
      setNotifyMsg(msg);
      setNotifyType('error');
      setNotifyOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Course">
      <form onSubmit={onSubmit} className="create-class-modal-form">
        <div className="create-class-row">
          <FormField
            label="Course name"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            required={true}
          />
        </div>

        <div className="create-class-row mt">
          <FormField
            label="Semester"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
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

        <div className="create-class-actions">
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
            onClick={(e) => onSubmit(e, 'DRAFT')}
            disabled={submitting}
          >
            <i className="fa-solid fa-file-pen"></i>
            <span>Draft</span>
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
            <i className="fa-solid fa-upload"></i>
            <span>Publish</span>
          </button>
        </div>

        <NotificationPopup
          message={notifyMsg}
          open={notifyOpen}
          type={notifyType}
          onClose={() => setNotifyOpen(false)}
        />
      </form>
    </Modal>
  );
}
