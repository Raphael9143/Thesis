import React, { useState } from 'react';
import fetchAPI from '../../services/userAPI';
import '../assets/styles/auth.css';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const data = await fetchAPI.register({ email, password, role });
      if (data.success) {
        setMessage('Đăng ký thành công!');
      } else {
        setMessage(data.message || 'Đăng ký thất bại!');
      }
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Server error!');
    }
  };

  return (
    <div className="login-register-container">
      <h2>Đăng ký</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <button onClick={() => setRole('student')} className={role === 'student' ? 'active' : ''}>Học sinh</button>
        <button onClick={() => setRole('teacher')} className={role === 'teacher' ? 'active' : ''}>Giáo viên</button>
      </div>
      <form onSubmit={handleSubmit} className="login-register-form">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Đăng ký</button>
      </form>
      {message && <div className="message">{message}</div>}
    </div>
  );
}
