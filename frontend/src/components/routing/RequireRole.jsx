import React from 'react';
import { Navigate } from 'react-router-dom';

export default function RequireRole({ allowed = [], children }) {
  const role = (sessionStorage.getItem('role') || '').toString().toLowerCase();
  if (!role) {
    // if role missing, redirect to education home (which will hydrate if necessary)
    return <Navigate to="/education/home" replace />;
  }
  if (!allowed.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}
