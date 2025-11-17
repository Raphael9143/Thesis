import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import FormField from '../../components/ui/FormField';
import CodeEditor from '../../components/ui/CodeEditor';
import userAPI from '../../../services/userAPI';
import useTitle from '../../hooks/useTitle';
import { useNotifications } from '../../contexts/NotificationContext';
import '../../assets/styles/pages/PostContribution.css';
import DashedDivider from '../../components/ui/DashedDivider';

export default function PostContribution() {
  const { projectId, modelId } = useParams();
  const navigate = useNavigate();
  const { push } = useNotifications();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [modelContent, setModelContent] = useState('');
  const [modelPath, setModelPath] = useState('');
  const [modelName, setModelName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useTitle('Contribute to Project');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const modelRes = await userAPI.getUseModelById(modelId);
        if (!mounted) return;
        if (modelRes?.success && modelRes.data) {
          const model = modelRes.data;
          setModelPath(model.file_path || '');
          setModelName(model.name || '');
          setModelContent(model.raw_text || '');
        }
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || err.message || 'Failed to load model');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [modelId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      push({ title: 'Error', body: 'Please enter a title' });
      return;
    }

    setSubmitting(true);
    try {
      // Create a blob from the model content and create a file
      const blob = new Blob([modelContent], { type: 'text/plain' });
      const file = new File([blob], modelName || 'model.use', { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', modelPath || '');
      formData.append('title', title.trim());
      formData.append('description', description.trim() || '');
      formData.append('name', modelName || 'model');

      const res = await userAPI.postProjectContribution(projectId, formData);
      if (res?.success) {
        push({ title: 'Success', body: 'Contribution posted successfully' });
        setTimeout(() => {
          navigate(`/researcher/projects/${projectId}`);
        }, 1000);
      } else {
        push({ title: 'Error', body: res?.message || 'Failed to post contribution' });
      }
    } catch (err) {
      console.error('Post contribution error:', err);
      push({ title: 'Error', body: err?.response?.data?.message || err.message || 'Server error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/researcher/projects/${projectId}`);
  };

  if (loading) {
    return (
      <Section>
        <Card>Loading model...</Card>
      </Section>
    );
  }

  if (error) {
    return (
      <Section>
        <Card>
          <div className="text-error">{error}</div>
          <button className="btn btn-signin" onClick={handleCancel}>
            Back to Project
          </button>
        </Card>
      </Section>
    );
  }

  return (
    <Section>
      <Card>
        <form onSubmit={handleSubmit} className="post-contribution-form">
          <FormField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required={true}
            placeholder="Contribution title"
          />

          <FormField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            textarea
            placeholder="Describe your contribution..."
          />

          <DashedDivider />

          <div className="editor-pane">
            <h2 className="form-field-label">Model</h2>
            <CodeEditor
              value={modelContent}
              onChange={(e) => setModelContent(e.target.value)}
              placeholder="// Edit model code here...\n"
              rows={20}
              disabled={submitting}
            />
          </div>

          <div className="post-contribution-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <button type="button" className="btn btn-signin" onClick={handleCancel} disabled={submitting}>
              Cancel
            </button>
          </div>
        </form>
      </Card>
    </Section>
  );
}
