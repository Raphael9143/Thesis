import React, { useEffect, useRef, useState } from 'react';
import '../../assets/styles/ui.css';
import '../../assets/styles/components/layout/EducationNavbar.css';

export default function EducationNavbar({ onNavigate, onLogout, isLoggedIn = false }) {
  const [openMenu, setOpenMenu] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [displayName, setDisplayName] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const role = sessionStorage.getItem('role');
    const name = sessionStorage.getItem('full_name');
    const avatar = sessionStorage.getItem('avatar_url');
    if (name) setDisplayName(name);
    if (avatar) setAvatarUrl(avatar);
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpenMenu(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);
  return (
    <header className="nav">
      <div className="nav__brand edu-nav__brand">
        <img src="https://icon.icepanel.io/Technology/svg/Unified-Modelling-Language-%28UML%29.svg" width={28} alt="UML" />
        Education Portal
      </div>
      <nav className="nav__links edu-nav__links">
        <a className="link" href="#">Dashboard</a>
        <a className="link" href="#">Classes</a>
        <a className="link" href="#">Assignments</a>
        <a className="link" href="#">Resources</a>
      </nav>
      <div className="nav__links edu-nav__links edu-nav__links--right">
        <button className="btn" onClick={() => onNavigate('researcher')}>Research Hub</button>
        <button className="btn btn-primary" onClick={() => onNavigate('home')}>My Home</button>
        {isLoggedIn && (
          <div ref={menuRef} className="edu-nav__menuWrap">
            <button
              className="btn edu-nav__avatarBtn"
              onClick={(e) => { e.stopPropagation(); setOpenMenu((v) => !v); }}
              aria-haspopup="menu"
              aria-expanded={openMenu}
              title={displayName || 'Account'}
            >
              <img
                src={avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName || 'U')}
                alt="avatar"
                className="edu-nav__avatarImg"
              />
            </button>
            {openMenu && (
              <div role="menu" className="edu-nav__menu">
                <button
                  className="link edu-nav__menuItem"
                  onClick={() => { setOpenMenu(false); onNavigate('profile'); }}
                >
                  Profile
                </button>
                <div className="edu-nav__divider" />
                <button
                  className="link edu-nav__menuItem edu-nav__menuItem--danger"
                  onClick={() => { setOpenMenu(false); onLogout?.(); }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
