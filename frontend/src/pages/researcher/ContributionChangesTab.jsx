import React from 'react';
import DashedDivider from '../../components/ui/DashedDivider';
import computeDiff from '../../utils/ComputeDiff';

import { useNavigate } from 'react-router-dom';

export default function ContributionChangesTab({
  contribution,
  originalModel,
  useModel,
  canReview,
  reviewNotes,
  setReviewNotes,
  submitting,
  handleReview,
  validationError,
  currentUserId,
}) {
  const navigate = useNavigate();
  const canResubmit =
    contribution.contributor_id === currentUserId && ['PENDING', 'NEEDS_EDIT'].includes(contribution.status);
  const renderDiff = () => {
    if (!originalModel || !useModel) {
      return <div className="contribution-diff-error">Unable to show changes - missing model data</div>;
    }

    const diffLines = computeDiff(originalModel.raw_text, useModel.raw_text, { context: 3, collapse: true });

    return (
      <div className="contribution-diff-container">
        <div className="contribution-diff-header">
          <div className="contribution-diff-legend">
            <span className="contribution-diff-legend-item">
              <span className="contribution-diff-legend-color contribution-diff-legend-added"></span>
              Added
            </span>
            <span className="contribution-diff-legend-item">
              <span className="contribution-diff-legend-color contribution-diff-legend-removed"></span>
              Removed
            </span>
          </div>
        </div>
        <pre className="contribution-diff-content">
          {diffLines.map((item, idx) => {
            if (item.type === 'skip') {
              return (
                <div key={idx} className="contribution-diff-line contribution-diff-line-skip">
                  <span className="contribution-diff-line-num">…</span>
                  <span className="contribution-diff-line-text">Skipped {item.skipCount} unchanged lines</span>
                </div>
              );
            }
            const lineNumDisplay = (() => {
              if (item.type === 'added') return `+${item.modLineNum}`;
              if (item.type === 'removed') return `-${item.origLineNum}`;
              if (item.type === 'unchanged') return `${item.origLineNum}`;
              return '';
            })();
            return (
              <div key={idx} className={`contribution-diff-line contribution-diff-line-${item.type}`}>
                <span className="contribution-diff-line-num">{lineNumDisplay}</span>
                <span className="contribution-diff-line-text">{item.line || ' '}</span>
              </div>
            );
          })}
        </pre>
      </div>
    );
  };

  return (
    <div className="contribution-detail-tab-content">
      <div className="contribution-detail-changes-section">
        <h3>Code Changes</h3>
        {renderDiff()}
      </div>

      {(contribution.validation_report || validationError) && (
        <>
          <DashedDivider />
          <div className="contribution-detail-validation-section">
            <h3>Validation Report</h3>
            <div className="contribution-detail-validation-error">
              <i className="fa fa-exclamation-triangle" /> {validationError || contribution.validation_report}
            </div>
            {validationError && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#991b1b' }}>
                <i className="fa fa-info-circle" /> This validation error will be saved when you submit your review.
              </div>
            )}
          </div>
        </>
      )}

      <DashedDivider />

      {canResubmit && (
        <div className="contribution-detail-resubmit-section">
          <h3>Edit Contribution</h3>
          <p className="contribution-detail-resubmit-hint">
            You can edit and resubmit this contribution to address feedback or fix validation errors.
          </p>
          <button
            className="btn btn-primary"
            onClick={() =>
              navigate(
                `/researcher/projects/${contribution.research_project_id}/contributions/${contribution.id}/resubmit`
              )
            }
          >
            <i className="fa fa-edit" /> Resubmit
          </button>
        </div>
      )}

      {canResubmit && <DashedDivider />}

      {canReview && contribution.status === 'PENDING' && (
        <div className="contribution-detail-review-form">
          <h3>Add Review Notes</h3>
          <textarea
            className="contribution-detail-textarea"
            placeholder="Add review notes (required for requesting edits or rejection)..."
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            disabled={submitting}
            rows={5}
          />
          <div className="contribution-detail-review-actions">
            <button className="btn btn-success" onClick={() => handleReview('ACCEPT')} disabled={submitting}>
              <i className="fa fa-check" /> Accept
            </button>
            <button className="btn btn-warning" onClick={() => handleReview('NEEDS_EDIT')} disabled={submitting}>
              <i className="fa fa-edit" /> Request Edits
            </button>
            <button className="btn btn-danger" onClick={() => handleReview('REJECT')} disabled={submitting}>
              <i className="fa fa-times" /> Reject
            </button>
          </div>
        </div>
      )}

      {!canReview && contribution.status === 'PENDING' && (
        <div className="contribution-detail-info">
          <i className="fa fa-info-circle" /> You cannot review your own contribution
        </div>
      )}

      {contribution.status !== 'PENDING' && (
        <div className="contribution-detail-info">
          <i className="fa fa-info-circle" /> This contribution has been reviewed
        </div>
      )}
    </div>
  );
}
