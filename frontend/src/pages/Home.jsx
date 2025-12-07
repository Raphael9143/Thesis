import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import NotificationPopup from '../components/ui/NotificationPopup';
import userAPI from '../../services/userAPI';
import TeacherHome from './teacher/Home';
import StudentHome from './student/Home';
import ResearcherHomePage from './researcher/Home';
import useTitle from '../hooks/useTitle';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(() => sessionStorage.getItem('role')?.toLowerCase() || '');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMsg, _setNotifyMsg] = useState('');
  const [notifyType, _setNotifyType] = useState('info');

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

  useTitle('Dashboard');

  // Redirect admin to admin dashboard
  useEffect(() => {
    if (role === 'admin' && location.pathname.startsWith('/education')) {
      navigate('/education/admin/dashboard', { replace: true });
    }
  }, [role, location.pathname, navigate]);

  // Determine if we're in education portal or researcher dashboard
  const isEducationPortal = location.pathname.startsWith('/education');
  const isResearcherDashboard = location.pathname.startsWith('/researcher');

  const goToEducation = () => navigate('/education');

  const content = () => {
    if (!role) {
      return (
        <Card title="Role not set" subtitle="Access your personalized dashboard by logging in.">
          <div className="display-flex gap-12">
            <button className="btn btn-primary btn-sm" onClick={goToEducation}>
              Go to Education Login
            </button>
            <button className="btn" onClick={() => navigate('/')}>
              Back to Research Portal
            </button>
          </div>
        </Card>
      );
    }

    // Researcher dashboard always shows researcher home
    if (isResearcherDashboard) return <ResearcherHomePage />;

    // Education portal shows role-specific content
    if (isEducationPortal) {
      if (role === 'teacher') return <TeacherHome />;
      if (role === 'student') return <StudentHome />;
    }

    // Fallback
    return <Card title="Unknown role">Your role &quot;{role}&quot; is not recognized.</Card>;
  };

  return (
    <div>
      <Section>{content()}</Section>

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
