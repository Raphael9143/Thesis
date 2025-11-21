import React, { createContext, useContext } from 'react';

const UmlEditorContext = createContext(null);

export function useUmlEditor() {
  const ctx = useContext(UmlEditorContext);
  if (!ctx) throw new Error('useUmlEditor must be used within a UmlEditorContext.Provider');
  return ctx;
}

export default UmlEditorContext;
