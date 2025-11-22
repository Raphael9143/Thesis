import React from 'react';
import { useLocation } from 'react-router-dom';
import UMLEditor from '../../components/ui/uml/UMLEditor';

export default function UMLEditorPage() {
  const { state } = useLocation();
  const initialModel = state?.model || null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <UMLEditor initialModel={initialModel} />
        </div>
      </div>
    </div>
  );
}
