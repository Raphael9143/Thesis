import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import EducationLogin from './pages/EducationLogin';
import ResearcherHome from './pages/ResearcherHome';
import RegisterPage from './pages/RegisterPage';
import NotFound from './pages/NotFound';
import './App.css';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<MainLayout />}> 
      <Route path="/" element={<ResearcherHome />} />
      <Route path="/education" element={<EducationLogin />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

export default function App() {
  return <RouterProvider router={router} />;
}
