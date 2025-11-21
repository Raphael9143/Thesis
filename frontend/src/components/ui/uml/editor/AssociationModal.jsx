import React from 'react';

export default function AssociationModal({ assoc, onChange, onClose, onSave }) {
  if (!assoc) return null;
  return (
    <div className="uml-modal-overlay" onClick={() => onClose && onClose()}>
      <div className="uml-modal" onClick={(e) => e.stopPropagation()}>
        <div className="uml-modal-title">Association details</div>
        <div className="uml-modal-row">
          <div>
            <label className="uml-modal-label">Left multiplicity</label>
            <input
              className="uml-modal-input"
              value={assoc.left}
              onChange={(e) => onChange && onChange({ ...assoc, left: e.target.value })}
            />
          </div>
          <div>
            <label className="uml-modal-label">Right multiplicity</label>
            <input
              className="uml-modal-input"
              value={assoc.right}
              onChange={(e) => onChange && onChange({ ...assoc, right: e.target.value })}
            />
          </div>
        </div>
        <div className="uml-modal-section">
          <label className="uml-modal-label">Name (optional)</label>
          <input
            className="uml-modal-input"
            value={assoc.name}
            onChange={(e) => onChange && onChange({ ...assoc, name: e.target.value })}
          />
        </div>
        <div className="uml-modal-actions">
          <button onClick={() => onClose && onClose()} title="Cancel">
            <i className="fa fa-times" /> Cancel
          </button>
          <button onClick={() => onSave && onSave(assoc)} title="Create association">
            <i className="fa fa-save" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
