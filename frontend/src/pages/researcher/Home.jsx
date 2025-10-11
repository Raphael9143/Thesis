import React from 'react';
import '../../assets/styles/ui.css';
import '../../assets/styles/components/ui/Card.css';
import Card from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';

export default function ResearcherHomePage() {
  const navigate = useNavigate();
  return (
    <>
      <Card title="Explore datasets" subtitle="Collaborate and validate models">
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go to Research Portal</button>
      </Card>
    </>
  );
}
