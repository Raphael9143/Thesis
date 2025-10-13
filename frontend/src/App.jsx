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
import RequireAuth from './components/routing/RequireAuth';
import RequireRole from './components/routing/RequireRole';
import Unauthorized from './pages/Unauthorized';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<MainLayout />}>
      <Route path="/" element={<ResearcherHome />} />
      <Route path="/education" element={<EducationLogin />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected education routes */}
      <Route element={<RequireAuth><Outlet /></RequireAuth>}>
        <Route path="/education/home" element={<Home />} />
        <Route path="/education/teacher/profile" element={<RequireRole allowed={["teacher"]}><TeacherProfile /></RequireRole>} />
        <Route path="/education/student/profile" element={<RequireRole allowed={["student"]}><StudentProfile /></RequireRole>} />
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
