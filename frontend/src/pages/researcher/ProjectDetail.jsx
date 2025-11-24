import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import FilePreview from '../../components/ui/FilePreview';
import userAPI from '../../../services/userAPI';
import useTitle from '../../hooks/useTitle';
import ProjectMembers from '../../components/researcher/ProjectMembers';
import toFullUrl from '../../utils/FullURLFile';
import DashedDivider from '../../components/ui/DashedDivider';
import { useNotifications } from '../../contexts/NotificationContext';
import AddModeratorModal from '../../components/researcher/AddModeratorModal';
import AddContributorsModal from '../../components/researcher/AddContributorsModal';
import ContributionHistory from './ContributionHistory';
import ProjectSettings from './ProjectSettings';
import Tabs from '../../components/ui/Tabs';
import '../../assets/styles/pages/ProjectDetail.css';

export default function ResearcherProjectDetail() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialProject = location.state?.project || null;
  const { push } = useNotifications();

  const [project, setProject] = useState(initialProject);
  const [model, setModel] = useState(null);
  const [members, setMembers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [starred, setStarred] = useState(false);
  const [starLoading, setStarLoading] = useState(false);
  const [addModeratorOpen, setAddModeratorOpen] = useState(false);
  const [addContribOpen, setAddContribOpen] = useState(false);
  // inline preview handled by FilePreview; no modal state required

  // Determine active tab from URL
  const activeTab = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/contributions')) return 'contributions';
    if (path.includes('/settings')) return 'settings';
    return 'project';
  }, [location.pathname]);

  const handleTabChange = (tab) => {
    const routes = {
      project: `/researcher/projects/${projectId}/details`,
      contributions: `/researcher/projects/${projectId}/contributions?page=1`,
      settings: `/researcher/projects/${projectId}/settings`,
    };
    navigate(routes[tab]);
  };

  const titleText = useMemo(() => {
    const name = project?.title || project?.name || model?.name || 'Project';
    return `${name}`;
  }, [project, model]);

  const isOwner = useMemo(() => {
    if (!members || !members.owner) return false;
    const currentUserId = sessionStorage.getItem('userId');
    return members.owner.id === Number(currentUserId);
  }, [members]);

  const isModerator = useMemo(() => {
    if (!members || !Array.isArray(members.moderators)) return false;
    const currentUserId = sessionStorage.getItem('userId');
    return members.moderators.some((m) => m.id === Number(currentUserId));
  }, [members]);

  useTitle(titleText);

  const handleToggleStar = async () => {
    if (starLoading) return;
    setStarLoading(true);
    try {
      const res = await userAPI.toggleResearchProjectStar(projectId);
      console.log('Toggle star response:', res);
      if (res?.success && res.data?.starred_ids) {
        const starredIds = res.data.starred_ids;
        const newStarred = starredIds.includes(Number(projectId));
        setStarred(newStarred);
        try {
          push({
            title: newStarred ? 'Starred project' : 'Unstarred project',
            body: newStarred
              ? 'Project added to your starred list'
              : 'Project removed from your starred list',
          });
        } catch (notifyErr) {
          console.error('Notification error:', notifyErr);
        }
      } else {
        console.warn('Unexpected response format:', res);
      }
    } catch (err) {
      console.error('Toggle star error:', err);
      const errorMsg = err?.response?.data?.message || 'Failed to toggle star';
      setError(errorMsg);
      try {
        push({
          title: 'Error',
          body: errorMsg,
        });
      } catch (notifyErr) {
        console.error('Notification error:', notifyErr);
      }
    } finally {
      setStarLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const membersRes = await userAPI.getResearchProjectMembers(projectId);
      if (membersRes?.success) setMembers(membersRes.data);
    } catch (err) {
      console.error('Fetch members error:', err);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        let projectData = project;
        if (!project) {
          const prjRes = await userAPI.getResearchProject(projectId);
          if (mounted && prjRes?.success) {
            setProject(prjRes.data);
            projectData = prjRes.data;
          }
        }
        const modelId = projectData?.main_use_model_id;
        const [modelRes, membersRes, starredRes] = await Promise.all([
          modelId ? userAPI.getResearchProjectModel(modelId) : Promise.resolve(null),
          userAPI.getResearchProjectMembers(projectId),
          userAPI.getResearchProjectStarred(projectId),
        ]);
        if (mounted) {
          if (modelRes?.success) setModel(modelRes.data);
          else setModel(null);
          if (membersRes?.success) setMembers(membersRes.data);
          else setMembers(null);
          if (starredRes?.success && starredRes.data) {
            setStarred(starredRes.data.is_starred || false);
          }
        }
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || err.message || 'Failed to load project');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [projectId, project]);

  return (
    <Section>
      <Card>
        {loading && <div>Loading project...</div>}
        {error && <div className="text-error">{error}</div>}
        {!loading && !error && (
          <>
            <Tabs
              tabs={
                isOwner
                  ? [
                      { value: 'project', label: 'Project' },
                      { value: 'contributions', label: 'Contributions' },
                      { value: 'settings', label: 'Settings' },
                    ]
                  : [
                      { value: 'project', label: 'Project' },
                      { value: 'contributions', label: 'Contributions' },
                    ]
              }
              activeTab={activeTab}
              onChange={handleTabChange}
            />

            {activeTab === 'project' && (
              <>
                <div className="project-detail-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() =>
                      navigate(`/researcher/projects/${projectId}/contribute/${model?.id || ''}`)
                    }
                    disabled={!model?.id}
                    title={!model?.id ? 'No model available' : 'Post contribution'}
                  >
                    <i className="fa fa-code-branch project-detail-moderator-icon" />
                    Contribute
                  </button>
                  {isOwner && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setAddModeratorOpen(true)}
                    >
                      <i className="fa fa-user-plus project-detail-moderator-icon" />
                      Add Moderator
                    </button>
                  )}
                  {(isOwner || isModerator) && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setAddContribOpen(true)}
                    >
                      <i className="fa fa-user-plus project-detail-moderator-icon" />
                      Add Contributors
                    </button>
                  )}
                  <a
                    onClick={handleToggleStar}
                    disabled={starLoading}
                    title={starred ? 'Unstar project' : 'Star project'}
                    className="project-detail-star-btn"
                  >
                    <i
                      className={`fa${starred ? 's' : 'r'} fa-star ${starred ? 'project-detail-star-icon-starred' : 'project-detail-star-icon-unstarred'}`}
                    />
                  </a>
                </div>
                <div className="project-detail-content">
                  <div className="project-detail-model-section">
                    <h2 className="no-margin">Model</h2>
                    {model ? (
                      <div className="project-detail-model-preview">
                        <FilePreview
                          url={toFullUrl(model.file_path)}
                          filename={model.file_path}
                          filePath={model.file_path}
                        />
                        {model.file_path && (
                          <div className="project-detail-model-download">
                            <a href={toFullUrl(model.file_path)} download>
                              Download
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="project-detail-model-preview">
                        No model found for this project.
                      </div>
                    )}
                  </div>

                  <div className="project-detail-about-section">
                    <div className="project-detail-about-title">About</div>
                    {project?.description && (
                      <p
                        className="project-detail-about-description"
                        style={{ whiteSpace: 'pre-line' }}
                      >
                        {(() => {
                          const replaced = project.description.replace(/\\n/g, '\n');
                          return replaced.length > 500
                            ? replaced.slice(0, 500).trimEnd() + '…'
                            : replaced;
                        })()}
                      </p>
                    )}
                    <DashedDivider />
                    <ProjectMembers members={members} />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'contributions' && (
              <div className="project-detail-contributions">
                <ContributionHistory />
              </div>
            )}

            {activeTab === 'settings' && isOwner && (
              <div className="project-detail-settings">
                <ProjectSettings
                  project={project}
                  isOwner={isOwner}
                  onProjectUpdate={(updatedProject) => setProject(updatedProject)}
                />
              </div>
            )}
          </>
        )}
      </Card>

      <AddModeratorModal
        open={addModeratorOpen}
        onClose={() => setAddModeratorOpen(false)}
        onAdded={fetchMembers}
        projectId={projectId}
      />
      <AddContributorsModal
        open={addContribOpen}
        onClose={() => setAddContribOpen(false)}
        onAdded={fetchMembers}
        projectId={projectId}
      />
    </Section>
  );
}
