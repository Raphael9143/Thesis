import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import userAPI from '../../../services/userAPI';
import { useNotifications } from '../../contexts/NotificationContext';
import '../../assets/styles/pages/CreateLecture.css';

export default function CreateAssignmentForm({ open, onClose, defaultCourseId = null, onCreated }) {
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
	const fileRef = useRef(null); // required .use file
	const attachmentsRef = useRef(null); // optional additional files

	useEffect(() => {
		setForm((f) => ({ ...f, course_id: defaultCourseId || '' }));
	}, [defaultCourseId, open]);

	const update = (e) => {
		const { name, value } = e.target;
		setForm((s) => ({ ...s, [name]: value }));
	};

	const validateUseFile = (file) => {
		if (!file) return false;
		const name = file.name || '';
		return name.toLowerCase().endsWith('.use');
	};

	const doSubmit = async () => {
		if (!form.course_id || !form.title) {
			push({ title: 'Validation', body: 'Course and title are required.' });
			return;
		}

		// main .use file is optional; if provided validate extension
		const files = fileRef.current?.files;
		let useFile = null;
		if (files && files.length > 0) {
			useFile = files[0];
			if (!validateUseFile(useFile)) {
				push({ title: 'Validation', body: 'The main file must have a .use extension.' });
				return;
			}
		}

		setSubmitting(true);
		try {
			const fd = new FormData();
			fd.append('course_id', form.course_id);
			fd.append('title', form.title);
			if (form.description) fd.append('description', form.description);
			// combine date+time fields into ISO datetimes (if provided)
			if (form.start_date_date) {
				const time = form.start_date_time || '00:00';
				try {
					const iso = new Date(`${form.start_date_date}T${time}`).toISOString();
					fd.append('start_date', iso);
				} catch (err) {
					// fallback: append as raw local string
					fd.append('start_date', `${form.start_date_date}T${time}`);
				}
			}
			if (form.end_date_date) {
				const time2 = form.end_date_time || '23:59';
				try {
					const iso2 = new Date(`${form.end_date_date}T${time2}`).toISOString();
					fd.append('end_date', iso2);
				} catch (err) {
					fd.append('end_date', `${form.end_date_date}T${time2}`);
				}
			}
			// append main .use file only if provided
			if (useFile) fd.append('file', useFile);

			// optional attachments
			const atts = attachmentsRef.current?.files;
			if (atts && atts.length > 0) {
				for (let i = 0; i < atts.length; i++) fd.append('attachments', atts[i]);
			}

			const res = await userAPI.createAssignment(fd, { headers: { 'Content-Type': 'multipart/form-data' } });
			if (res && res.success) {
				push({ title: 'Success', body: 'Assignment created.' });
				onCreated?.(res.data);
				onClose?.();
				// reset
				setForm({ course_id: defaultCourseId || '', title: '', description: '', start_date_date: '', start_date_time: '', end_date_date: '', end_date_time: '' });
				if (fileRef.current) fileRef.current.value = null;
				if (attachmentsRef.current) attachmentsRef.current.value = null;
			} else {
				push({ title: 'Error', body: res?.message || 'Failed to create assignment' });
			}
		} catch (err) {
			console.error('Create assignment error', err);
			push({ title: 'Error', body: err?.response?.data?.message || err.message || 'Server error' });
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal open={open} onClose={onClose} title="Create new assignment">
			<form className="create-lecture-form" onSubmit={(e) => e.preventDefault()}>
				<FormField
					label="Title"
					name="title"
					value={form.title}
					onChange={update}
					placeholder="Assignment title"
					required
				/>
				<FormField
					label="Description"
					name="description"
					value={form.description}
					onChange={update}
					placeholder="Optional description"
					textarea
				/>
                

				<div className="form-row">
					<FormField
						label="Start date"
						name="start_date_date"
						type="date"
						value={form.start_date_date}
						onChange={update}
						required
					/>
					<FormField
						label="Start time"
						name="start_date_time"
						type="time"
						value={form.start_date_time}
						onChange={update}
						inputProps={{ min: '00:00', max: '23:59' }}
						required
					/>
				</div>

				<div className="form-row">
					<FormField
						label="End date"
						name="end_date_date"
						type="date"
						value={form.end_date_date}
						onChange={update}
						required
					/>
					<FormField
						label="End time"
						name="end_date_time"
						type="time"
						value={form.end_date_time}
						onChange={update}
						inputProps={{ min: '00:00', max: '23:59' }}
						required
					/>
				</div>
 
				<FormField
					label="Model"
					name="file"
					type="file"
					inputRef={fileRef}
					inputProps={{ accept: '.use' }}
				/>
                
				<div className="create-lecture-form__actions">
					<button type="button" className="btn btn-signin" onClick={onClose} disabled={submitting}>Cancel</button>
					<button type="button" className="btn btn-primary" onClick={doSubmit} disabled={submitting}>{submitting ? 'Submitting…' : 'Create'}</button>
				</div>
			</form>
		</Modal>
	);
}
