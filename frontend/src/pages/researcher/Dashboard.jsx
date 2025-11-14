import React from 'react';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import '../../assets/styles/ui.css';
import useTitle from '../../hooks/useTitle';

export default function ResearcherDashboard() {
  useTitle('Dashboard');
  return (
    <Section>
      <Card>
        <h4 style={{ marginTop: 0 }}>Researcher Dashboard</h4>
        <p>Welcome to your research workspace. Explore projects, datasets, and models.</p>
      </Card>
    </Section>
  );
}
