import React from 'react';

export default function Input({ label, type = 'text', value, onChange, placeholder, autoFocus, name }) {
  return (
    <div>
      {label && <label className="font-500">{label}</label>}
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="auth-input"
        required
      />
    </div>
  );
}
