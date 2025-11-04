import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  const wrapperClass = (isLoggedIn && showEducationNavbar) ? `app-bg app-with-sidebar${leftCollapsed ? ' collapsed' : ''}` : 'app-bg';

  return (
    <PageInfoProvider>
      <div className={wrapperClass}>
        {isLoggedIn && showEducationNavbar ? (
          <>
            <LeftSidebar isLoggedIn={isLoggedIn} collapsed={leftCollapsed} onToggleCollapse={() => setLeftCollapsed(v => !v)} />
            <div className="app-container">
              <PageInfoBar />
              <Outlet />
            </div>
          </>
        ) : (
          <>
            <div className="app-container pt-16">
              <Outlet />
            </div>
          </>
        )}
      </div>
    </PageInfoProvider>
  );
}

function PageInfoBar() {
  const { title, showCourseNav, toggleCourseNav } = usePageInfo();
  return (
    <div className="page-info" aria-hidden={title ? 'false' : 'true'}>
      <button
        className="toggle-subnav-btn"
        aria-pressed={!showCourseNav}
        title={showCourseNav ? 'Hide course navigation' : 'Show course navigation'}
        onClick={toggleCourseNav}
      >
        <i className="fa fa-bars" aria-hidden="true" />
      </button>
      <div className="page-info__title">{title || ''}</div>
    </div>
  );
}
