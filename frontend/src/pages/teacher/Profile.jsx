import React, { useEffect, useState } from 'react';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import FormField from '../../components/ui/FormField';
import NotificationPopup from '../../components/ui/NotificationPopup';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/pages/profile.css';
import useTitle from '../../hooks/useTitle';

export default function TeacherProfile() {
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [fixedAvatar, setFixedAvatar] = useState(null);
  const [editing, setEditing] = useState(false);
  const [courses, setCourses] = useState([]);

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
  const [teacherCode, setTeacherCode] = useState('');
  const [department, setDepartment] = useState('');

  useTitle('Profile');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await userAPI.getTeacherProfile();
        if (res?.success) {
          setProfile(res.data);
          const p = res.data;
          setFullName(p.full_name || '');
          setDob(p.dob ? String(p.dob).substring(0, 10) : '');
          setGender((p.gender || '').toString().toUpperCase());
          setPhoneNumber(p.phone_number || '');
          setAddress(p.address || '');
          setTeacherCode(p.teacher_code || '');
          setDepartment(p.department || '');
          // Capture a fixed frontend-only avatar URL on first load
          try {
            if (!fixedAvatar) {
              const ui =
                'https://ui-avatars.com/api/?name=' + encodeURIComponent(p.full_name || 'User');
              setFixedAvatar(ui);
            }
          } catch (err) {
            console.warn('Failed to compute fixed avatar', err);
          }
          // Load courses taught
          try {
            const coursesRes = await userAPI.getTeacherCourses();
            if (coursesRes?.success && Array.isArray(coursesRes.data)) {
              setCourses(coursesRes.data);
            } else {
              setCourses([]);
            }
          } catch (err) {
            console.warn('Failed to load teacher courses', err);
            setCourses([]);
          }
        } else {
          setError(res?.message || 'Failed to load profile');
        }
      } catch (e) {
        const msg = e?.response?.data?.message || 'Please fill in all the fields correctly!';
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
      // Do not allow updating teacher_code from UI; keep it immutable
      await userAPI.updateTeacherProfile({
        department,
      });
      const res = await userAPI.getTeacherProfile();
      if (res?.success) {
        setProfile(res.data);
        setEditing(false);
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
    fixedAvatar ||
    'https://ui-avatars.com/api/?name=' +
      encodeURIComponent((profile && profile.full_name) || 'User');

  return (
    <Section title="Teacher Profile" subtitle="Your account details">
      {loading && <Card>Loading...</Card>}
      {/* Errors are shown via NotificationPopup */}
      {profile && !loading && (
        <div className="profile teacher-profile">
          <Card title="Courses taught" className="teacher-profile__courses">
            {Array.isArray(courses) && courses.length > 0 ? (
              <div className="courses-grid">
                {courses.map((course) => {
                  const status = String(course.status || '').toUpperCase();
                  const statusClass = status === 'ACTIVE' ? 'status-active' : 'status-inactive';
                  return (
                    <div key={course.id || course.code} className={`course-card ${statusClass}`}>
                      <div className="course-title">
                        {course.name || course.course_name || `Course ${course.id || course.code}`}
                      </div>
                      <div className="course-meta">
                        <span className="semester">
                          {course.semester ? `Semester ${course.semester}` : course.term || ''}
                        </span>
                        <span className={`status ${statusClass}`}>{status || 'UNKNOWN'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No courses yet.</p>
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
                    <button
                      className="btn btn-primary btn-sm edit-btn"
                      onClick={() => setEditing(true)}
                    >
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
                        setTeacherCode(profile.teacher_code || '');
                        setDepartment(profile.department || '');
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
                    <FormField
                      label="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <FormField
                      label="Date of Birth"
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
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
                    <FormField
                      label="Address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <FormField label="Teacher Code" value={teacherCode} readOnly />
                    <FormField
                      label="Department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
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
                    <FormField label="Teacher Code" value={profile.teacher_code || ''} readOnly />
                    <FormField label="Department" value={profile.department || ''} readOnly />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Notification popup for errors */}
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
