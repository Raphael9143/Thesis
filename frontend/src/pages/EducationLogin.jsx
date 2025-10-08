import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import userAPI from '../../services/userAPI';
import RoleTabs from '../components/auth/RoleTabs';
import '../assets/styles/auth.css';
import '../assets/styles/ui.css';

export default function EducationLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const data = await userAPI.login({ email, password });
      if (!data.success) {
        setMessage(data.message || 'Wrong email or password!');
        return;
      }
      const userRole = data.data?.user?.role;
      if (role === 'student' && userRole !== 'student') {
        setMessage('This account isn\'t a student account!');
        return;
      }
      if (role === 'teacher' && userRole !== 'teacher' && userRole !== 'admin') {
        setMessage('This account isn\'t a teacher account!');
        return;
      }
      sessionStorage.setItem('isLogin', 'true');
      sessionStorage.setItem('token', data.data.token);
      setMessage('Successfully login!');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Server error!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-viewport">
      <div className="auth-2col">
      <div className="auth-2col-left">
        <div className="auth-left-content">
          <h2>Exploring OCL & UML?</h2>
          <p>
            <span><Link to="/" className="navigate-community">Research Portal</Link></span> helps you collaborate, analyze, and validate models.
          </p>
        </div>
      </div>

      <div className="auth-2col-right">
        <div className="form-container">
          <h3>Education Login</h3>
          <RoleTabs
            role={role}
            onChange={setRole}
            options={[{ value: 'student', label: 'Student' }, { value: 'teacher', label: 'Teacher' }]}
          />
          <form onSubmit={handleSubmit} className="auth-line-form">
            <input
              className="auth-line-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <input
              className="auth-line-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="auth-line-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <p className="switch">
              Don't have any accounts? <Link to="/register">Register</Link>
            </p>
          </form>
          {message && <div className="message">{message}</div>}
        </div>
      </div>
      </div>
    </div>
  );
}
