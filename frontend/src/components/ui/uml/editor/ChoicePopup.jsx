import React from 'react';

export default function ChoicePopup({ choice, onPickType, onGeneralization, onCancel }) {
  if (!choice) return null;
  return (
    <div className="uml-choice-popup" style={{ left: choice.x + 8, top: choice.y + 8 }}>
      <div className="uml-choice-title">Create relationship</div>
      <div className="uml-choice-actions">
        <button onClick={() => onPickType && onPickType('association')}>Association</button>
        <button onClick={() => onPickType && onPickType('aggregation')}>Aggregation</button>
        <button onClick={() => onPickType && onPickType('composition')}>Composition</button>
        <button onClick={() => onPickType && onPickType('n-ary')}>N-ary</button>
        <button onClick={() => onPickType && onPickType('associationclass')}>AssociationClass</button>
        <button onClick={() => onGeneralization && onGeneralization()}>Generalization</button>
        <button onClick={() => onCancel && onCancel()}>Cancel</button>
      </div>
    </div>
  );
}
