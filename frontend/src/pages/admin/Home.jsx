import React from 'react';
import '../../assets/styles/ui.css';
import '../../assets/styles/auth.css';
import '../../assets/styles/home.css';
import '../../assets/styles/pages/ResearcherHome.css';
import '../../assets/styles/components/ui/Card.css';
import Card from '../../components/ui/Card';

export default function AdminHome() {
  return (
    <>
      <Card title="Overview" subtitle="System stats and management">
        <ul>
          <li>Users management</li>
          <li>Classes oversight</li>
          <li>Content moderation</li>
        </ul>
      </Card>
      <Card title="Quick actions">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary">Invite user</button>
          <button className="btn">Review reports</button>
          <button className="btn">Settings</button>
        </div>
      </Card>
    </>
  );
}
