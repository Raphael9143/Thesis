import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import EducationNavbar from '../components/layout/EducationNavbar';
import '../assets/styles/ui.css';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isEducationRoute = location.pathname.startsWith('/education') || location.pathname.startsWith('/register');
  const isLoggedIn = sessionStorage.getItem('isLogin') === 'true';

  const handleLogout = () => {
    sessionStorage.removeItem('isLogin');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    // send to landing page of current context
    if (isEducationRoute) navigate('/education'); else navigate('/');
  };
  return (
    <div className="app-bg">
      {isEducationRoute ? (
        <EducationNavbar
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onNavigate={(tab) => {
            if (tab === 'researcher') navigate('/');
            if (tab === 'home') navigate('/education/home');
            if (tab === 'teacher-profile') navigate('/education/teacher/profile');
          }}
        />
      ) : (
        <Navbar
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          current={location.pathname === '/' ? 'researcher' : 'other'}
          onNavigate={(tab) => {
            if (tab === 'researcher') navigate('/');
            if (tab === 'education') navigate('/education');
            if (tab === 'register') navigate('/register');
            if (tab === 'home') navigate('/community/home');
          }}
        />
      )}
      <div className="app-container" style={{ paddingTop: 16 }}>
        <Outlet />
      </div>
    </div>
  );
}
