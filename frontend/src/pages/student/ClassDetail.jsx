import React from 'react';
import { Outlet } from 'react-router-dom';
import CourseTabs from '../../components/layout/CourseTabs';
import '../../assets/styles/ui.css';
import '../../assets/styles/pages/ClassDetail.css';

export default function StudentClassDetailPage() {
  return (
    <div className="class-detail-parent">
      <CourseTabs />
      <div className="class-detail-child">
        <Outlet />
      </div>
    </div>
  );
}
