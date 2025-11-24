import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import CodeEditor from '../../components/ui/CodeEditor';
import userAPI from '../../../services/userAPI';
import useTitle from '../../hooks/useTitle';
import { useNotifications } from '../../contexts/NotificationContext';
import '../../assets/styles/pages/PostContribution.css';
import DashedDivider from '../../components/ui/DashedDivider';

export default function ResubmitContribution() {
  const { contributionId } = useParams();
  const navigate = useNavigate();
  const { push } = useNotifications();

  const [contribution, setContribution] = useState(null);
  const [modelContent, setModelContent] = useState('');
  const [modelPath, setModelPath] = useState('');
  const [modelName, setModelName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useTitle('Resubmit Contribution');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await userAPI.getContributionById(contributionId);
        if (!mounted) return;
        if (res?.success && res.data) {
          const contrib = res.data;
          setContribution(contrib);
          setModelPath(contrib.useModel?.file_path || '');
          setModelContent(contrib.useModel?.raw_text || '');
          setModelName(contrib.useModel?.name || 'model');
        } else {
          setError('Failed to load contribution');
        }
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || err.message || 'Failed to load contribution');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [contributionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modelContent.trim()) {
      push({ title: 'Error', body: 'Code cannot be empty' });
      return;
    }
    if (!modelPath.trim()) {
      push({ title: 'Error', body: 'File path cannot be empty' });
      return;
    }

    setSubmitting(true);
    try {
      // Create a blob from the model content and create a file
      const blob = new Blob([modelContent], { type: 'text/plain' });
      const file = new File([blob], modelName || 'model.use', { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', modelPath.trim());
      formData.append('raw_text', modelContent);

      const res = await userAPI.resubmitContribution(contributionId, formData);
      if (res?.success) {
        push({ title: 'Success', body: 'Contribution resubmitted successfully' });
        setTimeout(() => {
          navigate(
            `/researcher/projects/${contribution.research_project_id}/contributions/${contributionId}`
          );
        }, 1000);
      } else {
        push({ title: 'Error', body: res?.message || 'Failed to resubmit contribution' });
      }
    } catch (err) {
      console.error('Resubmit error:', err);
      push({ title: 'Error', body: err?.response?.data?.message || err.message || 'Server error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (contribution) {
      navigate(
        `/researcher/projects/${contribution.research_project_id}/contributions/${contributionId}`
      );
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <Section>
        <Card>Loading contribution...</Card>
      </Section>
    );
  }

  if (error || !contribution) {
    return (
      <Section>
        <Card>
          <div className="text-error">{error || 'Contribution not found'}</div>
          <button className="btn btn-signin" onClick={() => navigate(-1)}>
            Back
          </button>
        </Card>
      </Section>
    );
  }

  return (
    <Section>
      <Card>
        <form onSubmit={handleSubmit} className="post-contribution-form">
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
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Resubmitting...' : 'Resubmit'}
            </button>
            <button
              type="button"
              className="btn btn-signin"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </Card>
    </Section>
  );
}
