import React, { useEffect, useState } from 'react';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import userAPI from '../../../services/userAPI';
import useTitle from '../../hooks/useTitle';
import '../../assets/styles/ui.css';
import '../../assets/styles/pages/AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useTitle('Admin Dashboard');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await userAPI.getAdminStats();
        if (!mounted) return;
        if (res?.success && res.data) {
          setStats(res.data);
        } else {
          setError(res?.message || 'Failed to load stats');
        }
      } catch (err) {
        console.error('Failed to fetch admin stats', err);
        if (!mounted) return;
        setError(err?.response?.data?.message || err.message || 'Server error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading)
    return (
      <Section>
        <div>Loading statistics...</div>
      </Section>
    );
  if (error)
    return (
      <Section>
        <div className="text-error">{error}</div>
      </Section>
    );
  if (!stats)
    return (
      <Section>
        <div>No data available</div>
      </Section>
    );

  return (
    <Section>
      <Card>
        <div className="admin-dashboard">
          <h2>System Statistics</h2>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{stats.users || 0}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Students</div>
              <div className="stat-value">{stats.byRole?.students || 0}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Teachers</div>
              <div className="stat-value">{stats.byRole?.teachers || 0}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Admins</div>
              <div className="stat-value">{stats.byRole?.admins || 0}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Courses</div>
              <div className="stat-value">{stats.courses || 0}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Classes</div>
              <div className="stat-value">{stats.classes || 0}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Assignments</div>
              <div className="stat-value">{stats.assignments || 0}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Exams</div>
              <div className="stat-value">{stats.exams || 0}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Submissions</div>
              <div className="stat-value">{stats.submissions || 0}</div>
            </div>
          </div>
        </div>
      </Card>
    </Section>
  );
}
