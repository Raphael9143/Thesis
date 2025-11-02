import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import NotificationPopup from '../../components/ui/NotificationPopup';
import userAPI from '../../../services/userAPI';
import axiosClient from '../../../services/axiosClient';
import { usePageInfo } from '../../contexts/PageInfoContext';
import '../../assets/styles/ui.css';
import '../../assets/styles/pages/ClassDetail.css';
import '../../assets/styles/pages/LecturePreview.css';
import FilePreview from '../../components/ui/FilePreview';
import toFullUrl from '../../utils/FullURLFile';
import fmtDate from '../../utils/FormatDate';
import { formatDue } from '../../utils/previewMeta';

async function resolveAttachmentUrls(attachments) {
	if (!Array.isArray(attachments) || attachments.length === 0) return attachments;
	const base = axiosClient.defaults.baseURL || '';
	let origin = '';
	let basePath = '';
	try {
		const u = new URL(base);
		origin = u.origin;
		basePath = (u.pathname || '').replace(/\/$/, '');
	} catch (err) {
		// ignore
	}

	// Helper to test a url using HEAD; fall back to GET if HEAD not allowed.
	async function testUrl(url) {
		try {
			const res = await fetch(url, { method: 'HEAD' });
			if (res && res.ok) return true;
			// Some servers do not support HEAD; try GET but do not download body
			const res2 = await fetch(url, { method: 'GET' });
			return res2 && res2.ok;
		} catch (err) {
			return false;
		}
	}

	// iterate attachments sequentially to avoid many parallel requests
	for (const att of attachments) {
		try {
			const raw = att.url || att.path || att.filename || '';
			if (!raw) continue;
			if (/^https?:\/\//i.test(raw)) {
				att.__url = raw;
				continue;
			}
			const candidates = [];
			if (raw.startsWith('/')) {
				candidates.push(origin + raw);
				if (basePath) candidates.push(origin + basePath + raw);
			} else {
				candidates.push(origin + '/' + raw.replace(/^\/+/, ''));
				if (basePath) candidates.push(origin + basePath + '/' + raw.replace(/^\/+/, ''));
			}

			let okUrl = null;
			for (const c of candidates) {
				// test candidate
				// eslint-disable-next-line no-await-in-loop
				const ok = await testUrl(c);
				if (ok) { okUrl = c; break; }
			}
			if (okUrl) att.__url = okUrl;
		} catch (err) {
			// ignore per-attachment errors
			// console.debug('attachment resolve err', err);
		}
	}

	return attachments;
}

export default function LecturePreview() {
	const { id, lectureId } = useParams();
	const resourceId = id || lectureId;
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [lecture, setLecture] = useState(null);
	const [notifyOpen, setNotifyOpen] = useState(false);
	const [notifyMsg, setNotifyMsg] = useState('');
	const [notifyType, setNotifyType] = useState('info');
	const { setTitle: setPageTitle } = usePageInfo();

	useEffect(() => {
		let mounted = true;
		(async () => {
			setLoading(true);
			try {
				const res = await userAPI.getLectureById(resourceId);
				if (!mounted) return;
				if (res?.success && res.data) {
					setLecture(res.data);
					try { setPageTitle(res.data.title || (res.data.course && (res.data.course.course_name || res.data.course.course_name)) || 'Lecture'); } catch (_) { }
				} else {
					setError(res?.message || 'Failed to load lecture');
				}
			} catch (err) {
				console.error('load lecture error', err);
				setError(err?.response?.data?.message || err.message || 'Server error');
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => { mounted = false; };
	}, [resourceId]);

	// When lecture loads, attempt to resolve attachment URLs to a working absolute URL
	useEffect(() => {
		let mounted = true;
		(async () => {
			if (!lecture || !Array.isArray(lecture.attachments) || lecture.attachments.length === 0) return;
			try {
				// clone attachments to avoid mutating source objects owned elsewhere
				const copy = lecture.attachments.map(a => ({ ...a }));
				const resolved = await resolveAttachmentUrls(copy);
				if (!mounted) return;
				setLecture(prev => ({ ...prev, attachments: resolved }));
			} catch (err) {
				// ignore
			}
		})();
		return () => { mounted = false; };
	}, [lecture]);

	if (loading) return (<Section title="Lecture Preview"><Card>Loading...</Card></Section>);
	if (error) return (<Section title="Lecture Preview"><Card><div className="text-error">{error}</div></Card></Section>);
	if (!lecture) return (<Section title="Lecture Preview"><Card><div>No lecture found.</div></Card></Section>);

	// Normalize attachments: older shape used `attachment` (single string or object),
	// newer shape uses `attachments` array. Convert to array for rendering.
	const attachments = (() => {
		const raw = lecture.attachments || lecture.attachment;
		if (!raw) return [];
		if (Array.isArray(raw)) return raw;
		if (typeof raw === 'string') return [{ url: raw }];
		return [raw];
	})();

	return (
		<Section title={lecture.title || 'Lecture'}>
			<Card>
				<div className="lecture-preview">
					<div className="preview-meta">
						<div className="preview-header">
							<div><strong>Course:</strong> {lecture.course?.course_name || lecture.course?.course_name || ''}</div>
							<div><strong>Publish date:</strong> {fmtDate(lecture.publish_date)}</div>
							<div><strong>Status:</strong> {lecture.status}</div>
							<div>
								<strong>Due</strong> {formatDue(null)} &nbsp; <strong>Available</strong>
							</div>
							<div>
								{lecture.attachment && (
									<a href={toFullUrl(lecture.attachment)} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" download>
										Download
									</a>
								)}
							</div>
						</div>
					</div>

					<div className="preview-attachments">
						{attachments.length > 0 ? (
							attachments.map((att, idx) => {
								const a = (typeof att === 'string') ? { url: att } : att || {};
								const isImage = a.mimetype && a.mimetype.startsWith('image/');
								const raw = a.__url || a.url || a.path || a.filename || a;
								const url = toFullUrl(raw);
								const name = a.originalname || a.filename || (typeof a === 'string' ? String(a).split('/').pop() : 'attachment');
								return (
									<div key={idx} className="attachment-item">
										{isImage ? (
											<img src={url} alt={name} className="img-responsive" />
										) : (
											<div>
												<FilePreview url={url} filename={name} mimetype={a.mimetype} />
											</div>
										)}
									</div>
								);
							})
						) : (
							<div>No attachments.</div>
						)}
					</div>
					<div className="mt-12">
						<small>Created: {fmtDate(lecture.createdAt)} • Updated: {fmtDate(lecture.updatedAt)}</small>
					</div>
				</div>
			</Card>

			<NotificationPopup message={notifyMsg} open={notifyOpen} type={notifyType} onClose={() => setNotifyOpen(false)} />
		</Section>
	);
}
