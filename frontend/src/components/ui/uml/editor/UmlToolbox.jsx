import React from 'react';

export default function UmlToolbox({ onToolDragStart }) {
  return (
    <div className="uml-toolbox">
      <div className="uml-toolbox-title">Toolbox</div>
      <div
        className="uml-tool-item"
        draggable
        onDragStart={(e) => onToolDragStart(e, 'class')}
        title="Add Class"
        aria-label="Drag to add class"
      >
        {/* UML class icon: rectangle with header and attributes compartment */}
        <svg width="64" height="44" viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="62" height="42" fill="#fff8b4" stroke="#0000ff" strokeWidth="1" />
          <line x1="1" y1="14" x2="63" y2="14" stroke="#0000ff" strokeWidth="1" />
          <line x1="1" y1="28" x2="63" y2="28" stroke="#ddd" strokeWidth="1" />
          <text x="16" y="9" fontSize="6" fontFamily="sans-serif" fill="#111">
            {'ClassName'}
          </text>
          <text x="8" y="24" fontSize="6" fontFamily="sans-serif" fill="#444">
            {'+ attr : Type'}
          </text>
          <text x="8" y="38" fontSize="6" fontFamily="sans-serif" fill="#444">
            {'+ other : Type'}
          </text>
        </svg>
      </div>

      <div
        className="uml-tool-item"
        draggable
        onDragStart={(e) => onToolDragStart(e, 'enum')}
        title="Add Enumeration"
        aria-label="Drag to add enumeration"
      >
        {/* UML enumeration icon: stereotype + values */}
        <svg width="64" height="44" viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="6" width="62" height="36" fill="#fff8b4" stroke="#0000ff" strokeWidth="1" />
          <text x="9" y="14 " fontSize="6" fontFamily="sans-serif" fill="#666">
            {'<<enumeration>>'}
          </text>
          <line x1="1" y1="18" x2="63" y2="18" stroke="#0000ff" strokeWidth="1" />
          <text x="8" y="27" fontSize="6" fontFamily="sans-serif" fill="#444">
            {'VALUE1'}
          </text>
          <text x="8" y="36" fontSize="6" fontFamily="sans-serif" fill="#444">
            {'VALUE2'}
          </text>
        </svg>
      </div>
    </div>
  );
}
