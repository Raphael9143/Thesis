import React from 'react';

export default function ChoicePopup({ choice, onAssociation, onGeneralization, onCancel }) {
  if (!choice) return null;
  return (
    <div className="uml-choice-popup" style={{ left: choice.x + 8, top: choice.y + 8 }}>
      <div className="uml-choice-title">Create relationship</div>
      <div className="uml-choice-actions">
        <button
          onClick={() => {
            if (onAssociation) onAssociation();
          }}
        >
          Association
        </button>
        <button
          onClick={() => {
            if (onGeneralization) onGeneralization();
          }}
        >
          Generalization
        </button>
        <button onClick={() => onCancel && onCancel()}>Cancel</button>
      </div>
    </div>
  );
}
