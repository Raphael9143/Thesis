import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import '../assets/styles/ui.css';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const map = {
    '/': 'researcher',
    '/education': 'education',
    '/register': 'register',
  };
  const current = map[location.pathname] || 'researcher';
  const hideNav = location.pathname === '/education' || location.pathname === '/register';
  return (
    <div className="app-bg">
      {!hideNav && (
        <Navbar
          current={current}
          onNavigate={(tab) => {
            if (tab === 'researcher') navigate('/');
            if (tab === 'education') navigate('/education');
            if (tab === 'register') navigate('/register');
          }}
        />
      )}
      <div className="app-container" style={{ paddingTop: 16 }}>
        <Outlet />
      </div>
    </div>
  );
}
