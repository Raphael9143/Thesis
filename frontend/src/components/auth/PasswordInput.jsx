import React, { useState } from 'react';

export default function PasswordInput({ label = 'Mật khẩu', value, onChange, placeholder = 'Nhập mật khẩu' }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="font-500">{label}</label>
      <div className="flex-center">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="auth-input flex-1"
          required
        />
        <button type="button" className="ghost-btn" onClick={() => setShow((s) => !s)}>
          {show ? 'Ẩn' : 'Hiện'}
        </button>
      </div>
    </div>
  );
}
