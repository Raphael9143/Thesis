import React from 'react';

export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="login-register-container">
      <h2 style={{ textAlign: 'center', marginBottom: 8 }}>{title}</h2>
      {subtitle && (
        <p style={{ textAlign: 'center', color: '#555', marginBottom: 16 }}>{subtitle}</p>
      )}
      {children}
    </div>
  );
}
