import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import userAPI from '../../../services/userAPI';
import formatStatus from '../../utils/FormatStatus';
import '../../assets/styles/pages/ContributionHistory.css';
import '../../assets/styles/components/ContributionCard.css';

export default function MyContributions() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  const currentPage = parseInt(searchParams.get('page')) || 1;

  useEffect(() => {
    let mounted = true;
    const fetchMyContributions = async () => {
      setLoading(true);
      try {
        const res = await userAPI.getMyProjectContributions(projectId, currentPage);
        if (mounted && res?.success) {
          if (Array.isArray(res.data)) {
            setContributions(res.data);
          }
          if (res.pagination) {
            setPagination({
              totalPages: res.pagination.totalPages,
              total: res.pagination.total,
            });
          }
        }
      } catch (err) {
        console.error('Fetch my contributions error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMyContributions();
    return () => {
      mounted = false;
    };
  }, [projectId, currentPage]);

  const getStatusColor = (status) => {
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
    return <div>Loading your contributions...</div>;
  }

  if (contributions.length === 0) {
    return <div className="project-detail-empty">You haven&apos;t made any contributions yet.</div>;
  }

  return (
    <>
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

      {pagination.totalPages > 1 && (
        <div className="contributions-pagination">
          <div className="pagination-indexes">
            <button
              className="pagination-prev"
              disabled={currentPage <= 1}
              onClick={() => setSearchParams({ page: Math.max(1, currentPage - 1) })}
            >
              <i className="fa-solid fa-backward"></i>
            </button>

            {Array.from({ length: pagination.totalPages }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  className={`pagination-button ${p === currentPage ? 'focus' : ''}`}
                  onClick={() => setSearchParams({ page: p })}
                  style={{ marginLeft: 6 }}
                >
                  {p}
                </button>
              );
            })}

            <button
              className="pagination-next"
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setSearchParams({ page: Math.min(pagination.totalPages, currentPage + 1) })}
              style={{ marginLeft: 8 }}
            >
              <i className="fa-solid fa-forward"></i>
            </button>
          </div>
          <div className="contributions-pagination-info">
            <span style={{ marginLeft: 12 }}>
              Page {currentPage} / {pagination.totalPages} - {pagination.total} contributions
            </span>
          </div>
        </div>
      )}
    </>
  );
}
