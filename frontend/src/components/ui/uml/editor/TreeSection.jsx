import React from 'react';

export default function TreeSection({ title, isOpen, onToggle, children, count, onAdd }) {
  return (
    <div className="uml-tree-item section">
      <div className="uml-tree-section-header">
        <span className="uml-tree-label" onClick={onToggle} role="button" tabIndex={0}>
          {typeof isOpen === 'boolean' ? (
            <i
              className={`fa-regular ${isOpen ? 'fa-folder-open' : 'fa-folder-closed'} uml-tree-toggle`}
            />
          ) : (
            <i className="uml-tree-toggle-empty" />
          )}
          <span className="uml-tree-text">
            {title}
            {typeof count === 'number' ? ` (${count})` : ''}
          </span>
        </span>
        {onAdd && (
          <span
            className="btn-ghost"
            title={`Add ${title}`}
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
          >
            <i className="fa-solid fa-plus" />
          </span>
        )}
      </div>
      <div className={`uml-tree-subchildren ${isOpen ? 'open' : 'collapsed'}`}>{children}</div>
    </div>
  );
}
