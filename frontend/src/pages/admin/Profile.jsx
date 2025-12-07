import { useEffect, useState } from 'react';
import Section from '../../components/ui/Section';
import FormField from '../../components/ui/FormField';
import { useNotifications } from '../../contexts/NotificationContext';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/pages/profile.css';
import useTitle from '../../hooks/useTitle';

export default function AdminProfile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const { push } = useNotifications();

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  useTitle('Profile');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await userAPI.getProfile();
        if (res?.success) {
          const p = res.data.user;
          setProfile(p);
          setFullName(p.full_name || '');
          if (p.dob) {
            const s = String(p.dob);
            let formattedDob = '';
            if (s.includes('T')) {
              formattedDob = s.substring(0, 16);
            } else {
              formattedDob = `${s.substring(0, 10)}T00:00`;
            }
            setDob(formattedDob);
          } else {
            setDob('');
          }
          setGender((p.gender || '').toString().toUpperCase());
          setPhoneNumber(p.phone_number || '');
          setAddress(p.address || '');
        } else {
          push({ title: 'Error', body: res?.message || 'Failed to load profile', type: 'error' });
        }
      } catch (e) {
        push({
          title: 'Error',
          body: e?.response?.data?.message || 'Failed to load profile',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
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
      const res = await userAPI.getProfile();
      if (res?.success) {
        const p = res.data.user;
        setProfile(p);
        setEditing(false);
        sessionStorage.setItem('full_name', fullName || p.full_name || '');
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
        <div className="profile-card">
          <div className="profile-body">
            <div className="profile-info">
              <img src={avatarSrc} alt="Avatar" className="profile-avatar" />
              <h3 className="profile-name">{fullName || 'Admin'}</h3>
              <p className="profile-role">Administrator</p>
              <div className="profile-details">
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{profile?.email || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                      const formattedDob = s.includes('T')
                        ? s.substring(0, 16)
                        : `${s.substring(0, 10)}T00:00`;
                      setDob(formattedDob);
                    } else {
                      setDob('');
                    }
                    setGender((p.gender || '').toString().toUpperCase());
                    setPhoneNumber(p.phone_number || '');
                    setAddress(p.address || '');
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
                    setDob(date ? `${date}T00:00` : '');
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

                <div className="save-profile-buttons">
                  <button className="btn btn-primary btn-sm" onClick={onSave} disabled={loading}>
                    <i className="fa-solid fa-floppy-disk" />
                    <span>{loading ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setEditing(false);
                      const p = profile || {};
                      setFullName(p.full_name || '');
                      if (p.dob) {
                        const s = String(p.dob);
                        const formattedDob = s.includes('T')
                          ? s.substring(0, 16)
                          : `${s.substring(0, 10)}T00:00`;
                        setDob(formattedDob);
                      } else {
                        setDob('');
                      }
                      setGender((p.gender || '').toString().toUpperCase());
                      setPhoneNumber(p.phone_number || '');
                      setAddress(p.address || '');
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
