import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import '../assets/styles/components/ui/Tabs.css';

export default function AdminLayout() {
  return (
    <div>
      <Outlet />
    </div>
  );
}
