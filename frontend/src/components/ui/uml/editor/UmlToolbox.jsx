import React from 'react';

export default function UmlToolbox({ onToolDragStart, onExport, onOpenConstraintModal }) {
  return (
    <div className="uml-toolbox">
      <div className="uml-toolbox-title">Toolbox</div>
      <div className="uml-tool-item" draggable onDragStart={(e) => onToolDragStart(e, 'class')}>
        Class
      </div>
      <div className="uml-tool-item" draggable onDragStart={(e) => onToolDragStart(e, 'enum')}>
        Enum
      </div>

      <div className="uml-toolbox-subtitle">Constraints</div>
      <div className="uml-tool-item" onClick={() => onOpenConstraintModal && onOpenConstraintModal()}>
        New Constraint
      </div>

      <div className="uml-toolbox-actions">
        <button className="btn btn-primary btn-sm" onClick={onExport}>
          Export
        </button>
      </div>
    </div>
  );
}
