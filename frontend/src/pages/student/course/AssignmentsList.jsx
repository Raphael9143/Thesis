import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../../components/ui/Section';
import Card from '../../../components/ui/Card';
import userAPI from '../../../../services/userAPI';
import '../../../assets/styles/ui.css';
import '../../../assets/styles/pages/ClassDetail.css';
import useAttemptMap from '../../../hooks/useAttemptMap';
import useTitle from '../../../hooks/useTitle';
import useLatestScoreMap from '../../../hooks/useLatestScoreMap';
import useDueDateStatus from '../../../hooks/useDueDateStatus';

// Clean implementation without duplication
export default function StudentAssignmentsList() {
  const { id, courseId: routeCourseId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseIdState, setCourseIdState] = useState(routeCourseId || null);
  const [attemptsMap, setAttemptsMap] = useState({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const cls = await userAPI.getClassById(id);
        if (!mounted) return;
        if (cls?.success && cls.data) setClassInfo(cls.data);
        const courseId = routeCourseId || (cls?.success && cls.data && cls.data.course_id) || id;
        setCourseIdState(courseId);
        const assignRes = await userAPI.getAssignmentsByCourse(courseId);
        if (!mounted) return;
        if (assignRes?.success && Array.isArray(assignRes.data)) {
          const published = assignRes.data.filter((a) => a.status === 'published');
          setAssignments(published);
          // attempts are now fetched via useAttemptMap below
        } else {
          setAssignments([]);
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
  }, [id, routeCourseId]);

  // Use hook to populate attempts for current published assignments
  const assignmentIds = useMemo(
    () => (assignments || []).map((a) => a.assignment_id || a.id).filter(Boolean),
    [assignments]
  );
  const { attemptsMap: hookAttemptsMap } = useAttemptMap('assignment', assignmentIds, {
    enabled: assignmentIds.length > 0,
  });

  // Latest scores for assignments
  const { infoMap } = useLatestScoreMap('assignment', assignmentIds, {
    enabled: assignmentIds.length > 0,
  });

  useEffect(() => {
    setAttemptsMap(hookAttemptsMap || {});
  }, [hookAttemptsMap]);

  useTitle(`Assignments - ${classInfo?.name || (routeCourseId ? 'Course' : '')}`);
  const AssignmentListItem = ({ a }) => {
    const idv = a.assignment_id || a.id;
    const dueField = a.end_date || null;
    const { formatted, daysLeft, className } = useDueDateStatus(dueField);
    return (
      <li
        key={idv}
        className={`class-detail__list-item`}
        onClick={() => {
          navigate(`/education/student/classes/${id}/courses/${courseIdState}/assignments/${idv}`);
        }}
      >
        {(typeof attemptsMap[idv] !== 'undefined' || infoMap[idv]) && (
          <div className="badges">
            {typeof attemptsMap[idv] !== 'undefined' && (
              <span className="attempts-badge" title="Attempts left">
                {attemptsMap[idv]}
              </span>
            )}
            {infoMap[idv]?.hasSubmission && (
              <span className="score-chip" title="Latest score">
                {typeof infoMap[idv].score === 'number' ? infoMap[idv].score : 'Not graded yet'}
              </span>
            )}
          </div>
        )}
        <div className="class-detail__item-title">{a.title}</div>
        <small className={`due-date ${className}`}>
          {formatted}
          {daysLeft !== null ? ` (${daysLeft}d)` : ''}
        </small>
      </li>
    );
  };

  return (
    <Section>
      <Card>
        <div className="class-detail__panel">
          <h4 className="no-margin">Assignments</h4>
          {loading && <div>Loading contents...</div>}
          {error && <div className="text-error">{error}</div>}
          {!loading && !error && assignments.length === 0 && <div>No assignments.</div>}
          {!loading && !error && assignments.length > 0 && (
            <ul className="class-detail__list">
              {assignments.map((a) => (
                <AssignmentListItem key={a.assignment_id || a.id} a={a} />
              ))}
            </ul>
          )}
        </div>
      </Card>
    </Section>
  );
}
