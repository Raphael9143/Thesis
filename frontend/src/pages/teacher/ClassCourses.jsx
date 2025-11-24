import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import ClassCard from '../../components/ui/ClassCard';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/ui.css';
import '../../assets/styles/pages/ClassCourses.css';
import CreateCourseModal from '../../components/teacher/CreateCourseModal';
import useTitle from '../../hooks/useTitle';

export default function ClassCoursesPage() {
  const { id } = useParams(); // class id
  const navigate = useNavigate();
  const [_classInfo, setClassInfo] = useState(null);
  const [courses, setCourses] = useState([]);
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useTitle('Courses');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // Try to get class details first (may include courses)
        const clsRes = await userAPI.getClassById(id);
        if (!mounted) return;
        if (clsRes?.success && clsRes.data) {
          setClassInfo(clsRes.data);
          const maybeCourses =
            clsRes.data.courses || clsRes.data.course_list || clsRes.data.courses_taught;
          if (Array.isArray(maybeCourses) && maybeCourses.length > 0) {
            setCourses(maybeCourses);
            setLoading(false);
            return;
          }
        }

        // Fallback: call endpoint to get courses for the class
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

  return (
    <Section>
      <Card>
        <div className="create-course-header">
          <button className="btn btn-primary btn-sm" onClick={() => setCreateCourseOpen(true)}>
            <i className="fa-solid fa-layer-group"></i>
            <span>New Course</span>
          </button>
        </div>

        <div className="mt-12">
          {loading && <div>Loading courses...</div>}
          {error && <div className="text-error">{error}</div>}

          {!loading && !error && courses.length === 0 && (
            <div>No courses found for this class.</div>
          )}

          {!loading && !error && courses.length > 0 && (
            <div className="grid-cards">
              {courses.map((course) => (
                <ClassCard
                  key={course.id || course.course_id}
                  title={course.name || course.title || course.course_name}
                  code={course.code || course.course_code}
                  id={course.id || course.course_id}
                  resourceType="course"
                  subtitle={course.semester || ''}
                  image={course.image || course.thumbnail}
                  description={course.description || ''}
                  onClick={() =>
                    navigate(
                      `/education/teacher/classes/${id}/courses/${course.id || course.course_id}/lectures`
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      </Card>
      <CreateCourseModal
        open={createCourseOpen}
        onClose={() => setCreateCourseOpen(false)}
        defaultClassId={id}
        onCreated={(newCourse) => {
          if (newCourse) setCourses((s) => [newCourse, ...s]);
        }}
      />
    </Section>
  );
}
