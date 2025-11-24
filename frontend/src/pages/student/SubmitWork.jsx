import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import CodeEditor from '../../components/ui/CodeEditor';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/ui.css';
import '../../assets/styles/pages/Submit.css';
import { useNotifications } from '../../contexts/NotificationContext';
import useAttempt from '../../hooks/useAttempt';

export default function SubmitWork() {
  const params = useParams();
  const navigate = useNavigate();
  const { push } = useNotifications();
  const role = (typeof window !== 'undefined' && sessionStorage.getItem('role')) || null;

  const { classId, courseId, assignmentId, examId } = params;
  const isAssignment = Boolean(assignmentId);
  const isExam = Boolean(examId);

  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // attempts via hook

  const [mode, setMode] = useState('editor'); // 'editor' | 'file'
  const [code, setCode] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (role !== 'student') return; // only students
      setLoading(true);
      try {
        if (isAssignment) {
          const res = await userAPI.getAssignmentById(assignmentId);
          if (!mounted) return;
          if (res?.success && res.data) setMeta(res.data);
        } else if (isExam) {
          const res = await userAPI.getExamById(examId);
          if (!mounted) return;
          if (res?.success && res.data) setMeta(res.data);
        } else {
          setError('Missing assignment or exam id');
        }
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || err.message || 'Server error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [assignmentId, examId, isAssignment, isExam, role]);

  const resolvedType = isAssignment ? 'assignment' : isExam ? 'exam' : null;
  const resolvedId = isAssignment ? assignmentId : isExam ? examId : null;
  const { attempts, refetch: refetchAttempts } = useAttempt(resolvedType, resolvedId, {
    enabled: role === 'student',
  });

  const endAt = useMemo(() => {
    if (!meta) return null;
    if (isAssignment)
      return (
        meta.end_date || meta?.courses?.[0]?.assignment_course?.due_date || meta.due_date || null
      );
    if (isExam) return meta.end_date || null;
    return null;
  }, [meta, isAssignment, isExam]);

  const isExpired = useMemo(() => {
    if (!endAt) return false;
    const t = new Date(endAt).getTime();
    return Number.isFinite(t) && Date.now() > t;
  }, [endAt]);

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    if (role !== 'student') return;
    if (isExpired) {
      push({ title: 'Closed', body: 'Submissions are closed.' });
      return;
    }
    if (attempts && attempts.remaining_attempts <= 0) {
      push({ title: 'Limit reached', body: 'Bạn đã hết lượt nộp (submission attempts).' });
      return;
    }
    const fd = new FormData();
    if (isAssignment) fd.append('assignment_id', String(assignmentId));
    if (isExam) fd.append('exam_id', String(examId));

    if (mode === 'editor') {
      const trimmed = (code || '').trim();
      if (!trimmed) {
        push({
          title: 'Missing code',
          body: 'Please type your .use code or switch to file upload.',
        });
        return;
      }
      const blob = new Blob([trimmed], { type: 'text/plain' });
      const f = new File([blob], 'submission.use', { type: 'text/plain' });
      fd.append('attachment', f);
    } else {
      if (!file) {
        push({ title: 'Missing file', body: 'Please choose a .use file or switch to editor.' });
        return;
      }
      if (!file.name.toLowerCase().endsWith('.use')) {
        push({ title: 'Invalid file', body: 'Only .use files are accepted.' });
        return;
      }
      fd.append('attachment', file);
    }

    setSubmitting(true);
    try {
      const res = await userAPI.submitSubmission(fd);
      if (res?.success) {
        push({ title: 'Submitted', body: 'Your submission was uploaded successfully.' });
        setCode('');
        setFile(null);
        try {
          await refetchAttempts();
        } catch {
          // ignore
        }
        // Navigate back to preview
        if (isAssignment) {
          navigate(
            `/education/student/classes/${classId}/courses/${courseId}/assignments/${assignmentId}`
          );
        } else if (isExam) {
          navigate(`/education/student/classes/${classId}/courses/${courseId}/exams/${examId}`);
        }
      } else {
        push({ title: 'Error', body: res?.message || 'Failed to submit.' });
      }
    } catch (err) {
      push({ title: 'Error', body: err?.response?.data?.message || err.message || 'Server error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-error">{error}</div>}
      {!loading && !error && (
        <div className="submit-container">
          <div className="submit-toggle">
            <label className={`btn btn-outline btn-sm ${mode === 'file' ? 'btn-primary' : ''}`}>
              <i className="fa-solid fa-upload"></i>
              <span>Upload File</span>
              <input
                type="file"
                accept=".use,.txt"
                style={{ display: 'none' }}
                disabled={submitting || isExpired}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const text = await f.text();
                    setCode(text || '');
                    setMode('editor');
                    setFile(f);
                  } catch {
                    push({ title: 'Error', body: 'Failed to read file content.' });
                  } finally {
                    // reset input value so selecting the same file again will trigger onChange
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </div>

          {mode === 'editor' ? (
            <div className="editor-pane">
              <CodeEditor
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Enter .use code here\n"
                rows={12}
                disabled={submitting || isExpired}
                className="limited-height"
              />
            </div>
          ) : (
            <div className="file-pane">
              <p>
                Select a file using the &quot;Upload File&quot; button above to load its content
                into the editor.
              </p>
            </div>
          )}

          {isExpired && <small className="text-error">Submissions are closed.</small>}
          {attempts && attempts.remaining_attempts <= 0 && (
            <small className="text-error">You ran out of submissions!</small>
          )}
          {attempts && attempts.remaining_attempts > 0 && (
            <div className="submit-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={onSubmit}
                disabled={submitting || isExpired || (attempts && attempts.remaining_attempts <= 0)}
              >
                <i className="fa-solid fa-paper-plane"></i>
                <span>{submitting ? 'Submitting...' : 'Submit'}</span>
              </button>

              <span style={{ marginLeft: 8 }}>
                Attempts left: {attempts.remaining_attempts}/{attempts.submission_limit}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
