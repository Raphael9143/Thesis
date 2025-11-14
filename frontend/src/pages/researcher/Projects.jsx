import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import ClassCard from '../../components/ui/ClassCard';
import '../../assets/styles/ui.css';
import userAPI from '../../../services/userAPI';
import { useNotifications } from '../../contexts/NotificationContext';
import useTitle from '../../hooks/useTitle';

export default function ResearcherProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { push } = useNotifications();

  useTitle('Projects');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await userAPI.getResearchProjectsMine();
        if (!mounted) return;
        if (res?.success && Array.isArray(res.data)) setProjects(res.data);
        else setProjects([]);
      } catch (err) {
        if (!mounted) return;
        const msg = err?.response?.data?.message || err.message || 'Failed to load projects';
        setError(msg);
        try {
          push({ title: 'Error', body: msg });
        } catch {
          // ignore notification errors
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [push]);

  return (
    <Section>
      <Card>
        {loading && <div>Loading projects...</div>}
        {error && <div className="text-error">{error}</div>}
        {!loading && !error && projects.length === 0 && <div>No projects found.</div>}
        {!loading && !error && projects.length > 0 && (
          <div className="grid-cards">
            {projects.map((p) => (
              <ClassCard
                key={p.id}
                title={p.title || 'Untitled Project'}
                subtitle={`${p.my_role || 'Member'}`}
                description={p.description || ''}
                badge={p.status || ''}
                onClick={() => navigate(`/researcher/projects/${p.id}`, { state: { project: p } })}
              />
            ))}
          </div>
        )}
      </Card>
    </Section>
  );
}
