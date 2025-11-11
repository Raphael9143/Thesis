import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../../components/ui/Section';
import Card from '../../../components/ui/Card';
import userAPI from '../../../../services/userAPI';
import '../../../assets/styles/ui.css';
import '../../../assets/styles/pages/ClassDetail.css';
import useTitle from '../../../hooks/useTitle';

function isExpired(assignment) {
  const due = assignment?.courses?.[0]?.assignment_course?.due_date;
  if (!due) return false;
  return Date.now() > new Date(due).getTime();
}

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
        const courseId = routeCourseId || (cls?.success && cls.data && (cls.data.course_id || cls.data.courseId)) || id;
        setCourseIdState(courseId);
        const assignRes = await userAPI.getAssignmentsByCourse(courseId);
        if (!mounted) return;
        if (assignRes?.success && Array.isArray(assignRes.data)) {
          const published = assignRes.data.filter((a) => a.status === 'published');
          setAssignments(published);
          try {
            const results = await Promise.all(
              published.map(async (a) => {
                const aid = a.assignment_id || a.id;
                try {
                  const r = await userAPI.getAssignmentRemainingAttempts(aid);
                  return { id: aid, rem: r?.success ? r.data?.remaining_attempts : undefined };
                } catch {
                  return { id: aid, rem: undefined };
                }
              })
            );
            if (!mounted) return;
            const map = {};
            results.forEach((it) => {
              if (it && typeof it.rem !== 'undefined') map[it.id] = it.rem;
            });
            setAttemptsMap(map);
          } catch {
            // ignore
          }
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

  useTitle(`Assignments - ${classInfo?.name || (routeCourseId ? 'Course' : '')}`);

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
              {assignments.map((a) => {
                const disabled = isExpired(a);
                const idv = a.assignment_id || a.id;
                return (
                  <li
                    key={idv}
                    className={`class-detail__list-item${disabled ? ' disabled' : ''}`}
                    onClick={() => {
                      if (disabled) return;
                      navigate(`/education/student/classes/${id}/courses/${courseIdState}/assignments/${idv}`);
                    }}
                  >
                    {typeof attemptsMap[idv] !== 'undefined' && (
                      <span className="attempts-badge" title="Attempts left">
                        {attemptsMap[idv]}
                      </span>
                    )}
                    <div className="class-detail__item-title">{a.title}</div>
                    <small>
                      {a.courses?.[0]?.assignment_course?.due_date
                        ? `Due: ${new Date(a.courses[0].assignment_course.due_date).toLocaleString()}`
                        : ''}
                      {disabled ? ' (Expired)' : ''}
                    </small>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>
    </Section>
  );
}
