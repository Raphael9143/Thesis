import React from 'react';

export default function TreeLeaf({ label, onClick, indent = 12 }) {
  return (
    <div className="uml-tree-item leaf" style={{ paddingLeft: indent }}>
      <span className="uml-tree-label leaf-label" onClick={onClick} role="button" tabIndex={0}>
        <span className="uml-tree-text">{label}</span>
      </span>
    </div>
  );
}
