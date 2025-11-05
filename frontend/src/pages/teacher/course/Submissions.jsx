import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Section from '../../../components/ui/Section';
import Card from '../../../components/ui/Card';
import userAPI from '../../../../services/userAPI';
import '../../../assets/styles/ui.css';
import '../../../assets/styles/pages/Submissions.css';
import { usePageInfo } from '../../../contexts/PageInfoContext';

export default function Submissions() {
  const { id: classId, courseId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  // default to assignments tab for the simple list view
  const [tab, setTab] = useState('assignments');
  // activities currently visible on the page. We clear this when switching tabs
  // then populate after a short delay to avoid React reusing DOM nodes and
  // causing visual stacking of cards.
  const [visibleActivities, setVisibleActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { setTitle } = usePageInfo();

  useEffect(() => {
    try { setTitle('Submissions'); } catch (_) {}
  }, [setTitle]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [exRes, asRes] = await Promise.all([
          userAPI.getExamsByCourse(courseId),
          userAPI.getAssignmentsByCourse(courseId),
        ]);
        if (!mounted) return;
        setExams((exRes?.success && Array.isArray(exRes.data)) ? exRes.data : []);
        setAssignments((asRes?.success && Array.isArray(asRes.data)) ? asRes.data : []);
      } catch (err) {
        if (!mounted) return;
        const msg = err?.response?.data?.message || err.message || 'Failed to load activities';
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [courseId]);

  useEffect(() => {
    // clear first
    setVisibleActivities([]);
    let mounted = true;
    const timer = setTimeout(() => {
      if (!mounted) return;
      setVisibleActivities(tab === 'assignments' ? assignments : exams);
    }, 80);
    return () => { mounted = false; clearTimeout(timer); };
  }, [tab, assignments, exams]);

  console.log(assignments, exams);

  return (
    <Section title="Submissions">
      <Card>
        {loading && <div>Loading activities...</div>}
        {error && <div className="text-error">{error}</div>}

        {!loading && !error && (
          <div>
            <div className="submissions-tabs">
              <button className={`btn tab-button ${tab === 'assignments' ? 'btn-primary' : 'btn-signin'}`} onClick={() => { setVisibleActivities([]); setTab('assignments'); }}>{`Assignments (${assignments.length})`}</button>
              <button className={`btn tab-button ${tab === 'exams' ? 'btn-primary' : 'btn-signin'}`} onClick={() => { setVisibleActivities([]); setTab('exams'); }}>{`Exams (${exams.length})`}</button>
            </div>

            <div className="activity-list">
              {visibleActivities.map((a) => {
                const kind = tab === 'assignments' ? 'assignment' : 'exam';
                return (
                  <div key={`card-${kind}-${a.id}`} className="activity-card">
                    <div className="activity-card-inner">
                      <div>
                        <div className="activity-title">{a.title}</div>
                        <div className="activity-meta">{a.due_date ? new Date(a.due_date).toLocaleString() : '-'}</div>
                      </div>
                      <div className="activity-right">
                        <div className="activity-submissions">Submissions: {a.submissions_count ?? '-'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </Section>
  );
}
