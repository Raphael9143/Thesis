import React from 'react';

export default function ConstraintList({ constraints = [], onDelete }) {
  if (!Array.isArray(constraints) || constraints.length === 0) return null;
  return (
    <div className="uml-constraint-list">
      <div className="uml-constraint-list-title">Constraints</div>
      <div className="uml-constraint-items">
        {constraints.map((c) => (
          <div className="uml-constraint-item" key={c.id}>
            <div className="uml-constraint-meta">
              <strong>{c.type}</strong>
              <span className="uml-constraint-owner">{c.ownerClass ? ` on ${c.ownerClass}` : ''}</span>
            </div>
            <div className="uml-constraint-expr">{c.expression}</div>
            <div className="uml-constraint-actions">
              <button className="btn btn-sm" onClick={() => onDelete && onDelete(c.id)}>
                <i className="fa fa-trash" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
