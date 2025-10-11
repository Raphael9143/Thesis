import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '../components/auth/AuthForm';
import NotificationPopup from '../components/ui/NotificationPopup';
import '../assets/styles/auth.css';
import '../assets/styles/ui.css';

export default function EducationLogin() {
  const navigate = useNavigate();
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [notifyType, setNotifyType] = useState('info');

  const handleSuccess = () => {
    // Redirect to role-based home
    navigate('/home');
  };

  return (
    <div className="auth-viewport">
      <div className="auth-2col">
      <div className="auth-2col-left">
        <div className="auth-left-content">
          <h2>Exploring OCL & UML?</h2>
          <p>
            <span><Link to="/" className="navigate-community">Research Portal</Link></span> helps you collaborate, analyze, and validate models.
          </p>
        </div>
      </div>

      <div className="auth-2col-right">
        <AuthForm
          type="login"
          roles={[{ value: 'student', label: 'Student' }, { value: 'teacher', label: 'Teacher' }]}
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
