import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import ClassCard from '../../components/ui/ClassCard';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/ui.css';
import { usePageInfo } from '../../contexts/PageInfoContext';

export default function StudentClassCoursesPage() {
  const { id } = useParams(); // class id
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setTitle: setPageTitle } = usePageInfo();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const clsRes = await userAPI.getClassById(id);
        if (!mounted) return;
        if (clsRes?.success && clsRes.data) {
          setClassInfo(clsRes.data);
          try { 
            setPageTitle(clsRes.data.name); 
          } catch (_) { }
          const maybeCourses = clsRes.data.courses || clsRes.data.course_list || clsRes.data.courses_taught;
          if (Array.isArray(maybeCourses) && maybeCourses.length > 0) {
            setCourses(maybeCourses);
            setLoading(false);
            return;
          }
        }

        const coursesRes = await userAPI.getCoursesByClass(id);
        if (!mounted) return;
        if (coursesRes?.success && Array.isArray(coursesRes.data)) {
          setCourses(coursesRes.data);
        } else {
          setError(coursesRes?.message || 'No courses found for this class');
        }
      } catch (err) {
        console.error('Failed to load courses for class', err);
        if (!mounted) return;
        setError(err?.response?.data?.message || err.message || 'Server error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [id]);

  return (
    <Section>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Subjects / Courses</h3>
        </div>

        <div style={{ marginTop: 12 }}>
          {loading && <div>Loading courses...</div>}
          {error && <div className="text-error">{error}</div>}

          {!loading && !error && courses.length === 0 && (
            <div>No courses found for this class.</div>
          )}

          {!loading && !error && courses.length > 0 && (
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {courses.map((course) => (
                <ClassCard
                  key={course.id || course.course_id}
                  title={course.name || course.title || course.course_name}
                  subtitle={course.code || course.course_code || ''}
                  image={course.image || course.thumbnail}
                  description={course.description || ''}
                  onClick={() => navigate(`/education/student/classes/${id}/courses/${course.id || course.course_id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </Section>
  );
}
