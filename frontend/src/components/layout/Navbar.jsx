import React from 'react';
import '../../assets/styles/ui.css';

export default function Navbar({ current, onNavigate }) {
  return (
    <header className="nav">
      <div className="nav__brand" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="https://icon.icepanel.io/Technology/svg/Unified-Modelling-Language-%28UML%29.svg" width={28} alt="UML" />
        OCL/UML Research Hub
      </div>
      <nav className="nav__links" style={{ alignItems: 'center' }}>
        <a className="link" href="#">Home</a>
        <a className="link" href="#">Projects</a>
        <a className="link" href="#">Publications</a>
        <a className="link" href="#">Community</a>
        <a className="link" href="#">About</a>
        <a className="link" href="#">Contact</a>
      </nav>
      <div className="nav__links" style={{ alignItems: 'center' }}>
        <button className="btn btn-signin" onClick={() => onNavigate('education')}>Education</button>
        <button className="btn btn-primary" onClick={() => onNavigate('researcher')}>Community</button>
      </div>
    </header>
  );
}
