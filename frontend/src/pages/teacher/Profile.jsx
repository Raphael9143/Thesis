import { useEffect, useState } from 'react';
import Section from '../../components/ui/Section';
import FormField from '../../components/ui/FormField';
import { useNotifications } from '../../contexts/NotificationContext';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/pages/profile.css';
import useTitle from '../../hooks/useTitle';

export default function TeacherProfile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const { push } = useNotifications();

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [aboutEditing, setAboutEditing] = useState(false);

  useTitle('Profile');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await userAPI.getTeacherProfile();
        if (res?.success) {
          const p = res.data;
          setProfile(p);
          setFullName(p.full_name || '');
          // Normalize DOB to datetime-local (YYYY-MM-DDTHH:MM) for input
          if (p.dob) {
            const s = String(p.dob);
            setDob(s.includes('T') ? s.substring(0, 16) : `${s.substring(0, 10)}T00:00`);
          } else {
            setDob('');
          }
          setGender((p.gender || '').toString().toUpperCase());
          setPhoneNumber(p.phone_number || '');
          setAddress(p.address || '');
          setTeacherCode(p.teacher_code || '');
          setDepartment(p.department || '');
          setDescription(p.description || '');
        } else {
          push({ title: 'Error', body: res?.message || 'Failed to load profile', type: 'error' });
        }
      } catch (e) {
        push({
          title: 'Error',
          body: e?.response?.data?.message || 'Failed to load profile',
          type: 'error',
        });
      }
      setLoading(false);
    };

    load();
  }, [push]);

  const onSave = async () => {
    setLoading(true);
    try {
      await userAPI.updateProfile({
        full_name: fullName,
        dob,
        gender: (gender || '').toString().toUpperCase(),
        phone_number: phoneNumber,
        address,
      });
      // update teacher-specific metadata
      try {
        await userAPI.updateTeacherProfile({
          department: department || null,
          description: description || null,
        });
      } catch (e) {
        console.warn('Failed to update teacher metadata', e);
      }
      const res = await userAPI.getTeacherProfile();
      if (res?.success) {
        setProfile(res.data);
        setEditing(false);
        sessionStorage.setItem('full_name', fullName || res.data.full_name || '');
        push({ title: 'Success', body: 'Profile updated successfully', type: 'success' });
      } else {
        push({ title: 'Error', body: res?.message || 'Failed to update', type: 'error' });
      }
    } catch (e) {
      push({
        title: 'Error',
        body: e?.response?.data?.message || 'Failed to update profile',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const avatarSrc = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName || 'User');

  if (loading && !profile) {
    return (
      <Section>
        <div className="profile-card">
          <div className="profile-body">Loading...</div>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <div className="profile">
        <div className="profile-top">
          {/* Top main info card */}
          <div className="profile-card">
            <div className="profile-body">
              <div className="profile-info">
                <img src={avatarSrc} alt="Avatar" className="profile-avatar" />
                <h3 className="profile-name">{fullName || 'Teacher'}</h3>
                <p className="profile-role">Teacher</p>
                <div className="profile-details">
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{profile?.email || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Teacher Code:</span>
                    <span className="detail-value">{teacherCode || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Department:</span>
                    <span className="detail-value">{department || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description card (beside avatar) */}
          <div className="profile-card description-card">
            <div className="profile-body">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h4 style={{ margin: 0 }}>About</h4>
                {!aboutEditing && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setDescription(profile?.description || '');
                      setAboutEditing(true);
                    }}
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {aboutEditing ? (
                <div style={{ marginTop: 8 }}>
                  <textarea
                    className="profile-description"
                    rows={6}
                    style={{ width: '100%', resize: 'vertical' }}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={loading}
                      onClick={async () => {
                        setLoading(true);
                        try {
                          if ((profile?.full_name || '') !== (fullName || '')) {
                            await userAPI.updateProfile({ full_name: fullName });
                          }
                          await userAPI.updateTeacherProfile({
                            description: description || null,
                            department: department || null,
                          });
                          const refreshed = await userAPI.getTeacherProfile();
                          if (refreshed?.success) {
                            setProfile(refreshed.data);
                            setDescription(refreshed.data.description || '');
                            sessionStorage.setItem(
                              'full_name',
                              fullName || refreshed.data.full_name || ''
                            );
                          }
                          setAboutEditing(false);
                          push({ title: 'Success', body: 'About updated', type: 'success' });
                        } catch (e) {
                          push({
                            title: 'Error',
                            body: e?.response?.data?.message || 'Failed to update about',
                            type: 'error',
                          });
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      <i className="fa-solid fa-floppy-disk"></i>
                      <span>Save</span>
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={loading}
                      onClick={() => {
                        setAboutEditing(false);
                        setDescription(profile?.description || '');
                      }}
                    >
                      <i className="fa-solid fa-x"></i>
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="profile-description">{profile?.description || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Editable personal info card */}
        <div className="profile-card">
          <div className="profile-body">
            <div className="info-profile-header">
              <h4 style={{ margin: 0 }}>Personal Information</h4>
              {!editing && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    const p = profile || {};
                    setFullName(p.full_name || '');
                    if (p.dob) {
                      const s = String(p.dob);
                      setDob(s.includes('T') ? s.substring(0, 16) : `${s.substring(0, 10)}T00:00`);
                    } else {
                      setDob('');
                    }
                    setGender((p.gender || '').toString().toUpperCase());
                    setPhoneNumber(p.phone_number || '');
                    setAddress(p.address || '');
                    setDepartment(p.department || '');
                    setEditing(true);
                  }}
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                  <span>Edit</span>
                </button>
              )}
            </div>

            {editing ? (
              <div className="editing-info">
                <FormField
                  label="Full Name"
                  name="full_name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <FormField
                  label="Date of Birth"
                  name="dob"
                  type="date"
                  value={dob ? String(dob).substring(0, 10) : ''}
                  onChange={(e) => {
                    const date = e.target.value;
                    setDob(date ? `${date}` : '');
                  }}
                />

                <FormField
                  label="Gender"
                  name="gender"
                  options={[
                    { value: '', label: 'Select' },
                    { value: 'MALE', label: 'Male' },
                    { value: 'FEMALE', label: 'Female' },
                    { value: 'OTHER', label: 'Other' },
                  ]}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                />

                <FormField
                  label="Phone Number"
                  name="phone_number"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />

                <FormField
                  label="Address"
                  name="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />

                <FormField
                  label="Department"
                  name="department"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />

                <div className="save-profile-buttons">
                  <button className="btn btn-primary btn-sm" onClick={onSave} disabled={loading}>
                    <i className="fa-solid fa-floppy-disk" />
                    <span>{loading ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setEditing(false);
                      const p = profile;
                      setFullName(p.full_name || '');
                      if (p.dob) {
                        const s = String(p.dob);
                        setDob(
                          s.includes('T') ? s.substring(0, 16) : `${s.substring(0, 10)}T00:00`
                        );
                      } else {
                        setDob('');
                      }
                      setGender((p.gender || '').toString().toUpperCase());
                      setPhoneNumber(p.phone_number || '');
                      setAddress(p.address || '');
                      setDepartment(p.department || '');
                    }}
                    disabled={loading}
                  >
                    <i className="fa-solid fa-x" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-details">
                <div className="detail-row">
                  <span className="detail-label">Full Name:</span>
                  <span className="detail-value">{fullName || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date of Birth:</span>
                  <span className="detail-value">{dob.split('T')[0] || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Gender:</span>
                  <span className="detail-value">
                    {gender === 'MALE' ? 'Male' : gender === 'FEMALE' ? 'Female' : gender || '-'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone Number:</span>
                  <span className="detail-value">{phoneNumber || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{address || '-'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
