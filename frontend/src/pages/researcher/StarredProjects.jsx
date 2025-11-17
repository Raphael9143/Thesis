import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import ClassCard from '../../components/ui/ClassCard';
import userAPI from '../../../services/userAPI';
import { useNotifications } from '../../contexts/NotificationContext';
import useTitle from '../../hooks/useTitle';
import '../../assets/styles/ui.css';
import '../../assets/styles/pages/ResearcherProjects.css';

export default function StarredProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { push } = useNotifications();

  useTitle('Starred Projects');

  const fetchStarredProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userAPI.getStarredProjects();
      if (res?.success && Array.isArray(res.data)) {
        setProjects(res.data);
      } else {
        setProjects([]);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to load starred projects';
      setError(msg);
      try {
        push({ title: 'Error', body: msg });
      } catch {
        // ignore notification errors
      }
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchStarredProjects();
    })();
    return () => {
      mounted = false;
    };
  }, [fetchStarredProjects]);

  return (
    <Section>
      <Card>
        {loading && <div>Loading starred projects...</div>}
        {error && <div className="text-error">{error}</div>}
        {!loading && !error && projects.length === 0 && <div>No starred projects. Star projects to see them here.</div>}
        {!loading && !error && projects.length > 0 && (
          <div className="grid-cards">
            {projects.map((p) => (
              <ClassCard
                key={p.id}
                title={p.title || 'Untitled Project'}
                subtitle={`${p.my_role || 'Member'}`}
                description={p.description || ''}
                badge={p.status || ''}
                onClick={() => navigate(`/researcher/projects/${p.id}/details`, { state: { project: p } })}
              />
            ))}
          </div>
        )}
      </Card>
    </Section>
  );
}
