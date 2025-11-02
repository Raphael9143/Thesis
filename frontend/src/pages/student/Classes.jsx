import React, { useEffect, useState } from 'react';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import ClassCard from '../../components/ui/ClassCard';
import { useNavigate } from 'react-router-dom';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/ui.css';
import { usePageInfo } from '../../contexts/PageInfoContext';

export default function StudentClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setTitle: setPageTitle } = usePageInfo();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try { 
        setPageTitle('Classes'); 
      } catch(_) {}
      setLoading(true);
      try {
        const res = await userAPI.getStudentEnrolledClasses();
        if (!mounted) return;
        if (res?.success && res.data && Array.isArray(res.data.classes)) {
          setClasses(res.data.classes);
        } else {
          setError(res?.message || 'Failed to load classes');
        }
      } catch (err) {
        console.error('Failed to fetch enrolled classes', err);
        if (!mounted) return;
        setError(err?.response?.data?.message || err.message || 'Server error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <Section title="My Classes" subtitle="Classes you are enrolled in">
      <Card>
        {loading && <div>Loading classes...</div>}
        {error && <div className="text-error">{error}</div>}
        {!loading && !error && classes.length === 0 && (
          <div>No classes found.</div>
        )}
        {!loading && !error && classes.length > 0 && (
          <div className="grid-cards">
            {classes.map(c => (
              <ClassCard
                key={c.id}
                title={c.name}
                subtitle={`${c.code} • ${c.year}`}
                image={c.image || c.thumbnail}
                badge={c.status}
                description={c.description}
                onClick={() => navigate(`/education/student/classes/${c.id}`)}
              />
            ))}
          </div>
        )}
      </Card>
    </Section>
  );
}
