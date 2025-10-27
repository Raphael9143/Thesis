import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import userAPI from '../../../services/userAPI';
import { useNotifications } from '../../contexts/NotificationContext';
import '../../assets/styles/pages/teacher/CreateLecture.css';

export default function CreateLectureForm({ open, onClose, defaultCourseId = null, defaultClassId = null, onCreated, lecture = null, onUpdated }) {
	const { push } = useNotifications();
	const [form, setForm] = useState({
		course_id: defaultCourseId || '',
		class_id: defaultClassId || '',
		title: '',
	});
	const [submitting, setSubmitting] = useState(false);
	const fileRef = useRef(null);

	useEffect(() => {
		setForm((f) => ({ ...f, course_id: defaultCourseId || '', class_id: defaultClassId || '' }));
		if (lecture) {
			setForm((f) => ({
				...f,
				title: lecture.title || '',
				course_id: lecture.course_id || lecture.courseId || f.course_id,
				class_id: lecture.class_id || lecture.classId || f.class_id,
			}));
		}
	}, [defaultCourseId, defaultClassId, open, lecture]);

	const update = (e) => {
		try {
			const title = e.target.value;
			setForm((s) => ({ ...s, title: title }));
		} catch (err) {
			console.warn('[CreateLectureForm] update received non-event payload', e);
		}
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
			// only append status/publish_date when explicitly provided
			if (typeof status !== 'undefined' && status !== null && status !== '') {
				fd.append('status', status);
				if (status === 'published') fd.append('publish_date', new Date().toISOString());
			}

			// append files if any
			const files = fileRef.current?.files;
			if (files && files.length > 0) {
				for (let i = 0; i < files.length; i++) {
					fd.append('attachments', files[i]);
				}
			}

			// Use centralized API service; pass multipart headers so boundary is set
			let res;
			if (lecture && lecture.id) {
				res = await userAPI.updateLecture(lecture.id, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
			} else {
				res = await userAPI.createLecture(fd, { headers: { 'Content-Type': 'multipart/form-data' } });
			}

			if (res && res.success) {
				push({ title: 'Success', body: lecture ? 'Lecture updated.' : 'Lecture created.' });
				if (lecture) onUpdated?.(res.data);
				else onCreated?.(res.data);
				onClose?.();
				// reset form
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
				<FormField label="Title" name="title" value={form.title} onChange={update} placeholder="Lecture title" required />

				<div className="form-group">
					<label htmlFor="attachments">Attachments (files)</label>
					<input id="attachments" name="attachments" type="file" ref={fileRef} multiple />
				</div>

				<div className="create-lecture-form__actions">
					{lecture ? (
						<>
							<button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
							<button type="button" className="btn btn-primary" onClick={() => doSubmit()} disabled={submitting}>{submitting ? 'Applying…' : 'Apply'}</button>
						</>
					) : (
						<>
							<button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
							<button type="button" className="btn btn-outline" onClick={() => doSubmit('draft')} disabled={submitting}>Save as Draft</button>
							<button type="button" className="btn btn-primary" onClick={() => doSubmit('published')} disabled={submitting}>{submitting ? 'Submitting…' : 'Publish'}</button>
						</>
					)}
				</div>
			</form>
		</Modal>
	);
}
