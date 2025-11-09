import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import LeftSidebar from '../components/layout/LeftSidebar';
import { PageInfoProvider, usePageInfo } from '../contexts/PageInfoContext';
import '../assets/styles/ui.css';

export default function MainLayout() {
  const location = useLocation();
  const [leftCollapsed, setLeftCollapsed] = React.useState(false);

  const showEducationNavbar = location.pathname.startsWith('/education') && location.pathname !== '/education';
  const isLoggedIn = sessionStorage.getItem('isLogin') === 'true';

  const wrapperClass =
    isLoggedIn && showEducationNavbar ? `app-bg app-with-sidebar${leftCollapsed ? ' collapsed' : ''}` : 'app-bg';

  return (
    <PageInfoProvider>
      <div className={wrapperClass}>
        {isLoggedIn && showEducationNavbar ? (
          <>
            <LeftSidebar
              isLoggedIn={isLoggedIn}
              collapsed={leftCollapsed}
              onToggleCollapse={() => setLeftCollapsed((v) => !v)}
            />
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
  const location = useLocation();

  // only show the subnav toggle on course detail pages
  const isCoursePage = /^\/education\/(teacher|student)\/classes\/[^/]+\/courses\//.test(location.pathname);

  return (
    <div className="page-info" aria-hidden={title ? 'false' : 'true'}>
      {isCoursePage && (
        <button
          className="toggle-subnav-btn"
          aria-pressed={!showCourseNav}
          title={showCourseNav ? 'Hide course navigation' : 'Show course navigation'}
          onClick={toggleCourseNav}
        >
          <i className="fa fa-bars" aria-hidden="true" />
        </button>
      )}
      <div className="page-info__title">{title || ''}</div>
    </div>
  );
}
