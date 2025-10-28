import React, { useEffect, useState } from 'react';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import ClassCard from '../../components/ui/ClassCard';
import { useNavigate } from 'react-router-dom';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/ui.css';
import CreateClassModal from '../../components/teacher/CreateClassModal';

export default function ClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

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
            <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>Create class</button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {loading && <div>Loading classes...</div>}
          {error && <div className="text-error">{error}</div>}
          {!loading && !error && classes.length === 0 && (<div>No classes found.</div>)}
          {!loading && !error && classes.length > 0 && (
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {classes.map(c => (
                <ClassCard
                  key={c.id}
                  title={c.name}
                  subtitle={`${c.code} • ${c.semester} • ${c.year}`}
                  image={c.image || c.thumbnail}
                  badge={c.status}
                  description={c.description}
                  onClick={() => navigate(`/education/teacher/classes/${c.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
      <CreateClassModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={(cls) => { if (cls) setClasses(s => [cls, ...s]); }} />
    </Section>
  );
}
