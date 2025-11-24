import React, { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import userAPI from '../../../services/userAPI';
import { useNotifications } from '../../contexts/NotificationContext';

export default function GradeSubmissionModal({ open, onClose, submission, onGraded }) {
  const { push } = useNotifications();
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && submission) {
      setScore(
        typeof submission.score !== 'undefined' && submission.score !== null
          ? String(submission.score)
          : ''
      );
      setFeedback(submission.feedback ?? '');
    }
  }, [open, submission]);

  const handleSubmit = async () => {
    // validate integer 0..10
    const parsed = parseInt(score, 10);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 10) {
      push({ title: 'Validation', body: 'Score must be an integer between 0 and 10.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = { score: parsed, feedback: feedback ?? '' };
      const res = await userAPI.gradeSubmission(
        submission.id || submission.submission_id || submission.submissionId,
        payload
      );
      if (res && res.success) {
        push({ title: 'Success', body: 'Graded successfully.' });
        onGraded?.(res.data ?? { ...submission, score: parsed, feedback });
        onClose?.();
      } else {
        push({ title: 'Error', body: res?.message || 'Failed to grade submission.' });
      }
    } catch (err) {
      push({ title: 'Error', body: err?.response?.data?.message || err.message || 'Server error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Grade submission">
      <div style={{ minWidth: 360 }}>
        <FormField
          label="Score (0-10)"
          name="score"
          type="number"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          inputProps={{ min: 0, max: 10, step: 1 }}
          required
        />

        <FormField
          label="Feedback"
          name="feedback"
          textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Optional feedback"
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="btn btn-signin" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
