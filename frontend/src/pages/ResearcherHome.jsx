import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import AuthForm from '../components/auth/AuthForm';
import NotificationPopup from '../components/ui/NotificationPopup';
import RecentProjectsCarousel from '../components/researcher/RecentProjectsCarousel';
import userAPI from '../../services/userAPI';
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
  const [stats, setStats] = useState({ projects: 0, contributions: 0, use_models: 0, researchers: 0 });
  const [recentProjects, setRecentProjects] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [statsRes, projectsRes] = await Promise.all([
          userAPI.getResearchStatistics(),
          userAPI.getRecentProjects(10),
        ]);
        if (mounted) {
          if (statsRes?.success && statsRes.data) {
            setStats(statsRes.data);
          }
          if (projectsRes?.success && Array.isArray(projectsRes.data)) {
            setRecentProjects(projectsRes.data);
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onSuccessAuth = () => {
    setShowAuth(false);
    // Redirect to authenticated researcher workspace
    navigate('/researcher');
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
                <div className="stat-icon">
                  <i className="fa fa-users"></i>
                </div>
                <h3>{stats.researchers.toLocaleString()}+</h3>
                <p>Active Researchers</p>
              </div>
              <div className="stat-box">
                <div className="stat-icon">
                  <i className="fa fa-project-diagram"></i>
                </div>
                <h3>{stats.projects.toLocaleString()}+</h3>
                <p>Research Projects</p>
              </div>
              <div className="stat-box">
                <div className="stat-icon">
                  <i className="fa fa-code-branch"></i>
                </div>
                <h3>{stats.contributions.toLocaleString()}+</h3>
                <p>Contributions</p>
              </div>
              <div className="stat-box">
                <div className="stat-icon">
                  <i className="fa fa-cube"></i>
                </div>
                <h3>{stats.use_models.toLocaleString()}+</h3>
                <p>USE Models</p>
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

        {/* Recent Projects Carousel */}
        <RecentProjectsCarousel
          projects={recentProjects}
          onJoinClick={() => {
            setAuthType('login');
            setShowAuth(true);
          }}
        />

        {/* Sections below hero */}
        <div className="sections">
          <Section title="Why Join Our Research Community?">
            <div className="grid grid--3">
              <Card>
                <div className="feature-card">
                  <div className="feature-icon">
                    <i className="fa fa-share-alt"></i>
                  </div>
                  <h4>Collaborative Research</h4>
                  <p>
                    Work with researchers worldwide on cutting-edge UML and OCL projects. Share models, constraints, and
                    insights.
                  </p>
                </div>
              </Card>
              <Card>
                <div className="feature-card">
                  <div className="feature-icon">
                    <i className="fa fa-star"></i>
                  </div>
                  <h4>Quality Models</h4>
                  <p>
                    Access {stats.use_models.toLocaleString()}+ validated USE models with comprehensive documentation
                    and testing.
                  </p>
                </div>
              </Card>
              <Card>
                <div className="feature-card">
                  <div className="feature-icon">
                    <i className="fa fa-rocket"></i>
                  </div>
                  <h4>Innovation Hub</h4>
                  <p>
                    Contribute to {stats.projects.toLocaleString()}+ active projects and advance model-driven
                    engineering research.
                  </p>
                </div>
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
