import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import userAPI from '../../../services/userAPI';
import formatStatus from '../../utils/FormatStatus';
import '../../assets/styles/pages/ContributionHistory.css';
import '../../assets/styles/components/ContributionCard.css';

export default function ContributionHistory() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchContributions = async () => {
      setLoading(true);
      try {
        const res = await userAPI.getResearchProjectContributions(projectId);
        if (mounted && res?.success && Array.isArray(res.data)) {
          setContributions(res.data);
        }
      } catch (err) {
        console.error('Fetch contributions error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchContributions();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  const getStatusColor = (status) => {
    console.log('Status:', formatStatus(status));
    switch (status) {
      case 'PENDING':
        return '#f59e0b'; // amber
      case 'NEEDS_EDIT':
        return '#3b82f6'; // blue
      case 'ACCEPTED':
        return '#10b981'; // green
      case 'REJECTED':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  if (loading) {
    return <div>Loading contributions...</div>;
  }

  if (contributions.length === 0) {
    return <div className="project-detail-empty">No contributions yet.</div>;
  }

  return (
    <div className="contributions-list">
      {contributions.map((contrib) => (
        <div
          key={contrib.id}
          className="contribution-card"
          onClick={() => navigate(`/researcher/contributions/${contrib.id}`)}
          style={{ cursor: 'pointer' }}
        >
          <div className="contribution-card-header">
            <h3 className="contribution-card-title">{contrib.title}</h3>
            <span className="contribution-card-status" style={{ backgroundColor: getStatusColor(contrib.status) }}>
              {formatStatus(contrib.status)}
            </span>
          </div>
          {contrib.description && <p className="contribution-card-description">{contrib.description}</p>}
          <div className="contribution-card-meta">
            <span className="contribution-card-contributor">
              <i className="fa fa-user" /> {contrib.contributor?.full_name || 'Unknown'}
            </span>
            <span className="contribution-card-date">
              <i className="fa fa-calendar" /> {new Date(contrib.created_at).toLocaleDateString()}
            </span>
          </div>
          {contrib.review_notes && (
            <div className="contribution-card-notes">
              <strong>Review Notes:</strong> {contrib.review_notes}
            </div>
          )}
          {contrib.validation_report && (
            <div className="contribution-card-validation">
              <strong>Validation:</strong> {contrib.validation_report}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
