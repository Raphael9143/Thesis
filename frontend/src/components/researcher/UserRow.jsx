import React from 'react';
import RoleBadge from './RoleBadge';

function getInitials(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function UserRow({ user, role }) {
  if (!user) return null;
  const initials = getInitials(user.full_name);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
      <div
        aria-hidden
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e5e7eb 0%, #cbd5e1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
          color: '#111827',
        }}
        title={user.full_name}
      >
        {initials}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          justifyContent: 'space-between',
          flex: 1,
        }}
      >
        <div>
          <div style={{ fontWeight: 600 }}>{user.full_name}</div>
        </div>
        <RoleBadge role={role} />
      </div>
    </div>
  );
}
