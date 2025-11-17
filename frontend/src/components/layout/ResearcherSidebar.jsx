import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/components/layout/LeftSidebar.css';

export default function ResearcherSidebar({ collapsed = false, onToggleCollapse = () => {} }) {
  const navigate = useNavigate();

  const goto = (path) => navigate(path);

  const logout = () => {
    sessionStorage.removeItem('isLogin');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    goto('/');
  };

  const goToEducation = () => {
    const isLogin = sessionStorage.getItem('isLogin') === 'true';
    const role = (sessionStorage.getItem('role') || '').toString().toLowerCase();
    if (isLogin && role === 'researcher') {
      // Log out researcher and go to Education login page
      sessionStorage.removeItem('isLogin');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('role');
      goto('/education');
      return;
    }
    // Otherwise, go to Education dashboard
    goto('/education/home');
  };

  return (
    <aside className={`leftsidebar ${collapsed ? 'leftsidebar--collapsed' : ''}`} aria-expanded={!collapsed}>
      <div className="leftsidebar__brand">
        <img
          src="https://icon.icepanel.io/Technology/svg/Unified-Modelling-Language-%28UML%29.svg"
          width={28}
          alt="UML"
        />
        <div className="leftsidebar__brandText">Research Hub</div>
        <button
          className="leftsidebar__collapseBtn"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <i className={`fa ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`} />
        </button>
      </div>

      <nav className="leftsidebar__nav">
        <button className="leftsidebar__link" onClick={() => goto('/researcher/dashboard')}>
          <i className="fa fa-tachometer-alt" aria-hidden />
          <span>Dashboard</span>
        </button>
        <button className="leftsidebar__link" onClick={() => goto('/researcher/projects')}>
          <i className="fa fa-project-diagram" aria-hidden />
          <span>Projects</span>
        </button>
        <button className="leftsidebar__link" onClick={() => goto('/researcher/starred')}>
          <i className="fa fa-star" aria-hidden />
          <span>Starred</span>
        </button>
        <button className="leftsidebar__link" onClick={() => goto('/researcher/resources')}>
          <i className="fa fa-book" aria-hidden />
          <span>Resources</span>
        </button>
      </nav>

      <div className="leftsidebar__bottom">
        <button className="leftsidebar__link" onClick={() => goto('/researcher/profile')}>
          <i className="fa fa-user" aria-hidden />
          <span>Profile</span>
        </button>
        <button className="leftsidebar__link" onClick={goToEducation}>
          <i className="fa fa-graduation-cap" aria-hidden />
          <span>Education</span>
        </button>
        <button className="leftsidebar__link" onClick={logout}>
          <i className="fa fa-sign-out-alt" aria-hidden />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
