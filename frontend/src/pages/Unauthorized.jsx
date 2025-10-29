import React from 'react';
import Section from '../components/ui/Section';

export default function Unauthorized() {
  return (
    <Section title="Unauthorized" subtitle="You don't have permission to view this page.">
      <div className="p-20">
        <p>If you think this is a mistake, contact your administrator.</p>
      </div>
    </Section>
  );
}
