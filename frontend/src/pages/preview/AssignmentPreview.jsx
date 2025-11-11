import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import userAPI from '../../../services/userAPI';
import { usePageInfo } from '../../contexts/PageInfoContext';
import '../../assets/styles/ui.css';
import '../../assets/styles/pages/AssignmentPreview.css';
import FilePreview from '../../components/ui/FilePreview';
import toFullUrl from '../../utils/FullURLFile';
import fmtDate from '../../utils/FormatDate';
import { formatAvailable, formatDue } from '../../utils/previewMeta';
import SubmitWork from '../student/SubmitWork';

export default function AssignmentPreview() {
  const { id, assignmentId } = useParams();
  const resourceId = id || assignmentId;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignment, setAssignment] = useState(null);
  const { setTitle: setPageTitle } = usePageInfo();
  const role = (typeof window !== 'undefined' && sessionStorage.getItem('role')) || null;
  // Removed inline submission state (now handled on dedicated submit page)

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
    return assignment.end_date || assignment?.courses?.[0]?.assignment_course?.due_date || assignment.due_date || null;
  }, [assignment]);

  const isExpired = useMemo(() => {
    if (!dueAt) return false;
    const t = new Date(dueAt).getTime();
    return Number.isFinite(t) && Date.now() > t;
  }, [dueAt]);

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
  console.log(toFullUrl(assignment.attachment));
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
          <div>
            <p>Submit</p>
          </div>
          {!isExpired && role === 'student' && <SubmitWork />}

          {/* {role === 'student' && classId && courseId && (
            <div className="mt-16">
              <h4 className="no-margin">Submit your work (.use)</h4>
              <div className="mt-8">
                <Link
                  to={`/education/student/classes/${classId}/courses/${courseId}/assignments/${resourceId}/submit`}
                  className={`btn btn-primary ${isExpired ? 'disabled' : ''}`}
                  aria-disabled={isExpired}
                  onClick={(e) => {
                    if (isExpired) {
                      e.preventDefault();
                      push({ title: 'Closed', body: 'Submissions are closed for this assignment.' });
                    }
                  }}
                >
                  Go to Submit Page
                </Link>
              </div>
              {isExpired && <small className="text-error">Submissions are closed for this assignment.</small>}
            </div>
          )} */}
          <div className="meta-small mt-12">
            <small>
              Created: {fmtDate(assignment.created_at)} • Updated: {fmtDate(assignment.updated_at)}
            </small>
          </div>
        </div>
      </Card>
    </Section>
  );
}
