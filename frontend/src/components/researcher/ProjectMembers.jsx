import React from 'react';
import UserRow from './UserRow';

export default function ProjectMembers({ members }) {
  return (
    <div style={{ textAlign: 'left' }}>
      <div className="font-700" style={{ marginBottom: 8 }}>
        Contributors
      </div>
      {members ? (
        <div>
          <div style={{ marginBottom: 12 }}>
            {members.owner ? <UserRow user={members.owner} role="Owner" /> : <div>-</div>}
          </div>

          <div style={{ margin: '12px 0' }}>
            {Array.isArray(members.moderators) && members.moderators.length > 0 ? (
              members.moderators.map((m) => <UserRow key={m.id} user={m} role="Moderator" />)
            ) : (
              <div></div>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            {Array.isArray(members.contributors) && members.contributors.length > 0 ? (
              members.contributors.map((m) => <UserRow key={m.id} user={m} role="Contributor" />)
            ) : (
              <div></div>
            )}
          </div>
        </div>
      ) : (
        <div>Loading members...</div>
      )}
    </div>
  );
}
