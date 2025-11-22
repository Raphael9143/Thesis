import React from 'react';

function IconButton({ title, onClick, children }) {
  return (
    <button
      type="button"
      className="uml-choice-btn"
      title={title}
      onClick={onClick}
      style={{ background: 'transparent', border: 'none', padding: 6, cursor: 'pointer' }}
    >
      {children}
    </button>
  );
}

export default function ChoicePopup({ choice, onPickType, onGeneralization, onCancel }) {
  if (!choice) return null;
  return (
    <div className="uml-choice-popup" style={{ left: choice.x + 8, top: choice.y + 8 }}>
      <div className="uml-choice-title">
        {'Choose Relationship Type'}
        <span className="uml-choice-cancel" onClick={() => onCancel && onCancel()}>
          <i className="fa fa-times" />
        </span>
      </div>
      <div className="uml-choice-actions" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <IconButton title="Association" onClick={() => onPickType && onPickType('association')}>
          <svg width="48" height="16" viewBox="0 0 48 16" className="uml-choice-svg">
            <line x1="4" y1="8" x2="44" y2="8" stroke="#222" strokeWidth="2" />
          </svg>
        </IconButton>

        <IconButton title="Aggregation" onClick={() => onPickType && onPickType('aggregation')}>
          <svg width="48" height="16" viewBox="0 0 48 16" className="uml-choice-svg">
            <polygon points="8,8 12,4 16,8 12,12" fill="white" stroke="#222" strokeWidth="1.5" />
            <line x1="16" y1="8" x2="44" y2="8" stroke="#222" strokeWidth="2" />
          </svg>
        </IconButton>

        <IconButton title="Composition" onClick={() => onPickType && onPickType('composition')}>
          <svg width="48" height="16" viewBox="0 0 48 16" className="uml-choice-svg">
            <polygon points="8,8 12,4 16,8 12,12" fill="#222" stroke="#222" strokeWidth="1.5" />
            <line x1="16" y1="8" x2="44" y2="8" stroke="#222" strokeWidth="2" />
          </svg>
        </IconButton>

        <IconButton title="N-ary" onClick={() => onPickType && onPickType('n-ary')}>
          <svg width="36" height="24" viewBox="0 0 36 24" className="uml-choice-svg">
            <polygon points="18,4 26,12 18,20 10,12" fill="white" stroke="#222" strokeWidth="1.5" />
          </svg>
        </IconButton>

        <IconButton title="Association Class" onClick={() => onPickType && onPickType('associationclass')}>
          <svg width="56" height="24" viewBox="0 0 56 24" className="uml-choice-svg">
            <line x1="4" y1="12" x2="30" y2="12" stroke="#222" strokeWidth="2" />
            <rect x="34" y="4" width="18" height="16" fill="white" stroke="#222" strokeWidth="1.5" />
          </svg>
        </IconButton>

        <IconButton title="Generalization" onClick={() => onGeneralization && onGeneralization()}>
          <svg width="48" height="16" viewBox="0 0 48 16" className="uml-choice-svg">
            <polygon points="40,8 32,4 32,12" fill="white" stroke="#222" strokeWidth="1.5" />
            <line x1="4" y1="8" x2="32" y2="8" stroke="#222" strokeWidth="2" />
          </svg>
        </IconButton>
      </div>
    </div>
  );
}
