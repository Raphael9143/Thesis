import React from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import '../../assets/styles/components/layout/coursestab.css';
import { usePageInfo } from '../../contexts/PageInfoContext';

export default function CourseTabs() {
  const { id: classId, courseId } = useParams();
  const location = useLocation();
  const role = (typeof window !== 'undefined' && sessionStorage.getItem('role')) || null;
  const { showCourseNav } = usePageInfo();

  if (!showCourseNav) return null;

  const pathRole = location.pathname.includes('/education/student/') ? 'student' : null;
  const effectiveRole = pathRole || (role === 'student' ? 'student' : 'teacher');
  const base = `/education/${effectiveRole}/classes/${classId}/courses/${courseId}`;

  const linkClass = ({ isActive }) => `course-tab ${isActive ? 'active' : ''}`;

  return (
    <div className="course-tabs">
      <nav className="course-tabs__nav">
        <NavLink to={`${base}/lectures`} className={linkClass}>
          Lectures
        </NavLink>
        <NavLink to={`${base}/assignments`} className={linkClass}>
          Assignments
        </NavLink>
        <NavLink to={`${base}/exams`} className={linkClass}>
          Exams
        </NavLink>
        {role === 'teacher' && (
          <>
            <NavLink to={`${base}/students`} className={linkClass}>
              Students
            </NavLink>
            <NavLink to={`${base}/submissions`} className={linkClass}>
              Submissions
            </NavLink>
          </>
        )}
      </nav>
    </div>
  );
}
