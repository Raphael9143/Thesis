import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import NotificationPopup from '../components/ui/NotificationPopup';
import userAPI from '../../services/userAPI';

export default function Home() {
  const navigate = useNavigate();
  const [role, setRole] = useState(() => sessionStorage.getItem('role')?.toLowerCase() || '');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [notifyType, setNotifyType] = useState('info');

  // Attempt to hydrate role from profile if missing
  useEffect(() => {
    const hydrate = async () => {
      if (role) return;
      try {
        const res = await userAPI.getProfile();
        const r = (res?.data?.user?.role || '').toString().toLowerCase();
        if (r) {
          sessionStorage.setItem('role', r);
          setRole(r);
        }
      } catch {
        // ignore
      }
    };
    hydrate();
  }, [role]);

  const title = useMemo(() => {
    switch (role) {
      case 'admin':
        return 'Admin Home';
      case 'teacher':
        return 'Teacher Home';
      case 'student':
        return 'Student Home';
      case 'researcher':
        return 'Researcher Home';
      default:
        return 'Welcome';
    }
  }, [role]);

  const subtitle = useMemo(() => {
    if (!role) return 'Please log in to see role-specific content.';
    return `You are signed in as ${role}.`;
  }, [role]);

  const goToEducation = () => navigate('/education');

  const content = () => {
    if (!role) {
      return (
        <Card title="Role not set" subtitle="Access your personalized dashboard by logging in.">
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" onClick={goToEducation}>Go to Education Login</button>
            <button className="btn" onClick={() => navigate('/')}>Back to Research Portal</button>
          </div>
        </Card>
      );
    }
    if (role === 'admin') {
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
    if (role === 'teacher') {
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
    if (role === 'student') {
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
    if (role === 'researcher') {
      return (
        <>
          <Card title="Explore datasets" subtitle="Collaborate and validate models">
            <button className="btn btn-primary" onClick={() => navigate('/')}>Go to Research Portal</button>
          </Card>
        </>
      );
    }
    return <Card title="Unknown role">Your role "{role}" is not recognized.</Card>;
  };

  return (
    <div>
      <Section title={title} subtitle={subtitle}>
        {content()}
      </Section>

      <NotificationPopup
        message={notifyMsg}
        open={notifyOpen}
        type={notifyType}
        duration={3000}
        onClose={() => setNotifyOpen(false)}
      />
    </div>
  );
}
