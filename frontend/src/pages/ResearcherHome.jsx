import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import AuthForm from '../components/auth/AuthForm';
import NotificationPopup from '../components/ui/NotificationPopup';
import '../assets/styles/home.css';
import '../assets/styles/ui.css';
import '../assets/styles/pages/ResearcherHome.css';

export default function ResearcherHome() {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [authType, setAuthType] = useState('login');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMessage, _setNotifyMessage] = useState('');
  const [notifyType, _setNotifyType] = useState('success');

  const onSuccessAuth = () => {
    setShowAuth(false);
    // Redirect to community home
    navigate('/community/home');
  };

  return (
    <>
      <div className="home">
        {/* Main hero section */}
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero__title">Explore the Frontier of OCL & UML Research</h1>
            <p className="hero__subtitle">
              Welcome to the Research Hub - a collaborative environment for model-driven engineering, OCL constraint
              sharing, and UML-based innovation. Connect with global researchers, publish studies, and enhance modeling
              knowledge.
            </p>
            <div className="hero-buttons">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setAuthType('login');
                  setShowAuth(true);
                }}
              >
                Explore Research
              </button>
              <button
                className="btn btn-signin"
                onClick={() => {
                  setAuthType('register');
                  setShowAuth(true);
                }}
              >
                Get Started
              </button>
            </div>
            <div className="switch-to-education">
              <p>
                Looking for educational resources?{' '}
                <a className="researcher-auth-switch-button" onClick={() => navigate('/education/home')}>
                  Go to Education Portal
                </a>
              </p>
            </div>
            <div className="stats">
              <div className="stat-box">
                <h3>2.3K+</h3>
                <p>Active Researchers</p>
              </div>
              <div className="stat-box">
                <h3>480+</h3>
                <p>Published Models</p>
              </div>
              <div className="stat-box">
                <h3>1.2K+</h3>
                <p>OCL Constraints</p>
              </div>
            </div>
          </div>
          <div className="hero-images hero-half">
            <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800" alt="research teamwork" />
            <img
              src="https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/55132-uml-diagramming-and-database-modeling-1?resMode=sharp2&op_usm=1.5,0.65,15,0&wid=752&hei=580&qlt=100&fmt=png-alpha&fit=constrain"
              alt="uml modeling"
            />
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800" alt="coding group" />
            <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800" alt="research lab" />
          </div>
        </section>

        <Modal
          open={showAuth}
          onClose={() => setShowAuth(false)}
          title={authType === 'login' ? 'Sign in to Research Hub' : 'Register for Research Hub'}
        >
          <AuthForm
            type={authType}
            roles={[
              { value: 'student', label: 'Student' },
              { value: 'teacher', label: 'Teacher' },
              { value: 'researcher', label: 'Researcher' },
            ]}
            showSwitch={false}
            showCommunity={false}
            onSuccess={onSuccessAuth}
          />
          <div className="researcher-auth-switch">
            {authType === 'login' ? (
              <p>
                Don&apos;t have any account?{' '}
                <a className="researcher-auth-switch-button" onClick={() => setAuthType('register')}>
                  Register
                </a>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <a className="researcher-auth-switch-button" onClick={() => setAuthType('login')}>
                  Login
                </a>
              </p>
            )}
          </div>
        </Modal>

        {/* Sections below hero */}
        <div className="sections">
          <Section title="Featured Collections">
            <div className="grid grid--3">
              <Card title="Projects">
                <div className="feature-card">
                  <h4>500+ projects</h4>
                  <p>Hands-on projects with real constraint testing.</p>
                </div>
              </Card>
              <Card title="OCL constraints">
                <div className="feature-card">
                  <h4>2000+ constraints</h4>
                  <p>Well-documented and verified constraints.</p>
                </div>
              </Card>
              <Card title="OCL Contributors">
                <div className="feature-card">
                  <h4>5000+ contributors</h4>
                  <p>Contributing classes, constraints, and associations.</p>
                </div>
              </Card>
            </div>
          </Section>

          <Section title="Latest Publications">
            <div className="grid grid--3">
              <Card title="Constraint Inference">
                <p>Inferring OCL constraints from examples.</p>
              </Card>
              <Card title="Model Repair">
                <p>Automated repair of inconsistent UML models.</p>
              </Card>
              <Card title="Specification Mining">
                <p>Mining invariants for software models.</p>
              </Card>
            </div>
          </Section>
        </div>
      </div>
      <NotificationPopup
        message={notifyMessage}
        open={notifyOpen}
        type={notifyType}
        onClose={() => setNotifyOpen(false)}
      />
    </>
  );
}
