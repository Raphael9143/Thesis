import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import userAPI from '../../../services/userAPI';
import useTitle from '../../hooks/useTitle';
import { useNotifications } from '../../contexts/NotificationContext';
import '../../assets/styles/ui.css';
import '../../assets/styles/pages/AdminUsers.css';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const { push } = useNotifications();

  useTitle('Users Management');

  const loadUsers = async (currentPage = 1, role = '') => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: 20 };
      if (role) params.role = role;
      const res = await userAPI.getAdminUsers(params);
      if (res?.success) {
        setUsers(res.data || []);
        setMeta(res.meta || null);
        setError(null);
      } else {
        setError(res?.message || 'Failed to load users');
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
      setError(err?.response?.data?.message || err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(page, roleFilter);
  }, [page, roleFilter]);

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await userAPI.deleteAdminUser(userId);
      if (res?.success) {
        push({ title: 'Success', body: 'User deleted successfully' });
        loadUsers(page, roleFilter);
      } else {
        push({ title: 'Error', body: res?.message || 'Failed to delete user' });
      }
    } catch (err) {
      console.error('Delete user error', err);
      push({ title: 'Error', body: err?.response?.data?.message || err.message || 'Server error' });
    }
  };

  return (
    <Section>
      <Card>
        <div className="admin-users">
          <div className="admin-users-header">
            <div className="admin-users-controls">
              <select
                className="auth-input"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                style={{ width: 'auto', marginRight: 12 }}
              >
                <option value="">All Roles</option>
                <option value="STUDENT">Students</option>
                <option value="TEACHER">Teachers</option>
                <option value="ADMIN">Admins</option>
                <option value="RESEARCHER">Researchers</option>
              </select>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/education/admin/users/create')}
              >
                <i className="fa fa-plus" /> Create User
              </button>
            </div>
          </div>

          {loading && <div>Loading users...</div>}
          {error && <div className="text-error">{error}</div>}

          {!loading && !error && users.length === 0 && <div>No users found.</div>}

          {!loading && !error && users.length > 0 && (
            <>
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.full_name || u.fullName || 'N/A'}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-badge role-${u.role?.toLowerCase()}`}>{u.role}</span>
                      </td>
                      <td>{u.status || '-'}</td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => navigate(`/education/admin/users/${u.id}`)}
                          style={{ marginRight: 8 }}
                        >
                          View
                        </button>
                        {u.status === 'BANNED' ? (
                          <button
                            className="btn btn-sm"
                            onClick={async () => {
                              if (!window.confirm('Enable this user?')) return;
                              try {
                                const res = await userAPI.enableAdminUser(u.id);
                                if (res?.success) {
                                  push({ title: 'Success', body: 'User enabled' });
                                  loadUsers(page, roleFilter);
                                } else {
                                  push({
                                    title: 'Error',
                                    body: res?.message || 'Failed to enable user',
                                  });
                                }
                              } catch (err) {
                                console.error('Enable user error', err);
                                push({
                                  title: 'Error',
                                  body:
                                    err?.response?.data?.message || err.message || 'Server error',
                                });
                              }
                            }}
                            style={{ marginRight: 8 }}
                          >
                            Enable
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm"
                            onClick={async () => {
                              if (!window.confirm('Disable this user? (soft-ban)')) return;
                              try {
                                const res = await userAPI.disableAdminUser(u.id);
                                if (res?.success) {
                                  push({ title: 'Success', body: 'User disabled' });
                                  loadUsers(page, roleFilter);
                                } else {
                                  push({
                                    title: 'Error',
                                    body: res?.message || 'Failed to disable user',
                                  });
                                }
                              } catch (err) {
                                console.error('Disable user error', err);
                                push({
                                  title: 'Error',
                                  body:
                                    err?.response?.data?.message || err.message || 'Server error',
                                });
                              }
                            }}
                            style={{ marginRight: 8, color: '#d32f2f' }}
                          >
                            Disable
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleDelete(u.id)}
                          style={{ color: '#d32f2f' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {meta && meta.totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn btn-sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <span style={{ margin: '0 12px' }}>
                    Page {page} of {meta.totalPages}
                  </span>
                  <button
                    className="btn btn-sm"
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </Section>
  );
}
