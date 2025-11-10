import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../../components/ui/Section';
import Card from '../../../components/ui/Card';
import userAPI from '../../../../services/userAPI';
import '../../../assets/styles/ui.css';
import '../../../assets/styles/pages/Submissions.css';
import useTitle from '../../../hooks/useTitle';

export default function Submissions() {
  const params = useParams();
  const { id: classId, courseId } = params;
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [tab, setTab] = useState('assignments');
  const [visibleActivities, setVisibleActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useTitle('Submissions');

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
        setExams(exRes?.success && Array.isArray(exRes.data) ? exRes.data : []);
        setAssignments(asRes?.success && Array.isArray(asRes.data) ? asRes.data : []);
      } catch (err) {
        if (!mounted) return;
        const msg = err?.response?.data?.message || err.message || 'Failed to load activities';
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [courseId]);

  useEffect(() => {
    setVisibleActivities([]);
    let mounted = true;
    const timer = setTimeout(() => {
      if (!mounted) return;
      setVisibleActivities(tab === 'assignments' ? assignments : exams);
    }, 80);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [tab, assignments, exams]);

  const handleActivityClick = (a) => {
    const kind = tab === 'assignments' ? 'assignment' : 'exam';
    // navigate to dedicated submissions route for this activity
    if (kind === 'assignment') {
      navigate(`/education/teacher/classes/${classId}/courses/${courseId}/submissions/assignment/${a.id}`);
    } else {
      navigate(`/education/teacher/classes/${classId}/courses/${courseId}/submissions/exam/${a.id}`);
    }
  };

  return (
    <Section>
      <Card>
        {loading && <div>Loading activities...</div>}
        {error && <div className="text-error">{error}</div>}

        {!loading && !error && (
          <div>
            <div className="submissions-tabs">
              <button
                className={`btn tab-button ${tab === 'assignments' ? 'btn-primary' : 'btn-signin'}`}
                onClick={() => {
                  setVisibleActivities([]);
                  setTab('assignments');
                }}
              >{`Assignments`}</button>
              <button
                className={`btn tab-button ${tab === 'exams' ? 'btn-primary' : 'btn-signin'}`}
                onClick={() => {
                  setVisibleActivities([]);
                  setTab('exams');
                }}
              >{`Exams`}</button>
            </div>

            <div className="activity-list">
              {visibleActivities.map((a) => {
                const kind = tab === 'assignments' ? 'assignment' : 'exam';
                return (
                  <div
                    key={`card-${kind}-${a.id}`}
                    className="activity-card"
                    onClick={() => handleActivityClick(a)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="activity-card-inner">
                      <div>
                        <div className="activity-title">{a.title}</div>
                        <div className="activity-meta">{a.end_date ? new Date(a.end_date).toLocaleString() : '-'}</div>
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
