import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import NotificationPopup from '../../components/ui/NotificationPopup';
import userAPI from '../../../services/userAPI';
import resolveAttachmentUrls from '../../utils/resolveAttachmentUrls';
import useTitle from '../../hooks/useTitle';
import '../../assets/styles/ui.css';
import '../../assets/styles/pages/ClassDetail.css';
import '../../assets/styles/pages/LecturePreview.css';
import FilePreview from '../../components/ui/FilePreview';
import toFullUrl from '../../utils/FullURLFile';
import fmtDate from '../../utils/FormatDate';
import { formatDue } from '../../utils/previewMeta';

// resolveAttachmentUrls is provided by src/utils/resolveAttachmentUrls.js

export default function LecturePreview() {
  const { id, lectureId } = useParams();
  const resourceId = id || lectureId;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lecture, setLecture] = useState(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [notifyType, setNotifyType] = useState('info');
  // use hook to set page title

  const role = (typeof window !== 'undefined' && sessionStorage.getItem('role')) || null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await userAPI.getLectureById(resourceId);
        if (!mounted) return;
        if (res?.success && res.data) {
          setLecture(res.data);
          // title will be set via useTitle below
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
    return () => {
      mounted = false;
    };
  }, [resourceId]);

  useTitle(lecture?.title || 'Lecture');

  // When lecture loads, attempt to resolve attachment URLs to a working absolute URL
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!lecture || !Array.isArray(lecture.attachments) || lecture.attachments.length === 0) return;
      try {
        // clone attachments to avoid mutating source objects owned elsewhere
        const copy = lecture.attachments.map((a) => ({ ...a }));
        const resolved = await resolveAttachmentUrls(copy);
        if (!mounted) return;
        setLecture((prev) => ({ ...prev, attachments: resolved }));

        // If resolution succeeded but nothing looks downloadable, notify the user
        const hasDownloadable =
          Array.isArray(resolved) &&
          resolved.some((att) => {
            if (!att) return false;
            if (typeof att === 'string') return true;
            return Boolean(att.__url || att.url || att.path || att.filename);
          });
        if (!hasDownloadable) {
          setNotifyType('info');
          setNotifyMsg('No downloadable attachments found for this lecture.');
          setNotifyOpen(true);
        }
      } catch (err) {
        console.error('Resolve attachments error', err);
        setNotifyType('error');
        setNotifyMsg('Failed to resolve attachment URLs: ' + (err?.message || String(err)));
        setNotifyOpen(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [lecture]);

  if (loading)
    return (
      <Section title="Lecture Preview">
        <Card>Loading...</Card>
      </Section>
    );
  if (error)
    return (
      <Section title="Lecture Preview">
        <Card>
          <div className="text-error">{error}</div>
        </Card>
      </Section>
    );
  if (!lecture)
    return (
      <Section title="Lecture Preview">
        <Card>
          <div>No lecture found.</div>
        </Card>
      </Section>
    );

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
              <div>
                <strong>Course:</strong> {lecture.course?.course_name || lecture.course?.course_name || ''}
              </div>
              <div>
                <strong>Publish date:</strong> {fmtDate(lecture.publish_date)}
              </div>
              <div>
                <strong>Status:</strong> {lecture.status}
              </div>
              <div>
                <strong>Due</strong> {formatDue(null)} &nbsp; <strong>Available</strong>
              </div>
              <div>
                {lecture.attachment && (
                  <a
                    href={toFullUrl(lecture.attachment)}
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

          <div className="preview-attachments">
            {attachments.length > 0 ? (
              attachments.map((att, idx) => {
                const a = typeof att === 'string' ? { url: att } : att || {};
                const isImage = a.mimetype && a.mimetype.startsWith('image/');
                const raw = a.__url || a.url || a.path || a.filename || a;
                const url = toFullUrl(raw);
                const name =
                  a.originalname || a.filename || (typeof a === 'string' ? String(a).split('/').pop() : 'attachment');
                return (
                  <div key={idx} className="attachment-item">
                    {isImage ? (
                      <img src={url} alt={name} className="img-responsive" />
                    ) : (
                      <div>
                        <FilePreview url={url} filename={name} mimetype={a.mimetype} filePath={raw} />
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div>No attachments.</div>
            )}
          </div>
          {role === 'teacher' && (
            <div className="mt-12">
              <small>
                Created: {fmtDate(lecture.createdAt)} • Updated: {fmtDate(lecture.updatedAt)}
              </small>
            </div>
          )}
        </div>
      </Card>

      <NotificationPopup message={notifyMsg} open={notifyOpen} type={notifyType} onClose={() => setNotifyOpen(false)} />
    </Section>
  );
}
