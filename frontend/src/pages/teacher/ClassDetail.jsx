import React from 'react';
import { Outlet } from 'react-router-dom';
import CourseTabs from '../../components/layout/CourseTabs';
import '../../assets/styles/ui.css';

export default function ClassDetailPage() {
  return (
    <div className="class-detail-parent">
      <CourseTabs />
      <div className="class-detail-child">
        <Outlet />
      </div>
    </div>
  );
}
