import React, { useState } from 'react';
import RoleTabs from './RoleTabs';
import { Link } from 'react-router-dom';
import userAPI from '../../../services/userAPI';
import socketClient from '../../services/socketClient';
import { useNotifications } from '../../contexts/NotificationContext';
import '../../assets/styles/auth.css';
import '../../assets/styles/ui.css';

export default function AuthForm({
  type = 'login',
  roles = [
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'researcher', label: 'Researcher' },
  ],
  title,
  subtitle,
  onSuccess,
  showSwitch = true,
  initialRole,
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [role, setRole] = useState(initialRole || roles[0].value);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { push } = useNotifications() || { push: () => {} };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      let data;
      if (type === 'login') {
        data = await userAPI.login({ email, password });
      } else {
        const roleUpper = (role || '').toString().toUpperCase();
        const genderUpper = (gender || '').toString().toUpperCase();
        data = await userAPI.register({
          email,
          password,
          role: roleUpper,
          full_name: fullName,
          dob: dateOfBirth,
          gender: genderUpper,
        });
      }
      if (!data.success) {
        setMessage(
          data.message || (type === 'login' ? 'Wrong email or password!' : 'Failed to register, please try again!')
        );
        return;
      }
      if (type === 'login' && roles.length === 2) {
        const userRole = (data.data?.user?.role ?? '').toString().toLowerCase();
        if (role === 'student' && userRole !== 'student') {
          setMessage("This account isn't a student account!");
          return;
        }
        if (role === 'teacher' && userRole !== 'teacher') {
          setMessage("This account isn't a teacher account!");
          return;
        }
      }
      sessionStorage.setItem('isLogin', 'true');
      sessionStorage.setItem('token', data.data.token);
      // initialize websocket connection immediately after login/register
      try {
        if (data.data?.token) {
          socketClient.initSocket(data.data.token);
        }
      } catch (err) {
        console.error('socket init after auth error', err);
      }
      const resolvedRole = (data.data?.user?.role ?? role ?? '').toString().toLowerCase();
      if (resolvedRole) sessionStorage.setItem('role', resolvedRole);
      const serverUser = data.data?.user || {};
      // Persist basic profile info for navbar/avatar usage
      if (serverUser.full_name || (type === 'register' && fullName)) {
        const nameToUse = serverUser.full_name || fullName;
        sessionStorage.setItem('full_name', nameToUse);
        // Frontend-only avatar: use ui-avatars.com and do not persist backend avatar_url
        try {
          const uiAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(nameToUse || 'User');
          sessionStorage.setItem('avatar_url', uiAvatar);
        } catch (err) {
          console.warn('Failed to set avatar in sessionStorage', err);
        }
      }
      if (onSuccess) onSuccess(data);
      // push an example notification: login success
      try {
        push({
          id: `login-${Date.now()}`,
          title: 'Đăng nhập thành công',
          body: `Xin chào ${data.data?.user?.full_name || ''}`,
          ts: Date.now(),
          data: { type: 'system' },
        });
      } catch (err) {
        console.error('push notification error', err);
      }
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Server error!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      {title && <h3>{title}</h3>}
      {subtitle && <div className="text-muted mb-8">{subtitle}</div>}
      {roles.length > 1 && (
        <RoleTabs role={role} onChange={setRole} options={roles.map((r) => ({ value: r.value, label: r.label }))} />
      )}
      <form onSubmit={handleSubmit} className="auth-line-form">
        {type === 'register' && (
          <input
            className="auth-line-input"
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoFocus
          />
        )}
        {type === 'register' && (
          <input
            className="auth-line-input"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
          />
        )}
        {type === 'register' && (
          <select className="auth-line-input" value={gender} onChange={(e) => setGender(e.target.value)} required>
            <option value="" disabled>
              Select gender
            </option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        )}
        <input
          className="auth-line-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus={type !== 'register'}
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
          {loading ? (type === 'login' ? 'Logging in...' : 'Registering...') : type === 'login' ? 'Login' : 'Register'}
        </button>
        {showSwitch && (
          <p className="switch">
            {type === 'login' ? (
              <>
                Don&apos;t have any accounts? <Link to="/register">Register</Link>
              </>
            ) : (
              <>
                Already have an account? <Link to="/education">Login</Link>
              </>
            )}
          </p>
        )}
      </form>
      {message && <div className="message">{message}</div>}
    </div>
  );
}
