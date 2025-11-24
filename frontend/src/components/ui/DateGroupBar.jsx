import React from 'react';

export default function DateGroupBar({ dateLabel, count, collapsed = false, onToggle }) {
  return (
    <div
      className={`date-group-bar ${collapsed ? 'collapsed' : ''}`}
      onClick={() => onToggle && onToggle()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onToggle && onToggle();
      }}
    >
      <div className="date-group-left">{dateLabel}</div>
      <div className="date-group-right">
        {count} item{count !== 1 ? 's' : ''} <span className="caret">{collapsed ? '▸' : '▾'}</span>
      </div>
    </div>
  );
}
