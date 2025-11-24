import React from 'react';

export default function ConstraintModal({ draft, onChange, onCancel, onCreate }) {
  if (!draft) return null;
  return (
    <div className="uml-modal-overlay" onClick={onCancel}>
      <div className="uml-modal uml-modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="uml-modal-title">New Constraint</div>
        <div className="uml-modal-section">
          <label className="uml-modal-label">Constraint (single-line header optional)</label>
          <textarea
            rows={4}
            className="uml-modal-input"
            placeholder={
              `Optional: prefix with ` +
              '`inv: ClassName: `' +
              ` or ` +
              '`pre: ClassName: `' +
              `, then the expression`
            }
            value={draft.expression || ''}
            onChange={(e) => onChange && onChange(e.target.value)}
          />
        </div>
        <div className="uml-modal-actions">
          <button onClick={onCancel} title="Cancel">
            <i className="fa fa-times" /> Cancel
          </button>
          <button
            onClick={() => onCreate && onCreate(draft.expression || '')}
            title="Create constraint"
          >
            <i className="fa fa-save" /> Create
          </button>
        </div>
      </div>
    </div>
  );
}
