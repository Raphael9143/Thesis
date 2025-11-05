import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../../components/ui/Section';
import Card from '../../../components/ui/Card';
import userAPI from '../../../../services/userAPI';
import '../../../assets/styles/ui.css';
import { usePageInfo } from '../../../contexts/PageInfoContext';
import { useNotifications } from '../../../contexts/NotificationContext';

export default function StudentSubmissions() {
  const { id: classId, courseId, studentId } = useParams();
  const [kind, setKind] = useState('assignments'); // 'assignments' or 'exams'
  const [items, setItems] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setTitle } = usePageInfo();
  const { push } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    try { setTitle('Student submissions'); } catch (_) {}
  }, [setTitle]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Backend returns combined list with `kind` field (assignment or exam)
        const params = { course: courseId };
        const res = await userAPI.getStudentAssignments(studentId, params);
        if (!mounted) return;
        if (res?.success && Array.isArray(res.data)) {
          const all = res.data;
          const a = all.filter((it) => (it.kind || 'assignment') === 'assignment');
          const e = all.filter((it) => (it.kind || '') === 'exam');
          setAssignments(a);
          setExams(e);
          setItems(kind === 'assignments' ? a : e);
        } else {
          setAssignments([]);
          setExams([]);
          setItems([]);
        }
      } catch (err) {
        if (!mounted) return;
        const msg = err?.response?.data?.message || err.message || 'Failed to load submissions';
        setError(msg);
        try { push({ title: 'Error', body: msg }); } catch (_) {}
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [courseId, studentId]);

  // update items when kind changes
  useEffect(() => {
    setItems(kind === 'assignments' ? assignments : exams);
  }, [kind, assignments, exams]);

  return (
    <Section title="Submissions">
      <Card>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className={`btn ${kind === 'assignments' ? 'btn-primary' : 'btn-signin'}`} onClick={() => setKind('assignments')}>Assignments</button>
          <button className={`btn ${kind === 'exams' ? 'btn-primary' : 'btn-signin'}`} onClick={() => setKind('exams')}>Exams</button>
        </div>

        {loading && <div>Loading {kind}...</div>}
        {error && <div className="text-error">{error}</div>}

        {!loading && !error && items.length === 0 && (
          <div>No {kind} found for this student in this course.</div>
        )}

        {!loading && !error && items.length > 0 && (
          <table className="table students-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Due</th>
                <th>Submissions</th>
                <th>Graded</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={`${it.kind}-${it.id}-${idx}`}>
                  <td style={{ width: 48 }}>{idx + 1}</td>
                  <td>{it.title}</td>
                  <td>{it.due_date ? new Date(it.due_date).toLocaleString() : '-'}</td>
                  <td>{typeof it.submissions_count !== 'undefined' ? `${it.submissions_count}/${it.attempt_limit}` : '-'}</td>
                  <td>{it.graded ? <span className="tag tag-success">Graded</span> : <span className="tag">Not graded</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </Section>
  );
}
