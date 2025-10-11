import React from 'react';
import '../../assets/styles/ui.css';
import '../../assets/styles/components/ui/Card.css';
import Card from '../../components/ui/Card';

export default function StudentHome() {
  return (
    <>
      <Card title="Your learning" subtitle="Track progress and assignments">
        <p>Welcome! Join a class to see assignments.</p>
        <button className="btn btn-primary">Join class</button>
      </Card>
      <Card title="Practice">
        <button className="btn">Start OCL exercises</button>
      </Card>
    </>
  );
}
