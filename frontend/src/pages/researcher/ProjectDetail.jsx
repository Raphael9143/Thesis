import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import FilePreview from '../../components/ui/FilePreview';
import userAPI from '../../../services/userAPI';
import useTitle from '../../hooks/useTitle';
import ProjectMembers from '../../components/researcher/ProjectMembers';
import toFullUrl from '../../utils/FullURLFile';
import DashedDivider from '../../components/ui/DashedDivider';

export default function ResearcherProjectDetail() {
  const { projectId } = useParams();
  const location = useLocation();
  const initialProject = location.state?.project || null;

  const [project, setProject] = useState(initialProject);
  const [model, setModel] = useState(null);
  const [members, setMembers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // inline preview handled by FilePreview; no modal state required

  const titleText = useMemo(() => {
    const name = project?.title || project?.name || model?.name || 'Project';
    return `${name}`;
  }, [project, model]);

  useTitle(titleText);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (!project) {
          const prjRes = await userAPI.getResearchProject(projectId);
          if (mounted && prjRes?.success) setProject(prjRes.data);
        }
        const [modelRes, membersRes] = await Promise.all([
          userAPI.getResearchProjectModel(projectId),
          userAPI.getResearchProjectMembers(projectId),
        ]);
        if (mounted) {
          if (modelRes?.success) setModel(modelRes.data);
          else setModel(null);
          if (membersRes?.success) setMembers(membersRes.data);
          else setMembers(null);
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
          <div className="display-flex flex-wrap gap-12">
            <div style={{ flex: '1 1 640px', minWidth: 360, borderRight: '1px solid #e5e7eb', paddingRight: 16 }}>
              <h2 className="no-margin">Model</h2>
              {model ? (
                <div style={{ marginTop: 12 }}>
                  <FilePreview url={toFullUrl(model.file_path)} filename={model.file_path} filePath={model.file_path} />
                  {model.file_path && (
                    <div style={{ marginTop: 8 }}>
                      <a className="btn btn--secondary" href={toFullUrl(model.file_path)} download>
                        Download
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: 12 }}>No model found for this project.</div>
              )}
            </div>

            <div
              style={{
                flex: '1 1 320px',
                minWidth: 280,
                borderLeft: '1px solid #f3f4f6',
                paddingLeft: 16,
                textAlign: 'left',
              }}
            >
              <div className="font-700" style={{ marginBottom: 8 }}>
                About
              </div>
              {project?.description && <p style={{ marginTop: 6 }}>{project.description}</p>}
              <DashedDivider />
              <ProjectMembers members={members} />
            </div>
          </div>
        )}
      </Card>

      {/* Inline preview above; no separate modal preview here */}
    </Section>
  );
}
