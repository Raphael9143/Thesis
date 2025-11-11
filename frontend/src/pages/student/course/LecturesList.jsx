import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../../components/ui/Section';
import Card from '../../../components/ui/Card';
import userAPI from '../../../../services/userAPI';
import '../../../assets/styles/ui.css';
import '../../../assets/styles/pages/ClassDetail.css';
import useTitle from '../../../hooks/useTitle';

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

  return (
    <Section>
      <Card>
        <div className="class-detail__panel">
          <h4 className="no-margin">Lectures</h4>
          {loading && <div>Loading contents...</div>}
          {error && <div className="text-error">{error}</div>}
          {!loading && !error && lectures.length === 0 && <div>No lectures.</div>}
          {!loading && !error && lectures.length > 0 && (
            <ul className="class-detail__list">
              {lectures.map((l) => (
                <li
                  key={l.id}
                  className="class-detail__list-item"
                  onClick={() => navigate(`/education/student/classes/${id}/courses/${courseIdState}/lectures/${l.id}`)}
                >
                  <div className="class-detail__item-title">{l.title}</div>
                  <small>{l.publish_date ? new Date(l.publish_date).toLocaleString() : ''}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </Section>
  );
}
