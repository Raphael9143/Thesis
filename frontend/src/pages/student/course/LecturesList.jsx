import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../../components/ui/Section';
import Card from '../../../components/ui/Card';
import userAPI from '../../../../services/userAPI';
import '../../../assets/styles/ui.css';
import '../../../assets/styles/pages/ClassDetail.css';
import useTitle from '../../../hooks/useTitle';
import DateGroupBar from '../../../components/ui/DateGroupBar';

export default function StudentLecturesList() {
  const { id, courseId: routeCourseId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseIdState, setCourseIdState] = useState(routeCourseId || null);

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
        const lectRes = await userAPI.getLecturesByCourse(courseId);
        if (!mounted) return;
        if (lectRes?.success && Array.isArray(lectRes.data)) {
          const published = lectRes.data.filter((l) => l.status === 'published');
          setLectures(published);
        } else {
          setLectures([]);
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

  useTitle(`Lectures - ${classInfo?.name || (routeCourseId ? 'Course' : '')}`);

  const formatKey = (d) => {
    if (!d) return 'unknown';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return 'unknown';
    return dt.toISOString().slice(0, 10); // YYYY-MM-DD
  };

  const formatLabel = (d) => {
    if (!d) return 'Unknown';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return 'Unknown';
    return dt.toLocaleDateString();
  };

  const groups = useMemo(() => {
    const map = new Map();
    (lectures || []).forEach((l) => {
      const key = formatKey(l.created_at || l.created || l.createdAt || Date.now());
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(l);
    });
    return Array.from(map.entries())
      .map(([key, items]) => ({
        key,
        label: formatLabel(items[0].created_at || items[0].created || items[0].createdAt),
        items,
      }))
      .sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [lectures]);

  const [collapsed, setCollapsed] = useState(new Set());
  const toggleGroup = (key) => {
    setCollapsed((prev) => {
      const np = new Set(prev);
      if (np.has(key)) np.delete(key);
      else np.add(key);
      return np;
    });
  };

  return (
    <Section>
      <Card>
        <div className="class-detail__panel">
          {loading && <div>Loading contents...</div>}
          {error && <div className="text-error">{error}</div>}
          {!loading && !error && lectures.length === 0 && <div>No lectures.</div>}
          {!loading && !error && lectures.length > 0 && (
            <div>
              {groups.map((g) => (
                <div key={g.key}>
                  <DateGroupBar
                    dateLabel={g.label}
                    count={g.items.length}
                    collapsed={collapsed.has(g.key)}
                    onToggle={() => toggleGroup(g.key)}
                  />
                  <ul className="class-detail__list" style={{ display: collapsed.has(g.key) ? 'none' : 'flex' }}>
                    {g.items.map((l) => (
                      <li
                        key={l.id}
                        className="class-detail__list-item"
                        onClick={() => {
                          navigate(`/education/student/classes/${id}/courses/${courseIdState}/lectures/${l.id}`);
                        }}
                      >
                        <div className="class-detail__item-title">{l.title}</div>
                      </li>
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
