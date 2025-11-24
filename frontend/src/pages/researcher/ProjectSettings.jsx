import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/pages/ProjectSettings.css';

export default function ProjectSettings({ project, isOwner, onProjectUpdate }) {
  const { push } = useNotifications();
  const [visibility, setVisibility] = useState(project?.visibility || 'PRIVATE');
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);

  const handleVisibilityChange = async (newVisibility) => {
    if (!isOwner) {
      push({ title: 'Permission denied', body: 'Only the owner can change visibility' });
      return;
    }
    setSaving(true);
    try {
      // Assuming there's an API to update visibility
      // You may need to add this endpoint to userAPI if it doesn't exist
      const res = await userAPI.updateResearchProjectVisibility(project.id, newVisibility);
      if (res?.success) {
        setVisibility(newVisibility);
        push({
          title: 'Success',
          body: `Project visibility changed to ${newVisibility.toLowerCase()}`,
        });
        if (onProjectUpdate) onProjectUpdate({ ...project, visibility: newVisibility });
      } else {
        push({ title: 'Error', body: res?.message || 'Failed to update visibility' });
      }
    } catch (err) {
      push({
        title: 'Error',
        body: err?.response?.data?.message || err.message || 'Failed to update visibility',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseProject = async () => {
    if (!isOwner) {
      push({ title: 'Permission denied', body: 'Only the owner can close the project' });
      return;
    }
    if (
      !window.confirm('Are you sure you want to close this project? This action cannot be undone.')
    ) {
      return;
    }
    setClosing(true);
    try {
      const res = await userAPI.patchResearchProjectStatus(project.id, 'CLOSED');
      if (res?.success) {
        push({ title: 'Success', body: 'Project has been closed' });
        if (onProjectUpdate) onProjectUpdate({ ...project, status: 'CLOSED' });
      } else {
        push({ title: 'Error', body: res?.message || 'Failed to close project' });
      }
    } catch (err) {
      push({
        title: 'Error',
        body: err?.response?.data?.message || err.message || 'Failed to close project',
      });
    } finally {
      setClosing(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="project-settings">
        <p className="text-muted">Only the project owner can access settings.</p>
      </div>
    );
  }

  return (
    <div className="project-settings">
      <div className="settings-section">
        <div className="settings-visibility-header">
          <h2>Visibility</h2>
        </div>
        <div className="settings-visibility-contents">
          <p className="settings-section-description">
            Control who can view your project. Public projects are visible to everyone, while
            private projects are only visible to members.
          </p>
          <div className="settings-visibility-options">
            <label className="settings-radio-option">
              <input
                type="radio"
                name="visibility"
                value="PUBLIC"
                checked={visibility === 'PUBLIC'}
                onChange={(e) => handleVisibilityChange(e.target.value)}
                disabled={saving || project?.status === 'CLOSED'}
              />
              <div>
                <strong>Public</strong>
                <p className="text-muted">Anyone can view this project</p>
              </div>
            </label>
            <label className="settings-radio-option">
              <input
                type="radio"
                name="visibility"
                value="PRIVATE"
                checked={visibility === 'PRIVATE'}
                onChange={(e) => handleVisibilityChange(e.target.value)}
                disabled={saving || project?.status === 'CLOSED'}
              />
              <div>
                <strong>Private</strong>
                <p className="text-muted">Only members can view this project</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="settings-section settings-danger-zone">
        <h3 className="settings-section-title">Danger Zone</h3>
        <p className="settings-section-description">
          Close this project to prevent further contributions. This action cannot be undone.
        </p>
        <button
          className="btn btn-danger btn-sm"
          onClick={handleCloseProject}
          disabled={closing || project?.status === 'CLOSED'}
        >
          <i className="fa-solid fa-ban"></i>
          <span>
            {closing
              ? 'Closing...'
              : project?.status === 'CLOSED'
                ? 'Project Closed'
                : 'Close Project'}
          </span>
        </button>
      </div>
    </div>
  );
}
