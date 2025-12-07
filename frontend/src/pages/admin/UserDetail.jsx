import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import userAPI from '../../../services/userAPI';
import useTitle from '../../hooks/useTitle';
import { useNotifications } from '../../contexts/NotificationContext';
import '../../assets/styles/ui.css';

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { push } = useNotifications();

  const isCreate = id === 'create';
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'STUDENT',
  });

  useTitle(isCreate ? 'Create User' : 'User Details');

  useEffect(() => {
    if (isCreate) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await userAPI.getAdminUser(id);
        if (!mounted) return;
        if (res?.success && res.data) {
          setUser(res.data);
          setFormData({
            full_name: res.data.full_name || res.data.fullName || '',
            email: res.data.email || '',
            password: '',
            role: res.data.role || 'STUDENT',
          });
        } else {
          setError(res?.message || 'Failed to load user');
        }
      } catch (err) {
        console.error('Failed to fetch user', err);
        if (!mounted) return;
        setError(err?.response?.data?.message || err.message || 'Server error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, isCreate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email) {
      push({ title: 'Error', body: 'Name and email are required' });
      return;
    }
    if (isCreate && !formData.password) {
      push({ title: 'Error', body: 'Password is required for new users' });
      return;
    }

    setLoading(true);
    try {
      const res = await userAPI.createAdminUser(formData);
      if (res?.success) {
        push({ title: 'Success', body: 'User created successfully' });
        navigate('/education/admin/users');
      } else {
        push({ title: 'Error', body: res?.message || 'Failed to create user' });
      }
    } catch (err) {
      console.error('Create user error', err);
      push({ title: 'Error', body: err?.response?.data?.message || err.message || 'Server error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isCreate && loading)
    return (
      <Section>
        <div>Loading...</div>
      </Section>
    );
  if (!isCreate && error)
    return (
      <Section>
        <div className="text-error">{error}</div>
      </Section>
    );

  return (
    <Section>
      <Card>
        <div style={{ maxWidth: 600 }}>
          <h2>{isCreate ? 'Create New User' : 'User Details'}</h2>

          <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
            <div className="input-group">
              <label className="input-label">Full Name *</label>
              <input
                className="auth-input"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Email *</label>
              <input
                className="auth-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={!isCreate}
              />
            </div>

            {isCreate && (
              <div className="input-group">
                <label className="input-label">Password *</label>
                <input
                  className="auth-input"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Role *</label>
              <select
                className="auth-input"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">Admin</option>
                <option value="RESEARCHER">Researcher</option>
              </select>
            </div>

            {!isCreate && user && (
              <div className="input-group">
                <label className="input-label">Created At</label>
                <input
                  className="auth-input"
                  type="text"
                  value={new Date(user.createdAt).toLocaleString()}
                  disabled
                />
              </div>
            )}

            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              {isCreate && (
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              )}
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => navigate('/education/admin/users')}
              >
                Back to Users
              </button>
            </div>
          </form>
        </div>
      </Card>
    </Section>
  );
}
