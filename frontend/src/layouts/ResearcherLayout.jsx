import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import '../assets/styles/ui.css';
import ResearcherSidebar from '../components/layout/ResearcherSidebar';

export default function ResearcherLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const wrapperClass = `app-bg app-with-sidebar${collapsed ? ' collapsed' : ''}`;
  return (
    <div className={wrapperClass}>
      <ResearcherSidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
      <div className="app-container">
        <Outlet />
      </div>
    </div>
  );
}
