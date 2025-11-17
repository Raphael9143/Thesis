import React from 'react';
import '../../assets/styles/components/ui/Tabs.css';

export default function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`tabs-container ${className}`.trim()}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={`tab-button ${activeTab === tab.value ? 'active' : ''}`}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
