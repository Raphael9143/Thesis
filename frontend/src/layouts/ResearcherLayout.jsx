import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import '../assets/styles/ui.css';
import ResearcherSidebar from '../components/layout/ResearcherSidebar';
import { usePageInfo } from '../contexts/PageInfoContext';

export default function ResearcherLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const wrapperClass = `app-bg app-with-sidebar${collapsed ? ' collapsed' : ''}`;
  return (
    <div className={wrapperClass}>
      <ResearcherSidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
      <div className="app-container">
        <ResearcherPageInfoBar />
        <Outlet />
      </div>
    </div>
  );
}

function ResearcherPageInfoBar() {
  const { title } = usePageInfo();
  return (
    <div className="page-info" aria-hidden={title ? 'false' : 'true'}>
      <div className="page-info__title">{title || ''}</div>
    </div>
  );
}
