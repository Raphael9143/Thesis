import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/components/layout/LeftSidebar.css';

export default function LeftSidebar({ isLoggedIn = false, collapsed = false, onToggleCollapse = () => {} }) {
  const navigate = useNavigate();
  const role = (sessionStorage.getItem('role') || '').toString().toLowerCase();

  const goto = (path) => {
    navigate(path);
  };

  const logout = () => {
    sessionStorage.removeItem('isLogin');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    goto('/');
  };

  return (
    <aside className={`leftsidebar ${collapsed ? 'leftsidebar--collapsed' : ''}`} aria-expanded={!collapsed}>
      <div className="leftsidebar__brand">
        <img
          src="https://icon.icepanel.io/Technology/svg/Unified-Modelling-Language-%28UML%29.svg"
          width={28}
          alt="UML"
        />
        <div className="leftsidebar__brandText">OCL Education</div>
        <button
          className="leftsidebar__collapseBtn"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <i className={`fa ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`} />
        </button>
      </div>

      <nav className="leftsidebar__nav">
        <button className="leftsidebar__link" onClick={() => goto('/education/home')}>
          <i className="fa fa-tachometer-alt" aria-hidden />
          <span>Dashboard</span>
        </button>
        <button
          className="leftsidebar__link"
          onClick={() => goto(role === 'student' ? '/education/student/classes' : '/education/teacher/classes')}
        >
          <i className="fa fa-book" aria-hidden />
          <span>Classes</span>
        </button>
        <button className="leftsidebar__link" onClick={() => goto('/education/resources')}>
          <i className="fa fa-folder-open" aria-hidden />
          <span>Resources</span>
        </button>
      </nav>

      <div className="leftsidebar__bottom">
        {isLoggedIn && (
          <button
            className="leftsidebar__link"
            onClick={() => goto(role === 'student' ? '/education/student/profile' : '/education/teacher/profile')}
          >
            <i className="fa fa-user" aria-hidden />
            <span>Profile</span>
          </button>
        )}
        <button className="leftsidebar__link" onClick={() => goto('/')}>
          <i className="fa fa-flask" aria-hidden />
          <span>Research Hub</span>
        </button>
        {isLoggedIn && (
          <button className="leftsidebar__link" onClick={logout}>
            <i className="fa fa-sign-out-alt" aria-hidden />
            <span>Logout</span>
          </button>
        )}
      </div>
    </aside>
  );
}
