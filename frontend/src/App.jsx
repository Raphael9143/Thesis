import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, Outlet } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import EducationLogin from './pages/EducationLogin';
import ResearcherHome from './pages/ResearcherHome';
import Home from './pages/Home';
import RegisterPage from './pages/RegisterPage';
import NotFound from './pages/NotFound';
import './App.css';
import TeacherProfile from './pages/teacher/Profile';
import StudentProfile from './pages/student/Profile';
import StudentClassesPage from './pages/student/Classes';
import ClassesPage from './pages/teacher/Classes';
import ClassDetailTeacherPage from './pages/teacher/ClassDetail';
import CourseOverview from './pages/teacher/course/CourseOverview';
import LecturesList from './pages/teacher/course/LecturesList';
import AssignmentsList from './pages/teacher/course/AssignmentsList';
import ExamsList from './pages/teacher/course/ExamsList';
import StudentsList from './pages/teacher/course/StudentsList';
import ClassCoursesTeacherPage from './pages/teacher/ClassCourses';
import ClassDetailStudentPage from './pages/student/ClassDetail';
import ClassCoursesStudentPage from './pages/student/ClassCourses';
import LecturePreview from './pages/preview/LecturePreview';
import AssignmentPreview from './pages/preview/AssignmentPreview';
import ExamPreview from './pages/preview/ExamPreview';
import RequireAuth from './components/routing/RequireAuth';
import RequireRole from './components/routing/RequireRole';
import Unauthorized from './pages/Unauthorized';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<MainLayout />}>
      <Route path="/" element={<ResearcherHome />} />
      <Route path="/education" element={<EducationLogin />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<RequireAuth><Outlet /></RequireAuth>}>
        <Route path="/education/home" element={<Home />} />
        <Route path="/education/teacher/classes" element={<RequireRole allowed={["teacher"]}><ClassesPage /></RequireRole>} />
        <Route path="/education/teacher/classes/:id" element={<RequireRole allowed={["teacher"]}><React.Suspense fallback={<div>Loading...</div>}><ClassCoursesTeacherPage /></React.Suspense></RequireRole>} />
        <Route path="/education/teacher/classes/:id/courses/:courseId" element={<RequireRole allowed={["teacher"]}><React.Suspense fallback={<div>Loading...</div>}><ClassDetailTeacherPage /></React.Suspense></RequireRole>}>
          <Route index element={<CourseOverview />} />
          <Route path="lectures" element={<LecturesList />} />
          <Route path="assignments" element={<AssignmentsList />} />
          <Route path="exams" element={<ExamsList />} />
          <Route path="students" element={<RequireRole allowed={["teacher"]}><React.Suspense fallback={<div>Loading...</div>}><StudentsList /></React.Suspense></RequireRole>} />
          <Route path="submissions" element={<RequireRole allowed={["teacher"]}><div>Submissions (coming soon)</div></RequireRole>} />
        </Route>
        <Route path="/education/teacher/classes/:classId/courses/:courseId/lectures/:lectureId" element={<RequireRole allowed={["teacher"]}><LecturePreview /></RequireRole>} />
        <Route path="/education/teacher/classes/:classId/courses/:courseId/assignments/:assignmentId" element={<RequireRole allowed={["teacher"]}><AssignmentPreview /></RequireRole>} />
        <Route path="/education/teacher/classes/:classId/courses/:courseId/exams/:examId" element={<RequireRole allowed={["teacher"]}><ExamPreview /></RequireRole>} />
        <Route path="/education/teacher/profile" element={<RequireRole allowed={["teacher"]}><TeacherProfile /></RequireRole>} />
        <Route path="/education/student/profile" element={<RequireRole allowed={["student"]}><StudentProfile /></RequireRole>} />
        <Route path="/education/student/classes" element={<RequireRole allowed={["student"]}><StudentClassesPage /></RequireRole>} />
        <Route path="/education/student/classes/:id" element={<RequireRole allowed={["student"]}><React.Suspense fallback={<div>Loading...</div>}><ClassCoursesStudentPage /></React.Suspense></RequireRole>} />
        <Route path="/education/student/classes/:id/courses/:courseId" element={<RequireRole allowed={["student"]}><React.Suspense fallback={<div>Loading...</div>}><ClassDetailStudentPage /></React.Suspense></RequireRole>} />
        <Route path="/education/student/classes/:classId/courses/:courseId/lectures/:lectureId" element={<RequireRole allowed={["student"]}><LecturePreview /></RequireRole>} />
        <Route path="/education/student/classes/:classId/courses/:courseId/assignments/:assignmentId" element={<RequireRole allowed={["student"]}><AssignmentPreview /></RequireRole>} />
        <Route path="/education/student/classes/:classId/courses/:courseId/exams/:examId" element={<RequireRole allowed={["student"]}><ExamPreview /></RequireRole>} />
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/community/home" element={<Home />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

export default function App() {
  return <RouterProvider router={router} />;
}
