import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../../components/ui/Section';
import Card from '../../../components/ui/Card';
import userAPI from '../../../../services/userAPI';
import '../../../assets/styles/ui.css';
import '../../../assets/styles/pages/ClassDetail.css';
import useAttemptMap from '../../../hooks/useAttemptMap';
import DateGroupBar from '../../../components/ui/DateGroupBar';
import useTitle from '../../../hooks/useTitle';
import useLatestScoreMap from '../../../hooks/useLatestScoreMap';
import useDueDateStatus from '../../../hooks/useDueDateStatus';

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
        const courseId =
          routeCourseId ||
          (cls?.success && cls.data && (cls.data.course_id || cls.data.courseId)) ||
          id;
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

  const examIds = useMemo(
    () => (exams || []).map((e) => e.exam_id || e.id).filter(Boolean),
    [exams]
  );
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

  const formatKey = (d) => {
    if (!d) return 'unknown';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return 'unknown';
    return dt.toISOString().slice(0, 10);
  };

  const formatLabel = (d) => {
    if (!d) return 'Unknown';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return 'Unknown';
    return dt.toLocaleDateString();
  };

  const groups = useMemo(() => {
    const map = new Map();
    (exams || []).forEach((e) => {
      const key = formatKey(e.start_date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    });
    return Array.from(map.entries())
      .map(([key, items]) => ({
        key,
        label: formatLabel(items[0].start_date),
        items,
      }))
      .sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [exams]);

  const [collapsed, setCollapsed] = useState(new Set());
  const toggleGroup = (key) => {
    setCollapsed((prev) => {
      const np = new Set(prev);
      if (np.has(key)) np.delete(key);
      else np.add(key);
      return np;
    });
  };

  const ExamListItem = ({ ex }) => {
    const idv = ex.id || ex.exam_id;
    const dueField = ex.end_date || null;
    const { daysLeft, className } = useDueDateStatus(dueField);
    return (
      <li
        key={idv}
        className={`class-detail__list-item`}
        onClick={() => {
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
        <small className={`due-date ${className}`}>
          {daysLeft !== null ? ` ${daysLeft}d left.` : ''}
        </small>
      </li>
    );
  };

  return (
    <Section>
      <Card>
        <div className="class-detail__panel">
          {loading && <div>Loading contents...</div>}
          {error && <div className="text-error">{error}</div>}
          {!loading && !error && exams.length === 0 && <div>No exams.</div>}
          {!loading && !error && exams.length > 0 && (
            <div>
              {groups.map((g) => (
                <div key={g.key}>
                  <DateGroupBar
                    dateLabel={g.label}
                    count={g.items.length}
                    collapsed={collapsed.has(g.key)}
                    onToggle={() => toggleGroup(g.key)}
                  />
                  <ul
                    className="class-detail__list"
                    style={{ display: collapsed.has(g.key) ? 'none' : 'flex' }}
                  >
                    {g.items.map((ex) => (
                      <ExamListItem key={ex.id || ex.exam_id} ex={ex} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </Section>
  );
}
