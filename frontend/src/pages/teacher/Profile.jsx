import React, { useEffect, useState } from 'react';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/pages/teacher/profile.css';

export default function TeacherProfile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await userAPI.getTeacherProfile();
        if (res?.success) {
          setProfile(res.data);
        } else {
          setError(res?.message || 'Failed to load profile');
        }
      } catch (e) {
        setError(e?.response?.data?.message || 'Server error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Section title="Teacher Profile" subtitle="Your account details">
      {loading && <Card>Loading...</Card>}
      {error && !loading && <Card title="Error"><p>{error}</p></Card>}
      {profile && !loading && (
        <>
          <Card title={profile.full_name} subtitle={profile.email}>
            <div className="teacher-profile__header">
              <img
                src={profile.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.full_name || 'User')}
                alt="avatar"
                className="teacher-profile__avatar"
              />
              <div className="teacher-profile__meta">
                <p><strong>Role:</strong> {profile.role}</p>
                <p><strong>Teacher Code:</strong> {profile.teacher_code || '-'}</p>
                <p><strong>Department:</strong> {profile.department || '-'}</p>
                <p><strong>Status:</strong> {profile.status || '-'}</p>
              </div>
            </div>
          </Card>
          <Card title="Courses taught" className="teacher-profile__courses">
            {Array.isArray(profile.courses_taught) && profile.courses_taught.length > 0 ? (
              <ul>
                {profile.courses_taught.map((c) => (
                  <li key={c}>Course #{c}</li>
                ))}
              </ul>
            ) : (
              <p>No courses yet.</p>
            )}
          </Card>
        </>
      )}
    </Section>
  );
}
