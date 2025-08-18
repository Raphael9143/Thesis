
import React, { useState } from 'react';
import './App.css';
import { register as apiRegister, login as apiLogin } from './api/auth';
import Cookies from 'js-cookie';

export default function LoginRegister() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      let response;
      if (isLogin) {
        response = await apiLogin(form.email, form.password);
      } else {
        response = await apiRegister(form.username, form.email, form.password);
      }
      const data = response.data;
      if (data.success) {
        setMessage(data.message || (isLogin ? 'Login successful!' : 'Register successful!'));
        if (data.data?.token) {
          setToken(data.data.token);
          Cookies.set('token', data.data.token, { expires: 3 }); // Lưu token vào cookies 7 ngày
        }
      } else {
        setMessage(data.message || 'Error!');
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setMessage(err.response.data.message);
      } else {
        setMessage('Server error!');
      }
    }
  };

  return (
    <div className="login-register-container">
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      <form onSubmit={handleSubmit} className="login-register-form">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
      </form>
      <button className="toggle-btn" onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'No account? Register' : 'Have account? Login'}
      </button>
      {message && <div className="message">{message}</div>}
    </div>
  );
}
