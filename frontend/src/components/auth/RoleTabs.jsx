import React from 'react';

export default function RoleTabs({ role, onChange, options }) {
  return (
    <div className="tab-nav">
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)} className={role === opt.value ? 'active' : ''}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
