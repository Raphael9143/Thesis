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
import FilePreview from '../../components/ui/FilePreview';
import toFullUrl from '../../utils/FullURLFile';
import fmtDate from '../../utils/FormatDate';
import { formatAvailable, formatDue } from '../../utils/previewMeta';

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
	console.log(toFullUrl(assignment.attachment))
	return (
		<Section title={assignment.title || 'Assignment'}>
			<Card>
				<div className="assignment-preview">
					<div className="preview-meta">
						<div className="preview-header">
							<div><strong>Course:</strong> {assignment.courses?.[0]?.course_name || ''}</div>
							<div>
								<strong>Due</strong> {formatDue(assignment.end_date)}
							</div>
							<div>
								<strong>Available</strong> {assignment.start_date || assignment.end_date ? formatAvailable(assignment.start_date, assignment.end_date, '') : 'Available'}
							</div>
							<div>
								{assignment.attachment && (
									<a
										href={toFullUrl(assignment.attachment)}
										target="_blank"
										rel="noreferrer"
										className="btn btn-primary btn-sm"
										download
									>
										Download
									</a>
								)}
							</div>
						</div>
					</div>

					<div className="preview-body">
						<div dangerouslySetInnerHTML={{ __html: assignment.description || '' }} />
					</div>

					<div className="file-download">
						{assignment.attachment ? (
							<div className="file-preview-wrapper">
								<FilePreview url={toFullUrl(assignment.attachment)} filename={assignment.attachment || ''} allowInlinePreview={false} />
							</div>
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
