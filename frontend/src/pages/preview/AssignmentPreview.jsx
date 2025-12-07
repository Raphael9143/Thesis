import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import userAPI from '../../../services/userAPI';
import { useNotifications } from '../../contexts/NotificationContext';
import { usePageInfo } from '../../contexts/PageInfoContext';
import '../../assets/styles/ui.css';
import '../../assets/styles/pages/AssignmentPreview.css';
import FilePreview from '../../components/ui/FilePreview';
import toFullUrl from '../../utils/FullURLFile';
import fmtDate from '../../utils/FormatDate';
import { formatAvailable, formatDue } from '../../utils/previewMeta';
import SubmitWork from '../student/SubmitWork';
import DashedDivider from '../../components/ui/DashedDivider';
import SubmissionHistory from '../../components/ui/SubmissionHistory';

export default function AssignmentPreview() {
  const { id, assignmentId } = useParams();
  const resourceId = id || assignmentId;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignment, setAssignment] = useState(null);
  const { setTitle: setPageTitle } = usePageInfo();
  const role = (typeof window !== 'undefined' && sessionStorage.getItem('role')) || null;
  // Removed inline submission state (now handled on dedicated submit page)
  const [contentTab, setContentTab] = useState('problem'); // 'problem' | 'history' | 'answer'
  const { push } = useNotifications();
  const answerRef = React.useRef(null);
  const [savingAnswer, setSavingAnswer] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await userAPI.getAssignmentById(resourceId);
        if (!mounted) return;
        if (res?.success && res.data) {
          setAssignment(res.data);
          try {
            setPageTitle(res.data.title || res.data.courses?.[0]?.course_name || 'Assignment');
          } catch (err) {
            console.error('Set Page Title error', err);
          }
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
    return () => {
      mounted = false;
    };
  }, [id, resourceId, setPageTitle]);

  const dueAt = useMemo(() => {
    if (!assignment) return null;
    return (
      assignment.end_date ||
      assignment?.courses?.[0]?.assignment_course?.due_date ||
      assignment.due_date ||
      null
    );
  }, [assignment]);

  const isExpired = useMemo(() => {
    if (!dueAt) return false;
    const t = new Date(dueAt).getTime();
    return Number.isFinite(t) && Date.now() > t;
  }, [dueAt]);

  // History moved to reusable component

  // Inline submission removed in favor of dedicated submission page

  if (loading)
    return (
      <Section title="Assignment Preview">
        <Card>Loading...</Card>
      </Section>
    );
  if (error)
    return (
      <Section title="Assignment Preview">
        <Card>
          <div className="text-error">{error}</div>
        </Card>
      </Section>
    );
  if (!assignment)
    return (
      <Section title="Assignment Preview">
        <Card>
          <div>No assignment found.</div>
        </Card>
      </Section>
    );
  return (
    <Section>
      <Card>
        <div className="assignment-preview">
          <div className="preview-meta">
            <div className="preview-header">
              <div>
                <strong>Course:</strong> {assignment.courses?.[0]?.course_name || ''}
              </div>
              <div>
                <strong>Due</strong> {formatDue(assignment.end_date)}
              </div>
              <div>
                <strong>Available</strong>{' '}
                {assignment.start_date || assignment.end_date
                  ? formatAvailable(assignment.start_date, assignment.end_date, '')
                  : 'Available'}
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
                    <i className="fa-solid fa-download"></i>
                    <span>Download</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Tabs for Problem / History */}
          {/* Students see Problem/History; teachers see Problem/Answer */}
          {role === 'student' && (
            <Tabs
              tabs={[
                { value: 'problem', label: 'Problem' },
                { value: 'history', label: 'History' },
              ]}
              activeTab={contentTab}
              onChange={setContentTab}
            />
          )}
          {role === 'teacher' && (
            <Tabs
              tabs={[
                { value: 'problem', label: 'Problem' },
                { value: 'answer', label: 'Answer' },
              ]}
              activeTab={contentTab}
              onChange={setContentTab}
            />
          )}

          {contentTab === 'problem' && (
            <>
              <div>
                <h2>Problem</h2>
              </div>
              <div className="preview-body">
                <div dangerouslySetInnerHTML={{ __html: assignment.description || '' }} />
              </div>
              <div className="file-download">
                {assignment.attachment ? (
                  <div className="file-preview-wrapper">
                    <FilePreview
                      url={toFullUrl(assignment.attachment)}
                      filename={assignment.attachment || ''}
                      filePath={assignment.attachment}
                    />
                  </div>
                ) : (
                  <div>No file attached.</div>
                )}
              </div>
            </>
          )}

          {role === 'teacher' && contentTab === 'answer' && (
            <>
              <div>
                <h2>Answer (teacher)</h2>
              </div>
              <div className="preview-body">
                <div className="meta-small">Current answer:</div>
                {assignment.answer_attachment ? (
                  <div className="file-preview-wrapper mt-8">
                    <FilePreview
                      url={toFullUrl(assignment.answer_attachment)}
                      filename={assignment.answer_attachment}
                      filePath={assignment.answer_attachment}
                    />
                  </div>
                ) : (
                  <div>No answer uploaded yet.</div>
                )}

                <div className="mt-8">
                  <label className="form-group">
                    <div className="form-group label">Replace answer (.use)</div>
                    <input type="file" ref={answerRef} accept=".use" />
                  </label>
                </div>

                <div className="create-lecture-form__actions mt-8">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={async () => {
                      const files = answerRef.current?.files;
                      if (!files || files.length === 0) {
                        push({ title: 'Validation', body: 'Please choose a file to upload.' });
                        return;
                      }
                      const f = files[0];
                      setSavingAnswer(true);
                      try {
                        const fd = new FormData();
                        fd.append('answer', f);
                        const res = await userAPI.patchAssignmentAnswer(resourceId, fd, {
                          headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        if (res && res.success) {
                          push({ title: 'Success', body: 'Answer updated.' });
                          setAssignment(res.data);
                        } else {
                          push({ title: 'Error', body: res?.message || 'Failed to update answer' });
                        }
                      } catch (err) {
                        console.error('patch answer error', err);
                        push({ title: 'Error', body: err?.message || 'Server error' });
                      } finally {
                        setSavingAnswer(false);
                      }
                    }}
                    disabled={savingAnswer}
                  >
                    <i className="fa-solid fa-save"></i>
                    <span>{savingAnswer ? 'Saving...' : 'Save Answer'}</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {role === 'student' && contentTab === 'history' && (
            <SubmissionHistory type="assignment" id={resourceId} />
          )}
          {!isExpired && role === 'student' && contentTab !== 'history' && (
            <>
              <DashedDivider />
              <div>
                <h2>Submission</h2>
              </div>
              <SubmitWork />
            </>
          )}
          {role === 'teacher' && (
            <div className="meta-small mt-12">
              <small>
                Created: {fmtDate(assignment.created_at)} • Updated:{' '}
                {fmtDate(assignment.updated_at)}
              </small>
            </div>
          )}
        </div>
      </Card>
    </Section>
  );
}
