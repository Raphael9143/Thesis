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
          setExams(published);
          // attempts fetched via hook below
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

  const examIds = useMemo(() => (exams || []).map((e) => e.exam_id || e.id).filter(Boolean), [exams]);
  const { attemptsMap: hookAttemptsMap } = useAttemptMap('exam', examIds, {
    enabled: examIds.length > 0,
  });

  // Latest scores for exams
  const { infoMap } = useLatestScoreMap('exam', examIds, {
    enabled: examIds.length > 0,
  });

  useEffect(() => {
    setAttemptsMap(hookAttemptsMap || {});
  }, [hookAttemptsMap]);

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
                    <div className="class-detail__item-title">{ex.title}</div>
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
