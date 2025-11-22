import React from 'react';

export default function OperationModal({ draft, onChange, onCancel, onCreate }) {
  if (!draft) return null;
  return (
    <div className="uml-modal-overlay" onClick={onCancel}>
      <div className="uml-modal uml-modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="uml-modal-title">New Operation</div>
        <div className="uml-modal-section">
          <label className="uml-modal-label">Name</label>
          <input
            className="uml-modal-input"
            placeholder="operationName"
            value={draft.name || ''}
            onChange={(e) => onChange && onChange({ ...draft, name: e.target.value })}
          />
        </div>
        <div className="uml-modal-section">
          <label className="uml-modal-label">Signature / parameters</label>
          <input
            className="uml-modal-input"
            placeholder="param1:Type, param2:Type -> ReturnType"
            value={draft.signature || ''}
            onChange={(e) => onChange && onChange({ ...draft, signature: e.target.value })}
          />
        </div>
        <div className="uml-modal-actions">
          <button onClick={onCancel} title="Cancel">
            <i className="fa fa-times" /> Cancel
          </button>
          <button onClick={() => onCreate && onCreate(draft)} title="Create operation">
            <i className="fa fa-save" /> Create
          </button>
        </div>
      </div>
    </div>
  );
}
