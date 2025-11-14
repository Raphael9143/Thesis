import React from 'react';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import '../../assets/styles/ui.css';

export default function ResearcherProfile() {
  const role = sessionStorage.getItem('role');
  const email = sessionStorage.getItem('email');
  return (
    <Section>
      <Card>
        <h4 style={{ marginTop: 0 }}>Profile</h4>
        <div>Role: {role || 'researcher'}</div>
        <div>Email: {email || '-'}</div>
      </Card>
    </Section>
  );
}
