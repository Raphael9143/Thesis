
import React, { useState } from 'react';
import fetchAPI from '../../services/userAPI';
import Cookies from 'js-cookie';
import '../assets/styles/auth.css';

const EyeIcon = ({ show, onClick }) => (
  <span onClick={onClick} style={{ cursor: 'pointer', marginLeft: 8 }} title={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
    {show ? (
      <svg width="20" height="20" fill="none" stroke="#555" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 1l22 22M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3.11-11-7.5a11.72 11.72 0 0 1 5.17-5.61M9.53 9.53A3 3 0 0 0 12 15a3 3 0 0 0 2.47-5.47"/><path d="M17.94 17.94A10.94 10.94 0 0 0 21 12.5c-1.73-4.39-6-7.5-11-7.5a10.94 10.94 0 0 0-5.17 1.39"/></svg>
    ) : (
      <svg width="20" height="20" fill="none" stroke="#555" strokeWidth="2" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="7.5"/><circle cx="12" cy="12" r="3"/></svg>
    )}
  </span>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const data = await fetchAPI.login({ email, password });
      if (!data.success) {
        setMessage(data.message || 'Sai tài khoản hoặc mật khẩu!');
        setLoading(false);
        return;
      }
      if (role === 'student' && data.data.user.role !== 'student' && data.data.user.role !== 'admin') {
        setMessage('Tài khoản này không phải học sinh!');
        setLoading(false);
        return;
      }
      if (role === 'teacher' && data.data.user.role !== 'teacher' && data.data.user.role !== 'admin') {
        setMessage('Tài khoản này không phải giáo viên hoặc admin!');
        setLoading(false);
        return;
      }
      Cookies.set('token', data.data.token, { expires: 7 });
      setMessage('Đăng nhập thành công!');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Server error!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-register-container">
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>
        <span role="img" aria-label="login" style={{ fontSize: 32, marginRight: 8 }}>🔐</span>
        Đăng nhập
      </h2>
      <div className="tab-nav">
        <button onClick={() => setRole('student')} className={role === 'student' ? 'active' : ''}>Học sinh</button>
        <button onClick={() => setRole('teacher')} className={role === 'teacher' ? 'active' : ''}>Giáo viên</button>
      </div>
      <form onSubmit={handleSubmit} className="login-register-form" autoComplete="on">
        <label style={{ fontWeight: 500 }}>Email</label>
        <input
          type="email"
          placeholder="Nhập email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoFocus
        />
        <label style={{ fontWeight: 500 }}>Mật khẩu</label>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <EyeIcon show={showPassword} onClick={() => setShowPassword(s => !s)} />
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
      {message && <div className="message" style={{ marginTop: 20 }}>{message}</div>}
    </div>
  );
}
