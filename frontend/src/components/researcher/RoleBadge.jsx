import React from 'react';

export default function RoleBadge({ role }) {
  const styles = {
    Owner: { bg: 'rgba(245, 158, 11, 0.12)', color: '#b45309', border: '1px solid rgba(245,158,11,0.35)' },
    Moderator: { bg: 'rgba(59, 130, 246, 0.12)', color: '#1d4ed8', border: '1px solid rgba(59,130,246,0.35)' },
    Contributor: { bg: 'rgba(16, 185, 129, 0.12)', color: '#047857', border: '1px solid rgba(16,185,129,0.35)' },
  }[role] || { bg: 'rgba(107, 114, 128, 0.12)', color: '#374151', border: '1px solid rgba(107,114,128,0.35)' };

  return (
    <span
      style={{
        fontSize: 12,
        padding: '2px 8px',
        borderRadius: 999,
        background: styles.bg,
        color: styles.color,
        border: styles.border,
        whiteSpace: 'nowrap',
      }}
    >
      {role}
    </span>
  );
}
