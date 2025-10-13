import React from 'react';
import '../../assets/styles/ui.css';

export default function Navbar({ current, onNavigate, onLogout, isLoggedIn = false }) {
  return (
    <header className="nav">
      <div className="nav__brand" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="https://icon.icepanel.io/Technology/svg/Unified-Modelling-Language-%28UML%29.svg" width={28} alt="UML" />
        OCL/UML Research Hub
      </div>
      <nav className="nav__links" style={{ alignItems: 'center' }}>
        <button className="link" type="button">Home</button>
        <button className="link" type="button">Projects</button>
        <button className="link" type="button">Publications</button>
        <button className="link" type="button">Community</button>
        <button className="link" type="button">About</button>
        <button className="link" type="button">Contact</button>
      </nav>
      <div className="nav__links" style={{ alignItems: 'center' }}>
        <button className="btn btn-signin" onClick={() => onNavigate('education')}>Education</button>
        <button className="btn btn-primary" onClick={() => onNavigate('researcher')}>Community</button>
        {isLoggedIn && (
          <button className="btn" onClick={onLogout}>Logout</button>
        )}
      </div>
    </header>
  );
}
