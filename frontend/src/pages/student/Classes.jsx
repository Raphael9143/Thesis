import React, { useEffect, useState } from 'react';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import ClassCard from '../../components/ui/ClassCard';
import { useNavigate } from 'react-router-dom';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/ui.css';
import useTitle from '../../hooks/useTitle';
import JoinClassModal from '../../components/student/JoinClassModal';

export default function StudentClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  // title handled by useTitle

  useEffect(() => {
    let mounted = true;
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const res = await userAPI.getStudentEnrolledClasses();
        if (!mounted) return;
        if (res?.success && res.data && Array.isArray(res.data.classes)) {
          setClasses(res.data.classes);
          setError(null);
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
    };

    fetchClasses();

    return () => {
      mounted = false;
    };
  }, []);

  useTitle('Classes');

  return (
    <Section>
      <Card>
        <div className="create-class-header">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setJoinModalOpen(true)}
          >
            <i className="fa-solid fa-door-open" />
            <span>Join class</span>
          </button>
        </div>
        {loading && <div>Loading classes...</div>}
        {error && <div className="text-error">{error}</div>}
        {!loading && !error && classes.length === 0 && <div>No classes found.</div>}
        {!loading && !error && classes.length > 0 && (
          <div className="grid-cards">
            {classes?.map((c) => (
              <ClassCard
                key={c.id}
                title={c.name}
                code={c.code}
                subtitle={`${c.year || ''}`}
                image={c.image || c.thumbnail}
                badge={c.status}
                description={c.description}
                onClick={() => navigate(`/education/student/classes/${c.id}`)}
              />
            ))}
          </div>
        )}
      </Card>
      <JoinClassModal
        open={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onJoined={async () => {
          // After joining, re-fetch enrolled classes from server to ensure consistency
          setJoinModalOpen(false);
          setLoading(true);
          try {
            const res = await userAPI.getStudentEnrolledClasses();
            if (res?.success && res.data && Array.isArray(res.data.classes)) {
              setClasses(res.data.classes);
              setError(null);
            }
          } catch (err) {
            console.error('Failed to refresh classes after join', err);
          } finally {
            setLoading(false);
          }
        }}
      />
    </Section>
  );
}
