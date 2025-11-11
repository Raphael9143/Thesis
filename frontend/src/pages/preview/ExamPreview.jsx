import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import userAPI from '../../../services/userAPI';
import { usePageInfo } from '../../contexts/PageInfoContext';
import '../../assets/styles/ui.css';
import '../../assets/styles/pages/ExamPreview.css';
import FilePreview from '../../components/ui/FilePreview';
import toFullUrl from '../../utils/FullURLFile';
import fmtDate from '../../utils/FormatDate';
import { formatAvailable, formatDue } from '../../utils/previewMeta';
import SubmitWork from '../student/SubmitWork';
import DashedDivider from '../../components/ui/DashedDivider';

export default function ExamPreview() {
  const { id, examId } = useParams();
  const resourceId = id || examId;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exam, setExam] = useState(null);
  const { setTitle: setPageTitle } = usePageInfo();
  const role = (typeof window !== 'undefined' && sessionStorage.getItem('role')) || null;
  // Removed inline submission state (now handled on dedicated submit page)

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await userAPI.getExamById(resourceId);
        if (!mounted) return;
        if (res?.success && res.data) {
          setExam(res.data);
          try {
            setPageTitle(res.data.title || res.data.course?.course_name || 'Exam');
          } catch (err) {
            console.error('Set Page Title error', err);
          }
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
    return () => {
      mounted = false;
    };
  }, [id, resourceId, setPageTitle]);

  const endAt = useMemo(() => {
    if (!exam) return null;
    return exam.end_date || null;
  }, [exam]);

  const isExpired = useMemo(() => {
    if (!endAt) return false;
    const t = new Date(endAt).getTime();
    return Number.isFinite(t) && Date.now() > t;
  }, [endAt]);

  // Inline submission removed in favor of dedicated submission page

  if (loading)
    return (
      <Section title="Exam Preview">
        <Card>Loading...</Card>
      </Section>
    );
  if (error)
    return (
      <Section title="Exam Preview">
        <Card>
          <div className="text-error">{error}</div>
        </Card>
      </Section>
    );
  if (!exam)
    return (
      <Section title="Exam Preview">
        <Card>
          <div>No exam found.</div>
        </Card>
      </Section>
    );
  console.log(toFullUrl(exam.attachment));
  return (
    <Section title={exam.title || 'Exam'}>
      <Card>
        <div className="exam-preview">
          <div className="preview-meta">
            <div className="preview-header">
              <div>
                <strong>Course:</strong> {exam.course?.course_name || ''}
              </div>
              <div>
                <strong>Due</strong> {formatDue(exam.end_date)}
              </div>
              <div>
                <strong>Available</strong>{' '}
                {exam.start_date || exam.end_date ? formatAvailable(exam.start_date, exam.end_date, '') : 'Available'}
              </div>
              <div>
                {exam.attachment && (
                  <a
                    href={toFullUrl(exam.attachment)}
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
          <DashedDivider />
          <div>
            <h2>Problem</h2>
          </div>
          <div className="preview-body">
            <div dangerouslySetInnerHTML={{ __html: exam.description || '' }} />
          </div>

          <div className="model-file">
            {exam.attachment ? (
              <FilePreview
                url={toFullUrl(exam.attachment)}
                filename={exam.attachment || ''}
                filePath={exam.attachment}
              />
            ) : (
              <div>No model file attached.</div>
            )}
          </div>
          {!isExpired && role === 'student' && (
            <>
              <DashedDivider />
              <div>
                <h2>Submission</h2>
              </div>
              <SubmitWork />
            </>
          )}
          {/* 
          {role === 'student' && classId && courseId && (
            <div className="mt-16">
              <div className="mt-8">
                <Link
                  to={`/education/student/classes/${classId}/courses/${courseId}/exams/${resourceId}/submit`}
                  className={`btn btn-primary ${isExpired ? 'disabled' : ''}`}
                  aria-disabled={isExpired}
                  onClick={(e) => {
                    if (isExpired) {
                      e.preventDefault();
                      push({ title: 'Closed', body: 'Submissions are closed for this exam.' });
                    }
                  }}
                >
                  Go to Submit Page
                </Link>
              </div>
              {isExpired && <small className="text-error">Submissions are closed for this exam.</small>}
            </div>
          )} */}
          {role === 'teacher' && (
            <div className="meta-small mt-12">
              <small>
                Created: {fmtDate(exam.createdAt)} • Updated: {fmtDate(exam.updatedAt)}
              </small>
            </div>
          )}
        </div>
      </Card>
    </Section>
  );
}
