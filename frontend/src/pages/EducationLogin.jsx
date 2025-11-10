import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '../components/auth/AuthForm';
import NotificationPopup from '../components/ui/NotificationPopup';
import '../assets/styles/auth.css';
import '../assets/styles/ui.css';
import { useNotifications } from '../contexts/NotificationContext';

export default function EducationLogin() {
  const navigate = useNavigate();
  const { push } = useNotifications();
  useEffect(() => {
    // if already logged in, redirect to education home
    try {
      if (sessionStorage.getItem('isLogin') === 'true') {
        navigate('/education/home');
      }
    } catch (err) {
      console.error('Failed to check login status', err);
    }
  }, [navigate]);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [notifyType, setNotifyType] = useState('info');

  const handleSuccess = () => {
    // Redirect to role-based home
    navigate('/education/home');
    setNotifyMsg('Login successful! Redirecting to Education Home...');
    setNotifyType('success');
    setNotifyOpen(true);
    try {
      push({ title: 'Login Successful', body: 'Welcome to the Education Portal!' });
    } catch (pushErr) {
      console.warn('Notification push error', pushErr);
    }
  };

  return (
    <div className="auth-viewport">
      <div className="auth-2col">
        <div className="auth-2col-left">
          <div className="auth-left-content">
            <h2>Exploring OCL & UML?</h2>
            <p>
              <span>
                <Link to="/" className="navigate-community">
                  Research Portal
                </Link>
              </span>{' '}
              helps you collaborate, analyze, and validate models.
            </p>
          </div>
        </div>

        <div className="auth-2col-right">
          <AuthForm
            type="login"
            roles={[
              { value: 'student', label: 'Student' },
              { value: 'teacher', label: 'Teacher' },
            ]}
            title="Education Login"
            onSuccess={handleSuccess}
          />
        </div>
      </div>
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
