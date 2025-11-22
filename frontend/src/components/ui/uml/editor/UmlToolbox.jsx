import React from 'react';

export default function UmlToolbox({ onToolDragStart, onExport }) {
  return (
    <div className="uml-toolbox">
      <div className="uml-toolbox-title">Toolbox</div>
      <div className="uml-tool-item" draggable onDragStart={(e) => onToolDragStart(e, 'class')}>
        Class
      </div>
      <div className="uml-tool-item" draggable onDragStart={(e) => onToolDragStart(e, 'enum')}>
        Enum
      </div>
      <span onClick={onExport}>Export</span>
    </div>
  );
}
