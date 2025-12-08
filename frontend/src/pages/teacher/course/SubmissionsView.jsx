import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Section from '../../../components/ui/Section';
import Card from '../../../components/ui/Card';
import userAPI from '../../../../services/userAPI';
import '../../../assets/styles/ui.css';
import '../../../assets/styles/pages/Submissions.css';
import { useNotifications } from '../../../contexts/NotificationContext';
import useTitle from '../../../hooks/useTitle';
import GradeSubmissionModal from '../../../components/teacher/GradeSubmissionModal';
import toFullUrl from '../../../utils/FullURLFile';
import Modal from '../../../components/ui/Modal';
import FilePreview from '../../../components/ui/FilePreview';

export default function SubmissionsView() {
  const params = useParams();
  const assignmentId = params.assignmentId;
  const examId = params.examId;
  const kind = assignmentId ? 'assignment' : examId ? 'exam' : null;
  const id = assignmentId || examId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [selectedForGrade, setSelectedForGrade] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewFilename, setPreviewFilename] = useState(null);
  const [previewFilePath, setPreviewFilePath] = useState(null);

  const { push } = useNotifications();

  useTitle('Submissions');

  useEffect(() => {
    if (!kind || !id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        let res;
        if (kind === 'assignment') res = await userAPI.getSubmissionsByAssignmentId(id);
        else res = await userAPI.getSubmissionsByExamId(id);
        if (!mounted) return;
        if (res?.success && Array.isArray(res.data)) setSubmissions(res.data);
        else setSubmissions([]);
      } catch (err) {
        if (!mounted) return;
        const msg = err?.response?.data?.message || err.message || 'Failed to load submissions';
        setError(msg);
        try {
          push({ title: 'Error', body: msg });
        } catch (pushErr) {
          console.warn('Notification push error', pushErr);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [kind, id, push]);

  return (
    <Section>
      <Card>
        {loading && <div>Loading submissions...</div>}
        {error && <div className="text-error">{error}</div>}

        {!loading && !error && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4>
                {kind
                  ? kind === 'assignment'
                    ? `Assignment ${id} - submissions`
                    : `Exam ${id} - submissions`
                  : 'No activity selected'}
              </h4>
            </div>

            {!kind && <div>Please select an assignment or exam to view its submissions.</div>}

            {kind && submissions.length === 0 && <div>No submissions yet.</div>}

            {kind && submissions.length > 0 && (
              <table className="table students-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student Code</th>
                    <th>Full name</th>
                    <th>Time</th>
                    <th>Attempt</th>
                    <th>Score</th>
                    <th>Preview</th>
                    <th>Attachment</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s, idx) => (
                    <tr key={`sub-${s.id || idx}`}>
                      <td>{idx + 1}</td>
                      <td>{s.student?.student_code || s.student_id || 'Unknown'}</td>
                      <td>{s.student?.user?.full_name || '-'}</td>
                      <td>
                        {s.submission_time ? new Date(s.submission_time).toLocaleString() : '-'}
                      </td>
                      <td>{s.attempt_number ?? '-'}</td>
                      <td>
                        <a
                          className="score-btn"
                          onClick={() => {
                            setSelectedForGrade(s);
                            setGradeModalOpen(true);
                          }}
                        >
                          {typeof s.score !== 'undefined' && s.score !== null
                            ? String(s.score)
                            : 'Not graded'}
                        </a>
                      </td>
                      <td>
                        {s.attachment ? (
                          <a
                            className="score-btn"
                            onClick={() => {
                              setPreviewUrl(toFullUrl(s.attachment));
                              setPreviewFilename(s.attachment);
                              setPreviewFilePath(s.attachment);
                              setPreviewOpen(true);
                            }}
                          >
                            Preview
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {s.attachment ? (
                          <a
                            className="score-btn"
                            href={toFullUrl(s.attachment)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Download
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <GradeSubmissionModal
              open={gradeModalOpen}
              onClose={() => setGradeModalOpen(false)}
              submission={selectedForGrade}
              onGraded={(updated) => {
                // updated may be the updated submission object; update list
                if (!updated) return;
                setSubmissions((prev) =>
                  prev.map((p) => (p.id === (updated.id || p.id) ? { ...p, ...updated } : p))
                );
              }}
            />
            <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="File preview">
              <FilePreview url={previewUrl} filename={previewFilename} filePath={previewFilePath} />
            </Modal>
            {/* Preview now opens on a dedicated page via /file/preview */}
          </div>
        )}
      </Card>
    </Section>
  );
}
