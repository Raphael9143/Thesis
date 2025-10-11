import React from 'react';
import '../../assets/styles/ui.css';
import '../../assets/styles/components/ui/Card.css';
import Card from '../../components/ui/Card';

export default function TeacherHome() {
  return (
    <>
      <Card title="Your classes" subtitle="Manage and review assignments">
        <p>No classes yet. Create one to get started.</p>
        <button className="btn btn-primary">Create class</button>
      </Card>
      <Card title="Resources">
        <ul>
          <li>UML/OCL teaching materials</li>
          <li>Sample projects</li>
        </ul>
      </Card>
    </>
  );
}
