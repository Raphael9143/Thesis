import { useCallback, useEffect, useState } from 'react';

function uid(prefix = 'a') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function useLinkDrag({
  positionsRef,
  containerRef,
  BOX_W = 220,
  BOX_MIN_H = 60,
  onAddAssociation,
  onAddGeneralization,
}) {
  const [linkDrag, setLinkDrag] = useState(null);
  const [choice, setChoice] = useState(null);
  const [assocModal, setAssocModal] = useState(null);

  const startLinkDrag = useCallback(
    (ev, fromName) => {
      ev.stopPropagation();
      const rect = containerRef.current?.getBoundingClientRect();
      setLinkDrag({
        from: fromName,
        x: (ev.clientX || 0) - (rect?.left || 0),
        y: (ev.clientY || 0) - (rect?.top || 0),
      });
    },
    [containerRef]
  );

  useEffect(() => {
    if (!linkDrag) return undefined;
    const onMove = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const x = (e.clientX || 0) - (rect?.left || 0);
      const y = (e.clientY || 0) - (rect?.top || 0);
      setLinkDrag((l) => ({ ...l, x, y }));
    };
    const onUp = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const x = (e.clientX || 0) - (rect?.left || 0);
      const y = (e.clientY || 0) - (rect?.top || 0);
      let target = null;
      const positions = positionsRef.current || {};
      Object.keys(positions).forEach((name) => {
        const left = positions[name].x;
        const top = positions[name].y;
        const right = left + BOX_W;
        const bottom = top + BOX_MIN_H;
        if (x >= left && x <= right && y >= top && y <= bottom) target = name;
      });
      // allow creating associations back onto the same class (self-association)
      if (target) setChoice({ from: linkDrag.from, to: target, x, y });
      setLinkDrag(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [linkDrag, containerRef, positionsRef, BOX_W, BOX_MIN_H]);

  const addAssociation = useCallback(
    (assoc) => {
      if (!assoc) return;
      const a = typeof assoc === 'object' ? { ...assoc } : assoc;
      if (!a.id) a.id = uid('a');
      // ensure type is present (default to plain association)
      a.type = a.type || 'association';
      // normalize parts: ensure parts array exists and each part has class/multiplicity/role
      a.parts = Array.isArray(a.parts)
        ? a.parts.map((p, i) => ({
            class: p.class || p.name || '',
            multiplicity: p.multiplicity || p.mult || p.mult || '',
            role: p.role || p.name || `p${i}`,
          }))
        : [];
      if (typeof onAddAssociation === 'function') onAddAssociation(a);
    },
    [onAddAssociation]
  );

  const addGeneralization = useCallback(
    (sub, sup) => {
      if (typeof onAddGeneralization === 'function') onAddGeneralization(sub, sup);
    },
    [onAddGeneralization]
  );

  return {
    linkDrag,
    startLinkDrag,
    choice,
    setChoice,
    assocModal,
    setAssocModal,
    addAssociation,
    addGeneralization,
  };
}
