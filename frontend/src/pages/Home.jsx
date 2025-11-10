import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import NotificationPopup from '../components/ui/NotificationPopup';
import userAPI from '../../services/userAPI';
import AdminHome from './admin/Home';
import TeacherHome from './teacher/Home';
import StudentHome from './student/Home';
import ResearcherHomePage from './researcher/Home';
import { usePageInfo } from '../contexts/PageInfoContext';

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

  const { setTitle: setPageTitle } = usePageInfo();
  useEffect(() => {
    try {
      setPageTitle('Home');
    } catch (_) {}
  }, [setPageTitle]);

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
          <div className="display-flex gap-12">
            <button className="btn btn-primary" onClick={goToEducation}>
              Go to Education Login
            </button>
            <button className="btn" onClick={() => navigate('/')}>
              Back to Research Portal
            </button>
          </div>
        </Card>
      );
    }
    if (role === 'admin') return <AdminHome />;
    if (role === 'teacher') return <TeacherHome />;
    if (role === 'student') return <StudentHome />;
    if (role === 'researcher') return <ResearcherHomePage />;
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
