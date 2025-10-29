import React from 'react';

export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="login-register-container">
      <h2 className="text-center mb-8">{title}</h2>
      {subtitle && (
        <p className="text-center text-muted-2 mb-16">{subtitle}</p>
      )}
      {children}
    </div>
  );
}
