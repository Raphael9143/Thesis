import { useEffect, useState } from 'react';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import FormField from '../../components/ui/FormField';
import NotificationPopup from '../../components/ui/NotificationPopup';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/pages/profile.css';
import useTitle from '../../hooks/useTitle';

export default function StudentProfile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [fixedAvatar, setFixedAvatar] = useState(null);
  const [editing, setEditing] = useState(false);

  // notifications
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [notifyType, setNotifyType] = useState('error');

  // editable state
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');

  useTitle('Profile');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await userAPI.getStudentProfile();
        if (res?.success) {
          setProfile(res.data);
          const p = res.data;
          // Capture a fixed frontend-only avatar URL on first load
          try {
            if (!fixedAvatar) {
              const ui = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(p.full_name || 'User');
              setFixedAvatar(ui);
            }
          } catch (err) {
            console.warn('Failed to compute fixed avatar', err);
          }
          console.log('Loaded profile', p);
          setFullName(p.full_name || '');
          setDob(p.dob ? String(p.dob).substring(0, 10) : '');
          setGender((p.gender || '').toString().toUpperCase());
          setPhoneNumber(p.phone_number || '');
          setAddress(p.address || '');
          setStudentCode(p.student_code || '');
          setMajor(p.major || '');
          setYear(p.year != null ? String(p.year) : '');
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
  }, [fixedAvatar]);

  const onSave = async () => {
    setLoading(true);
    setError('');
    try {
      // Primary auth profile update (do NOT send avatar_url to backend; avatar is frontend-only)
      await userAPI.updateProfile({
        full_name: fullName,
        dob,
        gender: (gender || '').toString().toUpperCase(),
        phone_number: phoneNumber,
        address,
      });
      // Student-specific update (student_code stays read-only)
      await userAPI.updateStudentProfile({
        major,
        year: year ? Number(year) : undefined,
      });
      const res = await userAPI.getStudentProfile();
      if (res?.success) {
        setProfile(res.data);
        setEditing(false);
        setNotifyMsg('Profile updated successfully');
        setNotifyType('success');
        setNotifyOpen(true);
        // Update session storage for navbar display: keep avatar fixed and frontend-only
        try {
          sessionStorage.setItem('full_name', fullName || res.data.full_name || '');
        } catch (err) {
          console.warn('Failed to write sessionStorage full_name', err);
        }
      }
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to update profile';
      setError(msg);
      setNotifyMsg(msg);
      setNotifyType('error');
      setNotifyOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const avatarSrc =
    fixedAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent((profile && profile.full_name) || 'User');

  if (error) {
    return (
      <Section title="Student Profile" subtitle="Your account details">
        <Card>
          <div className="text-error">Error: {error}</div>
        </Card>
      </Section>
    );
  }
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
                  <img src={avatarSrc} alt="Profile" className="profile-pic" />
                  <div>
                    <h3>{editing ? fullName : profile.full_name}</h3>
                    <p>{profile.email}</p>
                  </div>
                </div>
                {!editing ? (
                  <div className="edit-actions-btns">
                    <button className="btn btn-primary btn-sm edit-btn" onClick={() => setEditing(true)}>
                      Edit
                    </button>
                  </div>
                ) : (
                  <div className="edit-actions-btns">
                    <button
                      className="btn btn-signin cancel-btn"
                      onClick={() => {
                        setEditing(false);
                        setFullName(profile.full_name || '');
                        setDob(profile.dob ? String(profile.dob).substring(0, 10) : '');
                        setGender((profile.gender || '').toString().toUpperCase());
                        setPhoneNumber(profile.phone_number || '');
                        setAddress(profile.address || '');
                        setStudentCode(profile.student_code || '');
                        setMajor(profile.major || '');
                        setYear(profile.year != null ? String(profile.year) : '');
                      }}
                    >
                      Cancel
                    </button>
                    <button className="btn btn-primary btn-sm save-btn" onClick={onSave}>
                      Save
                    </button>
                  </div>
                )}
              </div>

              {editing && (
                <form
                  className="profile-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    onSave();
                  }}
                >
                  <div className="form-row">
                    <FormField label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="form-row">
                    <FormField label="Date of Birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                    <FormField
                      label="Gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      options={[
                        { value: '', label: 'Select' },
                        { value: 'MALE', label: 'Male' },
                        { value: 'FEMALE', label: 'Female' },
                        { value: 'OTHER', label: 'Other' },
                      ]}
                    />
                  </div>
                  <div className="form-row">
                    <FormField
                      label="Phone Number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <FormField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="form-row">
                    <FormField label="Student Code" value={studentCode} readOnly />
                    <FormField label="Major" value={major} onChange={(e) => setMajor(e.target.value)} />
                  </div>
                  <div className="form-row">
                    <FormField label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
                  </div>
                </form>
              )}

              {!editing && (
                <div className="profile-form">
                  <div className="form-row">
                    <FormField label="Full Name" value={profile.full_name || ''} readOnly />
                  </div>
                  <div className="form-row">
                    <FormField
                      label="Date of Birth"
                      value={profile.dob ? String(profile.dob).substring(0, 10) : ''}
                      readOnly
                    />
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
                    <FormField
                      label="Completed Assignments"
                      value={String(profile.completed_assignments ?? '0')}
                      readOnly
                    />
                  </div>
                </div>
              )}
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
