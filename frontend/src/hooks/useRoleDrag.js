import { useRef, useState, useEffect } from 'react';

// Hook to manage role label dragging and preview target calculation
// Inputs:
// - associations: array
// - boxRefs: ref mapping names to DOM elements
// - containerRef: ref to container element
// - initialPositions: an object or null
// Returns: { rolePositions, setRolePositions, startRoleDrag, roleActiveKey, rolePreviewTarget }
const useRoleDrag = ({ boxRefs, containerRef, initialPositions = {} }) => {
  const roleDraggingRef = useRef(null);
  const [rolePositions, setRolePositions] = useState(initialPositions || {});
  const [rolePreviewTarget, setRolePreviewTarget] = useState(null);
  const [roleActiveKey, setRoleActiveKey] = useState(null);

  useEffect(() => {
    const getXY = (ev) => {
      if (ev.touches && ev.touches[0]) return { clientX: ev.touches[0].clientX, clientY: ev.touches[0].clientY };
      return { clientX: ev.clientX, clientY: ev.clientY };
    };

    function onMove(e) {
      const { clientX, clientY } = getXY(e);
      if (!roleDraggingRef.current) return;
      const r = roleDraggingRef.current;
      const dx = clientX - r.startX;
      const dy = clientY - r.startY;
      const nx = r.origX + dx;
      const ny = r.origY + dy;
      const ownerEl = boxRefs.current[r.ownerName];
      if (ownerEl && containerRef.current) {
        const ownerRect = ownerEl.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const center = {
          x: ownerRect.left - containerRect.left + ownerRect.width / 2,
          y: ownerRect.top - containerRect.top + ownerRect.height / 2,
        };
        const maxDist = Math.max(ownerRect.width, ownerRect.height) / 2 + 120;
        const vx = nx - center.x;
        const vy = ny - center.y;
        const dist = Math.sqrt(vx * vx + vy * vy);
        let cx = nx;
        let cy = ny;
        if (dist > maxDist) {
          const ratio = maxDist / dist;
          cx = center.x + vx * ratio;
          cy = center.y + vy * ratio;
        }
        setRolePositions((prev) => ({ ...prev, [r.key]: { x: cx, y: cy } }));
        let nearest = null;
        let bestD = Infinity;
        Object.keys(boxRefs.current).forEach((k) => {
          const el = boxRefs.current[k];
          if (!el) return;
          const rc = el.getBoundingClientRect();
          const cx2 = rc.left - containerRect.left + rc.width / 2;
          const cy2 = rc.top - containerRect.top + rc.height / 2;
          const dd = Math.hypot(cx2 - cx, cy2 - cy);
          if (dd < bestD) {
            bestD = dd;
            nearest = k;
          }
        });
        if (bestD < 100) setRolePreviewTarget(nearest);
        else setRolePreviewTarget(null);
      } else {
        setRolePositions((prev) => ({ ...prev, [r.key]: { x: nx, y: ny } }));
      }
    }

    function onUp() {
      roleDraggingRef.current = null;
      setRoleActiveKey(null);
      setRolePreviewTarget(null);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [boxRefs, containerRef]);

  const startRoleDrag = (key, ownerName, e) => {
    e.stopPropagation();
    e.preventDefault();
    const clientXY =
      e.touches && e.touches[0]
        ? { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
        : { clientX: e.clientX, clientY: e.clientY };
    const { clientX, clientY } = clientXY;
    const pos = rolePositions[key] || { x: 0, y: 0 };
    roleDraggingRef.current = { key, ownerName, startX: clientX, startY: clientY, origX: pos.x, origY: pos.y };
    setRoleActiveKey(key);
    if (e.pointerId && e.currentTarget && e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  return { rolePositions, setRolePositions, startRoleDrag, roleActiveKey, rolePreviewTarget };
};

export default useRoleDrag;
