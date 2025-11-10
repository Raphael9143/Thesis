import React from 'react';

const UMLHeader = ({ model, onClose }) => (
  <div className="uml-modal-header">
    <div style={{ fontWeight: 700 }}>{model?.model || 'Model'}</div>
    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
      <a className="close-uml-button" onClick={onClose} title="Close preview">
        <i className="fa-solid fa-xmark" />
      </a>
    </div>
  </div>
);

export default UMLHeader;
