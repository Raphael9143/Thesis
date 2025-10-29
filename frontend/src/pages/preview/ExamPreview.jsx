import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import NotificationPopup from '../../components/ui/NotificationPopup';
import userAPI from '../../../services/userAPI';
import axiosClient from '../../../services/axiosClient';
import { usePageInfo } from '../../contexts/PageInfoContext';
import '../../assets/styles/ui.css';
import '../../assets/styles/pages/ExamPreview.css';

function fmtDate(d) {
	if (!d) return '';
	try { return new Date(d).toLocaleString(); } catch { return d; }
}

function toFullUrl(path) {
	if (!path) return path;
	if (/^https?:\/\//i.test(path)) return path;
	try {
		const base = axiosClient.defaults.baseURL || '';
		const origin = new URL(base).origin;
		if (path.startsWith('/')) return origin + path;
		return origin + '/' + path.replace(/^\/+/, '');
	} catch (err) {
		return path;
	}
}

export default function ExamPreview() {
		const { id, examId } = useParams();
		const resourceId = id || examId;
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [exam, setExam] = useState(null);
	const [notifyOpen, setNotifyOpen] = useState(false);
	const [notifyMsg, setNotifyMsg] = useState('');
	const [notifyType, setNotifyType] = useState('info');
	const { setTitle: setPageTitle } = usePageInfo();

	useEffect(() => {
		let mounted = true;
			(async () => {
			setLoading(true);
			try {
					const res = await userAPI.getExamById(resourceId);
				if (!mounted) return;
				if (res?.success && res.data) {
					setExam(res.data);
					try { setPageTitle(res.data.title || (res.data.course?.course_name) || 'Exam'); } catch (_) { }
				} else {
					setError(res?.message || 'Failed to load exam');
				}
			} catch (err) {
				console.error('load exam error', err);
				setError(err?.response?.data?.message || err.message || 'Server error');
			} finally {
				if (mounted) setLoading(false);
			}
			})();
		return () => { mounted = false; };
	}, [id]);

	if (loading) return (<Section title="Exam Preview"><Card>Loading...</Card></Section>);
	if (error) return (<Section title="Exam Preview"><Card><div className="text-error">{error}</div></Card></Section>);
	if (!exam) return (<Section title="Exam Preview"><Card><div>No exam found.</div></Card></Section>);
	return (
		<Section title={exam.title || 'Exam'}>
			<Card>
				<div className="exam-preview">
					<div className="preview-meta">
						<div><strong>Course:</strong> {exam.course?.course_name || ''}</div>
						<div><strong>Window:</strong> {fmtDate(exam.start_time)} — {fmtDate(exam.end_time)}</div>
					</div>

					<div className="preview-body">
						<div dangerouslySetInnerHTML={{ __html: exam.description || '' }} />
					</div>

					<div className="model-file">
						{exam.model_file ? (
							<a href={toFullUrl(exam.model_file)} target="_blank" rel="noreferrer" className="btn btn-primary">Download model file</a>
						) : (
							<div>No model file attached.</div>
						)}
					</div>

					<div className="meta-small mt-12">
						<small>Created: {fmtDate(exam.createdAt)} • Updated: {fmtDate(exam.updatedAt)}</small>
					</div>
				</div>
			</Card>

			<NotificationPopup message={notifyMsg} open={notifyOpen} type={notifyType} onClose={() => setNotifyOpen(false)} />
		</Section>
	);
}
