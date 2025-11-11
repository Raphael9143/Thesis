import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../../components/ui/Section';
import Card from '../../../components/ui/Card';
import userAPI from '../../../../services/userAPI';
import '../../../assets/styles/ui.css';
import '../../../assets/styles/pages/ClassDetail.css';
import useTitle from '../../../hooks/useTitle';

function isExpired(exam) {
  if (!exam?.end_date) return false;
  return Date.now() > new Date(exam.end_date).getTime();
}

export default function StudentExamsList() {
  const { id, courseId: routeCourseId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [exams, setExams] = useState([]);
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
        if (cls?.success && cls.data) {
          setClassInfo(cls.data);
        }
        const courseId = routeCourseId || (cls?.success && cls.data && (cls.data.course_id || cls.data.courseId)) || id;
        setCourseIdState(courseId);
        const examRes = await userAPI.getExamsByCourse(courseId);
        if (!mounted) return;
        if (examRes?.success && Array.isArray(examRes.data)) {
          const published = examRes.data.filter((e) => e.status === 'published');
          console.log('Published exams:', published);
          setExams(published);
          try {
            const results = await Promise.all(
              published.map(async (ex) => {
                const eid = ex.id || ex.exam_id;
                try {
                  const r = await userAPI.getExamRemainingAttempts(eid);
                  return { id: eid, rem: r?.success ? r.data?.remaining_attempts : undefined };
                } catch {
                  return { id: eid, rem: undefined };
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
          setExams([]);
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

  useTitle(`Exams - ${classInfo?.name || (routeCourseId ? 'Course' : '')}`);

  return (
    <Section>
      <Card>
        <div className="class-detail__panel">
          <h4 className="no-margin">Exams</h4>
          {loading && <div>Loading contents...</div>}
          {error && <div className="text-error">{error}</div>}
          {!loading && !error && exams.length === 0 && <div>No exams.</div>}
          {!loading && !error && exams.length > 0 && (
            <ul className="class-detail__list">
              {exams.map((ex) => {
                const disabled = isExpired(ex);
                const idv = ex.id || ex.exam_id;
                return (
                  <li
                    key={idv}
                    className={`class-detail__list-item${disabled ? ' disabled' : ''}`}
                    onClick={() => {
                      if (disabled) return;
                      navigate(`/education/student/classes/${id}/courses/${courseIdState}/exams/${idv}`);
                    }}
                  >
                    {typeof attemptsMap[idv] !== 'undefined' && (
                      <span className="attempts-badge" title="Attempts left">
                        {attemptsMap[idv]}
                      </span>
                    )}
                    <div className="class-detail__item-title">{ex.title}</div>
                    <small>
                      {ex.start_date
                        ? `${new Date(ex.start_date).toLocaleString()} - ${new Date(ex.end_date).toLocaleString()}`
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
