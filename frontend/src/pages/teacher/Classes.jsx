import React, { useEffect, useState } from 'react';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/ui.css';

export default function ClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await userAPI.getTeacherClasses();
        if (!mounted) return;
        if (res?.success && Array.isArray(res.data)) {
          setClasses(res.data);
        } else {
          setError(res?.message || 'Failed to load classes');
        }
      } catch (err) {
        console.error('Failed to fetch teacher classes', err);
        if (!mounted) return;
        setError(err?.response?.data?.message || err.message || 'Server error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <Section title="Classes" subtitle="Manage classes you teach">
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Your classes</h3>
          <div>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/education/teacher/classes/create-class')}>Create class</button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {loading && <div>Loading classes...</div>}
          {error && <div className="text-error">{error}</div>}
          {!loading && !error && classes.length === 0 && (<div>No classes found.</div>)}
          {!loading && !error && classes.length > 0 && (
            <div style={{ display: 'grid', gap: 12 }}>
              {classes.map(c => (
                <div key={c.id} style={{ border: '1px solid #e5e7eb', padding: 12, borderRadius: 8, cursor: 'pointer' }} onClick={() => navigate(`/education/teacher/classes/${c.id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{c.name}</div>
                      <div style={{ color: '#6b7280' }}>{c.code} • {c.semester} • {c.year}</div>
                    </div>
                    <div>
                      <span className="badge">{c.status}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 8 }}>{c.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </Section>
  );
}
