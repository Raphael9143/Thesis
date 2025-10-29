import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import NotificationPopup from '../../components/ui/NotificationPopup';
import userAPI from '../../../services/userAPI';
import axiosClient from '../../../services/axiosClient';
import { usePageInfo } from '../../contexts/PageInfoContext';
import '../../assets/styles/ui.css';
import '../../assets/styles/pages/AssignmentPreview.css';

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

export default function AssignmentPreview() {
		const { id, assignmentId } = useParams();
		const resourceId = id || assignmentId;
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [assignment, setAssignment] = useState(null);
	const [notifyOpen, setNotifyOpen] = useState(false);
	const [notifyMsg, setNotifyMsg] = useState('');
	const [notifyType, setNotifyType] = useState('info');
	const { setTitle: setPageTitle } = usePageInfo();

	useEffect(() => {
		let mounted = true;
			(async () => {
			setLoading(true);
			try {
					const res = await userAPI.getAssignmentById(resourceId);
				if (!mounted) return;
				if (res?.success && res.data) {
					setAssignment(res.data);
					try { setPageTitle(res.data.title || (res.data.courses?.[0]?.course_name) || 'Assignment'); } catch (_) { }
				} else {
					setError(res?.message || 'Failed to load assignment');
				}
			} catch (err) {
				console.error('load assignment error', err);
				setError(err?.response?.data?.message || err.message || 'Server error');
			} finally {
				if (mounted) setLoading(false);
			}
			})();
		return () => { mounted = false; };
	}, [id]);

	if (loading) return (<Section title="Assignment Preview"><Card>Loading...</Card></Section>);
	if (error) return (<Section title="Assignment Preview"><Card><div className="text-error">{error}</div></Card></Section>);
	if (!assignment) return (<Section title="Assignment Preview"><Card><div>No assignment found.</div></Card></Section>);

	return (
		<Section title={assignment.title || 'Assignment'}>
			<Card>
				<div className="assignment-preview">
					<div className="preview-meta">
						<div><strong>Course:</strong> {assignment.courses?.[0]?.course_name || ''}</div>
						<div><strong>Start:</strong> {fmtDate(assignment.start_date)}</div>
						<div><strong>Due:</strong> {fmtDate(assignment.end_date)}</div>
					</div>

					<div className="preview-body">
						<div dangerouslySetInnerHTML={{ __html: assignment.description || '' }} />
					</div>

					<div className="file-download">
						{assignment.file ? (
							<a href={toFullUrl(assignment.file)} target="_blank" rel="noreferrer" className="btn btn-primary">Download attachment</a>
						) : (
							<div>No file attached.</div>
						)}
					</div>

					<div className="meta-small mt-12">
						<small>Created: {fmtDate(assignment.created_at)} • Updated: {fmtDate(assignment.updated_at)}</small>
					</div>
				</div>
			</Card>

			<NotificationPopup message={notifyMsg} open={notifyOpen} type={notifyType} onClose={() => setNotifyOpen(false)} />
		</Section>
	);
}
