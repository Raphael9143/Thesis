import React, { useEffect, useState } from 'react';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import FormField from '../../components/ui/FormField';
import NotificationPopup from '../../components/ui/NotificationPopup';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/pages/teacher/profile.css';

export default function StudentProfile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);

  // notifications
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [notifyType, setNotifyType] = useState('error');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await userAPI.getStudentProfile();
        if (res?.success) {
          setProfile(res.data);
        } else {
          const msg = res?.message || 'Failed to load profile';
          setError(msg);
          setNotifyMsg(msg);
          setNotifyType('error');
          setNotifyOpen(true);
        }
      } catch (e) {
        const msg = e?.response?.data?.message || 'Failed to load profile';
        setError(msg);
        setNotifyMsg(msg);
        setNotifyType('error');
        setNotifyOpen(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Section title="Student Profile" subtitle="Your account details">
      {loading && <Card>Loading...</Card>}
      {profile && !loading && (
        <div className="profile student-profile">
          <Card title="Enrolled classes" className="teacher-profile__courses">
            {Array.isArray(profile.enrolled_classes) && profile.enrolled_classes.length > 0 ? (
              <ul>
                {profile.enrolled_classes.map((c) => (
                  <li key={c}>Class #{c}</li>
                ))}
              </ul>
            ) : (
              <p>No classes yet.</p>
            )}
          </Card>

          <section className="profile-card">
            <div className="profile-body">
              <div className="profile-info">
                <div className="profile-info-section">
                  <img
                    src={profile.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.full_name || 'User')}
                    alt="Profile"
                    className="profile-pic"
                  />
                  <div>
                    <h3>{profile.full_name}</h3>
                    <p>{profile.email}</p>
                  </div>
                </div>
              </div>

              <div className="profile-form" style={{ marginTop: 20 }}>
                <div className="form-row">
                  <FormField label="Full Name" value={profile.full_name || ''} readOnly />
                </div>
                <div className="form-row">
                  <FormField label="Date of Birth" value={profile.dob ? String(profile.dob).substring(0, 10) : ''} readOnly />
                  <FormField label="Gender" value={(profile.gender || '').toString()} readOnly />
                </div>
                <div className="form-row">
                  <FormField label="Phone Number" value={profile.phone_number || ''} readOnly />
                  <FormField label="Address" value={profile.address || ''} readOnly />
                </div>
                <div className="form-row">
                  <FormField label="Student Code" value={profile.student_code || ''} readOnly />
                  <FormField label="Major" value={profile.major || ''} readOnly />
                </div>
                <div className="form-row">
                  <FormField label="Year" value={String(profile.year ?? '')} readOnly />
                  <FormField label="Completed Assignments" value={String(profile.completed_assignments ?? '0')} readOnly />
                </div>
              </div>
            </div>
          </section>

          <NotificationPopup
            message={notifyMsg}
            open={notifyOpen}
            type={notifyType}
            onClose={() => setNotifyOpen(false)}
          />
        </div>
      )}
    </Section>
  );
}
