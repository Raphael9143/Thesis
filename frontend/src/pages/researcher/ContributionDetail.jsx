import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import userAPI from '../../../services/userAPI';
import useTitle from '../../hooks/useTitle';
import fmtDate from '../../utils/FormatDate';
import formatStatus from '../../utils/FormatStatus';
import { useNotifications } from '../../contexts/NotificationContext';
import Tabs from '../../components/ui/Tabs';
import DashedDivider from '../../components/ui/DashedDivider';
import ContributionDetailsTab from './ContributionDetailsTab';
import ContributionChangesTab from './ContributionChangesTab';
import ContributionComments from '../../components/researcher/ContributionComments';
import '../../assets/styles/pages/ContributionDetail.css';

export default function ContributionDetail() {
  const { contributionId } = useParams();
  const navigate = useNavigate();
  const { push } = useNotifications();

  const [contribution, setContribution] = useState(null);
  const [originalModel, setOriginalModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [validationError, setValidationError] = useState(null);

  const currentUserId = Number(sessionStorage.getItem('userId'));

  useTitle('Contribution Details');

  // Fetch contribution details and original model
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await userAPI.getContributionById(contributionId);
        if (res?.success && res.data) {
          setContribution(res.data);
          setReviewNotes(res.data.review_notes || '');

          // Fetch original project model for comparison
          if (res.data.research_project_id) {
            try {
              const projectRes = await userAPI.getResearchProject(res.data.research_project_id);
              if (projectRes?.success && projectRes.data?.main_use_model_id) {
                const modelRes = await userAPI.getUseModelById(projectRes.data.main_use_model_id);
                if (modelRes?.success && modelRes.data) {
                  setOriginalModel(modelRes.data);
                }
              }
            } catch (modelErr) {
              console.error('Failed to fetch original model:', modelErr);
            }
          }
        } else {
          setError('Failed to load contribution');
        }
      } catch (err) {
        console.error('Fetch contribution error:', err);
        setError(err?.response?.data?.message || 'Failed to load contribution');
      } finally {
        setLoading(false);
      }
    };

    if (contributionId) {
      fetchData();
    }
  }, [contributionId]);

  // Check if current user is moderator or owner (will need project data for this)
  const canReview = useMemo(() => {
    // For now, we'll allow review if user is not the contributor
    // In a full implementation, you'd check if user is project owner/moderator
    if (!contribution) return false;
    return contribution.contributor_id !== currentUserId;
  }, [contribution, currentUserId]);

  const handleReview = async (action) => {
    if (submitting) return;
    if (!reviewNotes.trim() && action !== 'ACCEPTED') {
      push({
        title: 'Error',
        body: 'Please provide review notes',
      });
      return;
    }

    const confirmMsg =
      action === 'ACCEPTED'
        ? 'Accept this contribution?'
        : action === 'REJECTED'
          ? 'Reject this contribution?'
          : 'Request edits for this contribution?';

    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    try {
      const reviewData = {
        action,
        notes: reviewNotes.trim() || null,
        validation_report: validationError || null,
      };

      const res = await userAPI.reviewContribution(contributionId, reviewData);
      if (res?.success) {
        push({
          title: 'Review Submitted',
          body: `Contribution ${formatStatus(action).toLowerCase()} successfully`,
        });
        // Refresh contribution data
        const updated = await userAPI.getContributionById(contributionId);
        if (updated?.success && updated.data) {
          setContribution(updated.data);
        }
      } else {
        throw new Error(res?.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Review error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to submit review';

      // If error is validation error, refresh to show validation_report
      if (err?.response?.data?.success === false && err?.response?.data?.message) {
        push({
          title: 'Validation Error',
          body: 'UML validation failed. See validation report for details.',
        });
        // Refresh to get updated contribution with validation_report
        try {
          const updated = await userAPI.getContributionById(contributionId);
          if (updated?.success && updated.data) {
            setContribution(updated.data);
          }
        } catch (refreshErr) {
          console.error('Failed to refresh contribution:', refreshErr);
        }
      } else {
        push({
          title: 'Error',
          body: errorMessage,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'rgb(245, 158, 11)';
      case 'NEEDS_EDIT':
        return 'rgb(59, 130, 246)';
      case 'ACCEPTED':
        return 'rgb(34, 197, 94)';
      case 'REJECTED':
        return 'rgb(239, 68, 68)';
      default:
        return 'rgb(107, 114, 128)';
    }
  };

  if (loading) {
    return (
      <Section>
        <Card>
          <div className="contribution-detail-loading">Loading contribution...</div>
        </Card>
      </Section>
    );
  }

  if (error || !contribution) {
    return (
      <Section>
        <Card>
          <div className="contribution-detail-error">{error || 'Contribution not found'}</div>
          <button className="btn btn-signin btn-sm" onClick={() => navigate(-1)}>
            Back
          </button>
        </Card>
      </Section>
    );
  }

  const { useModel } = contribution;

  return (
    <Section>
      <Card>
        <div className="contribution-detail-header">
          <button className="btn btn-signin btn-sm" onClick={() => navigate(-1)}>
            <i className="fa fa-arrow-left" /> Back
          </button>
          <div
            className="contribution-detail-status-badge"
            style={{ backgroundColor: getStatusColor(contribution.status) }}
          >
            {formatStatus(contribution.status)}
          </div>
        </div>

        <div className="contribution-detail-content">
          <h2 className="contribution-detail-title">{contribution.title}</h2>

          <div className="contribution-detail-meta">
            <div className="contribution-detail-meta-item">
              <i className="fa fa-user" />
              <span>Contributor ID: {contribution.contributor_id}</span>
            </div>
            <div className="contribution-detail-meta-item">
              <i className="fa fa-calendar" />
              <span>Submitted: {fmtDate(contribution.created_at)}</span>
            </div>
            {contribution.updated_at !== contribution.created_at && (
              <div className="contribution-detail-meta-item">
                <i className="fa fa-clock" />
                <span>Updated: {fmtDate(contribution.updated_at)}</span>
              </div>
            )}
          </div>

          <Tabs
            tabs={[
              { value: 'details', label: 'Details' },
              { value: 'changes', label: 'Changes' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === 'details' && (
            <ContributionDetailsTab
              contribution={contribution}
              useModel={useModel}
              onValidationError={setValidationError}
            />
          )}

          {activeTab === 'changes' && (
            <ContributionChangesTab
              contribution={contribution}
              originalModel={originalModel}
              useModel={useModel}
              canReview={canReview}
              reviewNotes={reviewNotes}
              setReviewNotes={setReviewNotes}
              submitting={submitting}
              handleReview={handleReview}
              validationError={validationError}
            />
          )}

          {activeTab === 'details' && <ContributionComments contributionId={contributionId} />}
        </div>
      </Card>
    </Section>
  );
}
