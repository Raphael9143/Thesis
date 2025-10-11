import React from 'react';
import '../../assets/styles/ui.css';

export default function EducationNavbar({ onNavigate }) {
  return (
    <header className="nav">
      <div className="nav__brand" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="https://icon.icepanel.io/Technology/svg/Unified-Modelling-Language-%28UML%29.svg" width={28} alt="UML" />
        Education Portal
      </div>
      <nav className="nav__links" style={{ alignItems: 'center' }}>
        <a className="link" href="#">Dashboard</a>
        <a className="link" href="#">Classes</a>
        <a className="link" href="#">Assignments</a>
        <a className="link" href="#">Resources</a>
      </nav>
      <div className="nav__links" style={{ alignItems: 'center' }}>
  <button className="btn" onClick={() => onNavigate('researcher')}>Research Hub</button>
  <button className="btn btn-primary" onClick={() => onNavigate('home')}>My Home</button>
      </div>
    </header>
  );
}
