import React, { useState } from 'react';
import userAPI from '../../services/userAPI';
import AuthCard from '../components/auth/AuthCard';
import Input from '../components/auth/Input';
import PasswordInput from '../components/auth/PasswordInput';
import '../assets/styles/auth.css';

export default function ResearcherLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const data = await userAPI.login({ email, password });
      if (!data.success) {
        setMessage(data.message || 'Sai tài khoản hoặc mật khẩu!');
        return;
      }
      // Nếu backend có role researcher, có thể kiểm tra ở đây
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
    <AuthCard title="Researcher Login" subtitle="Dành cho các nhà nghiên cứu (OCL/UML)">
      <form onSubmit={handleSubmit} className="login-register-form">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@lab.org" autoFocus />
        <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </form>
      {message && <div className="message">{message}</div>}
    </AuthCard>
  );
}
