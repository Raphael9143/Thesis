import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
// Navbar components replaced by LeftSidebar
import LeftSidebar from '../components/layout/LeftSidebar';
import { PageInfoProvider, usePageInfo } from '../contexts/PageInfoContext';
import socketClient from '../services/socketClient';
import '../assets/styles/ui.css';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [leftCollapsed, setLeftCollapsed] = React.useState(false);

  const showEducationNavbar = location.pathname.startsWith('/education') && location.pathname !== '/education';
  const hideAnyNavbar = location.pathname === '/education';
  const isLoggedIn = sessionStorage.getItem('isLogin') === 'true';

  const handleLogout = () => {
    sessionStorage.removeItem('isLogin');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    try {
      socketClient.disconnectSocket();
    } catch (err) {
      console.error('socket disconnect error', err);
    }
    // send to landing page of current context
    if (showEducationNavbar) navigate('/education'); else navigate('/');
  };
  return (
    <PageInfoProvider>
      <div className={`app-bg app-with-sidebar${leftCollapsed ? ' collapsed' : ''}`}>
        {/* Left sidebar replaces top navbar */}
        <LeftSidebar isLoggedIn={isLoggedIn} collapsed={leftCollapsed} onToggleCollapse={() => setLeftCollapsed(v => !v)} />

        <div className="app-container">
          <PageInfoBar />
          <Outlet />
        </div>
      </div>
    </PageInfoProvider>
  );
}

function PageInfoBar() {
  const { title } = usePageInfo();
  return (
    <div className="page-info" aria-hidden={title ? 'false' : 'true'}>
      <div className="page-info__title">{title || 'OCL Education'}</div>
    </div>
  );
}
