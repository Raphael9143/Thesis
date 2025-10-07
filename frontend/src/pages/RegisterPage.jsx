import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import userAPI from '../../services/userAPI';
import RoleTabs from '../components/auth/RoleTabs';
import '../assets/styles/auth.css';
import '../assets/styles/ui.css';

export default function RegisterPage() {
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
      const data = await userAPI.register({ email, password, role });
      if (data.success) {
        setMessage('Successfully registering.');
      } else {
        setMessage(data.message || 'Failed to register, please try again!');
      }
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
            <span>Research Portal</span> helps you collaborate, analyze, and validate models.
          </p>
        </div>
        <div className="auth-logo">
          <div className="logo-circle">R</div>
        </div>
      </div>

      <div className="auth-2col-right">
        <div className="form-container">
          <h3>Register</h3>
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
              {loading ? 'Registering...' : 'Register'}
            </button>
            <p className="switch">
              Already have an account? <Link to="/education">Login</Link>
            </p>
            <p className="switch">
              Want to contribute to real-world projects? Join in our <Link to="/">Community</Link>
            </p>
          </form>
          {message && <div className="message">{message}</div>}
        </div>
      </div>
      </div>
    </div>
  );
}
