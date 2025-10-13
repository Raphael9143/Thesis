import React, { useEffect, useRef, useState } from 'react';
import '../../assets/styles/ui.css';
import '../../assets/styles/components/layout/EducationNavbar.css';
import NotificationCenter from '../ui/NotificationCenter';
import { useNotifications } from '../../contexts/NotificationContext';

export default function EducationNavbar({ onNavigate, onLogout, isLoggedIn = false }) {
  const [openMenu, setOpenMenu] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [openNotif, setOpenNotif] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const { notifications } = useNotifications() || { notifications: [] };

  useEffect(() => {
    const role = sessionStorage.getItem('role');
    const name = sessionStorage.getItem('full_name');
    const avatar = sessionStorage.getItem('avatar_url');
    if (name) setDisplayName(name);
    if (avatar) setAvatarUrl(avatar);
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setOpenNotif(false);
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
        <a className="link" href="/education/home">Dashboard</a>
        <a className="link" href="#">Classes</a>
        <a className="link" href="#">Assignments</a>
        <a className="link" href="#">Resources</a>
      </nav>
      <div className="nav__links edu-nav__links edu-nav__links--right">
        <button className="btn btn-signin" onClick={() => onNavigate('researcher')}>Research Hub</button>
        {isLoggedIn && (
          <>
            <div ref={notifRef} style={{ position: 'relative', marginRight: 8 }}>
              <span
                className="edu-nav__notifBtn"
                onClick={(e) => { e.stopPropagation(); setOpenNotif((v) => !v); }}
                aria-haspopup="dialog"
                aria-expanded={openNotif}
                title="Notifications"
              >
                🔔
                {Array.isArray(notifications) && notifications.filter(n => !n.read).length > 0 && (
                  <span className="notification-count-number">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </span>
              {openNotif && (
                <div style={{ position: 'absolute', right: 0, top: 40, zIndex: 1200 }}>
                  <NotificationCenter onClose={() => setOpenNotif(false)} />
                </div>
              )}
            </div>

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
          </>
        )}
      </div>
    </header>
  );
}
