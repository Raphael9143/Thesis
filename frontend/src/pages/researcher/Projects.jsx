import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import ClassCard from '../../components/ui/ClassCard';
import CreateProjectModal from '../../components/researcher/CreateProjectModal';
import '../../assets/styles/ui.css';
import '../../assets/styles/pages/ResearcherProjects.css';
import userAPI from '../../../services/userAPI';
import { useNotifications } from '../../contexts/NotificationContext';
import useTitle from '../../hooks/useTitle';

export default function ResearcherProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { push } = useNotifications();

  useTitle('Projects');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userAPI.getResearchProjectsMine();
      if (res?.success && Array.isArray(res.data)) setProjects(res.data);
      else setProjects([]);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to load projects';
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
      await fetchProjects();
    })();
    return () => {
      mounted = false;
    };
  }, [fetchProjects]);

  return (
    <Section>
      <Card>
        <div className="create-button-section">
          <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
            Create Project
          </button>
        </div>
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
                onClick={() => navigate(`/researcher/projects/${p.id}/details`, { state: { project: p } })}
              />
            ))}
          </div>
        )}
      </Card>
      <CreateProjectModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => {
          fetchProjects();
        }}
      />
    </Section>
  );
}
