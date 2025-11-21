import { useCallback, useState } from 'react';

function uid(prefix = 'con') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function parseConstraintRaw(rawText) {
  const raw = (rawText || '').trim();
  const m = raw.match(/^(?:(inv|pre|post)\s*[:\-\s]+)?(?:(\w+)\s*[:\-\s]+)?([\s\S]+)$/i);
  let type = 'inv';
  let owner = null;
  let expr = raw;
  if (m) {
    if (m[1]) type = m[1].toLowerCase();
    if (m[2]) owner = m[2];
    expr = (m[3] || '').trim();
  }
  return { type, owner, expr };
}

export default function useConstraints(initial = []) {
  const [constraints, setConstraints] = useState(Array.isArray(initial) ? initial : []);
  const [constraintDraft, setConstraintDraft] = useState(null);

  const openConstraintModal = useCallback((draft = null) => {
    setConstraintDraft(draft || { id: uid('con'), type: 'inv', name: '', expression: '', ownerClass: null });
  }, []);

  const createConstraint = useCallback(
    (rawText) => {
      const p = parseConstraintRaw(rawText);
      const con = {
        id: constraintDraft?.id || uid('con'),
        type: p.type || 'inv',
        name: '',
        expression: p.expr || '',
        ownerClass: p.owner || null,
      };
      setConstraints((s) => [...s, con]);
      setConstraintDraft(null);
      return con;
    },
    [constraintDraft]
  );

  const deleteConstraint = useCallback((id) => {
    setConstraints((s) => (s || []).filter((c) => c.id !== id));
  }, []);

  return {
    constraints,
    setConstraints,
    constraintDraft,
    setConstraintDraft,
    openConstraintModal,
    createConstraint,
    deleteConstraint,
  };
}
