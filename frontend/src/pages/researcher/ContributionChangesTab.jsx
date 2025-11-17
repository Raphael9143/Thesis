import React from 'react';
import DashedDivider from '../../components/ui/DashedDivider';
import computeDiff from '../../utils/ComputeDiff';

export default function ContributionChangesTab({
  contribution,
  originalModel,
  useModel,
  canReview,
  reviewNotes,
  setReviewNotes,
  submitting,
  handleReview,
}) {
  const renderDiff = () => {
    if (!originalModel || !useModel) {
      return <div className="contribution-diff-error">Unable to show changes - missing model data</div>;
    }

    const diffLines = computeDiff(originalModel.raw_text, useModel.raw_text);

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
          {diffLines.map((item, idx) => (
            <div key={idx} className={`contribution-diff-line contribution-diff-line-${item.type}`}>
              <span className="contribution-diff-line-num">{item.lineNum}</span>
              <span className="contribution-diff-line-text">{item.line || ' '}</span>
            </div>
          ))}
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

      <DashedDivider />

      {canReview && contribution.status === 'PENDING' && (
        <div className="contribution-detail-review-form">
          <h3>Add a Comment</h3>
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
