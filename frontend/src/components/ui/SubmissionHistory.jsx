import React from 'react';
import toFullUrl from '../../utils/FullURLFile';
import useSubmissionHistory from '../../hooks/useSubmissionHistory';
import Modal from './Modal';
import FilePreview from './FilePreview';
import '../../assets/styles/components/ui/SubmissionHistory.css';

/**
 * SubmissionHistory
 * Reusable history table for assignment/exam submissions for current student.
 * Props:
 * - type: 'assignment' | 'exam'
 * - id: string | number (resource id)
 */
export default function SubmissionHistory({ type, id }) {
  const role = (typeof window !== 'undefined' && sessionStorage.getItem('role')) || null;
  const { history, loading, error, refetch } = useSubmissionHistory(type, id, {
    enabled: role === 'student',
  });

  React.useEffect(() => {
    // initial fetch already in hook; refetch if id changes
    refetch();
  }, [id, refetch]);

  if (role !== 'student') return null;

  return (
    <div className="history-pane">
      {loading && <div>Loading history...</div>}
      {error && <div className="text-error">{error}</div>}
      {!loading &&
        !error &&
        (history && history.length > 0 ? (
          <HistoryTable history={history} />
        ) : (
          <div>No submissions yet.</div>
        ))}
    </div>
  );
}

function HistoryTable({ history }) {
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);
  const [feedbackText, setFeedbackText] = React.useState('');

  return (
    <div className="submission-history">
      <table className="table submission-history-table">
        <thead>
          <tr>
            <th>Attempt</th>
            <th>Submitted At</th>
            <th>Score</th>
            <th>Auto Score</th>
            <th>Preview</th>
            <th>Attachment</th>
            <th>Feedback</th>
          </tr>
        </thead>
        <tbody>
          {history.map((s) => {
            const ts = new Date(
              s.submission_time || s.created_at || s.updated_at || Date.now()
            ).toLocaleString();
            return (
              <tr key={s.id}>
                <td>{s.attempt_number != null ? s.attempt_number : '-'}</td>
                <td>{ts}</td>
                <td>{s.score != null ? s.score : 'Not Graded'}</td>
                <td>{s.auto_grader_score != null ? s.auto_grader_score : '-'}</td>
                <td>
                  {s.attachment ? (
                    <a
                      onClick={() => {
                        const fp = encodeURIComponent(s.attachment);
                        window.open(`/file/preview?file=${fp}`, '_blank');
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
                    <a href={toFullUrl(s.attachment)} target="_blank" rel="noreferrer">
                      Download
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  {s.feedback ? (
                    <a
                      onClick={() => {
                        setFeedbackText(String(s.feedback || ''));
                        setFeedbackOpen(true);
                      }}
                    >
                      View
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Modal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} title="Feedback">
        <pre className="submission-history-feedback">{feedbackText}</pre>
      </Modal>
      {/* File preview now opens on /file/preview */}
    </div>
  );
}
