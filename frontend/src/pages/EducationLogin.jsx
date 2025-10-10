import React from 'react';
import { Link } from 'react-router-dom';
import AuthForm from '../components/auth/AuthForm';
import '../assets/styles/auth.css';
import '../assets/styles/ui.css';

export default function EducationLogin() {
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
        />
      </div>
      </div>
    </div>
  );
}
