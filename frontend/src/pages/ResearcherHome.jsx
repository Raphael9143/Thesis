import React, { useState } from 'react';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import Input from '../components/auth/Input';
import PasswordInput from '../components/auth/PasswordInput';
import Modal from '../components/ui/Modal';
import userAPI from '../../services/userAPI';
import '../assets/styles/ui.css';
import '../assets/styles/home.css';

export default function ResearcherHome() {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const data = await userAPI.login({ email, password });
      if (!data.success) { setMessage(data.message || 'Wrong email or password!'); return; }
      // Optionally enforce researcher role if backend supports it
      // if (data.data?.user?.role !== 'researcher') { setMessage('Không phải tài khoản Researcher'); return; }
      sessionStorage.setItem('isLogin', 'true');
      sessionStorage.setItem('token', data.data.token);
      setMessage('Đăng nhập thành công!');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Server error!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero__title">
            Explore the Frontier of OCL & UML Research
          </h1>
          <p className="hero__subtitle">
            Welcome to the Research Hub — a collaborative environment for model-driven engineering, OCL constraint sharing, and UML-based innovation. Connect with global researchers, publish studies, and enhance modeling knowledge.
          </p>
          <div className="hero-buttons">
            <button
              className="btn btn-primary"
              onClick={() => setShowLogin(true)}
            >
              Explore Research
            </button>
            <button
              className="btn btn-signin"
              onClick={() => setShowLogin(true)}
            >
              Get Started
            </button>
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
        <div className="hero-images" style={{ width: '50%' }}>
          <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800" alt="research teamwork" />
          <img src="https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/55132-uml-diagramming-and-database-modeling-1?resMode=sharp2&op_usm=1.5,0.65,15,0&wid=752&hei=580&qlt=100&fmt=png-alpha&fit=constrain" alt="uml modeling" />
          <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800" alt="coding group" />
          <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800" alt="research lab" />
        </div>
      </section>

      <Modal open={showLogin} onClose={() => setShowLogin(false)} title="Researcher Sign-in">
        <form onSubmit={handleLogin} className="login-register-form">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@lab.org"
          />
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {message && <div className="message">{message}</div>}
      </Modal>

      <div className="sections">
        <Section title="Featured Collections" subtitle="Tuyển chọn các bộ dữ liệu và mô hình phổ biến">
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

        <Section title="Latest Publications" subtitle="Các công bố gần đây có dữ liệu đi kèm">
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
  );
}
