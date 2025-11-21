import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import UMLEditor from '../../components/ui/uml/UMLEditor';

export default function UMLEditorPage() {
  const [result, setResult] = useState(null);
  const { state } = useLocation();
  const initialModel = state?.model || null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: 12, borderBottom: '1px solid #eee' }}>
        <h2>UML Editor</h2>
      </header>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <UMLEditor initialModel={initialModel} onResult={(r) => setResult(r?.data || r)} />
        </div>
      </div>
    </div>
  );
}
