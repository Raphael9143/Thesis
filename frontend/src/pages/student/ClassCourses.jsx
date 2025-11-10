import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import ClassCard from '../../components/ui/ClassCard';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/ui.css';
import useTitle from '../../hooks/useTitle';

export default function StudentClassCoursesPage() {
  const { id } = useParams(); // class id
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // title handled by useTitle below

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const clsRes = await userAPI.getClassById(id);
        if (!mounted) return;
        if (clsRes?.success && clsRes.data) {
          // page title will be handled by hook
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

    return () => {
      mounted = false;
    };
  }, [id]);

  useTitle('Courses');

  return (
    <Section>
      <Card>
        <div className="mt-12">
          {loading && <div>Loading courses...</div>}
          {error && <div className="text-error">{error}</div>}

          {!loading && !error && courses.length === 0 && <div>No courses found for this class.</div>}

          {!loading && !error && courses.length > 0 && (
            <div className="grid-cards">
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
