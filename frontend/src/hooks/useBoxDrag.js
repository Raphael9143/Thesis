import { useRef, useEffect } from 'react';

// Hook to manage dragging of boxes (classes/enums)
// Inputs:
// - setPositions: function to update positions state ({ name: {x,y} })
// - positionsRef (optional): ref to current positions if needed
// - containerRef: ref to container for coordinate transforms
// Returns: { startDrag }
const useBoxDrag = ({ setPositions, containerRef, positionsRef }) => {
  const draggingRef = useRef(null);

  useEffect(() => {
    const getXY = (ev) => {
      if (ev.touches && ev.touches[0])
        return { clientX: ev.touches[0].clientX, clientY: ev.touches[0].clientY };
      return { clientX: ev.clientX, clientY: ev.clientY };
    };

    function onMove(e) {
      const { clientX, clientY } = getXY(e);
      if (!draggingRef.current) return;
      const { name, startX, startY, origX, origY } = draggingRef.current;
      const nx = origX + (clientX - startX);
      const ny = origY + (clientY - startY);
      setPositions((prev) => ({ ...prev, [name]: { x: nx, y: ny } }));
    }

    function onUp() {
      draggingRef.current = null;
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
  }, [setPositions, containerRef]);

  const startDrag = (name, e) => {
    // If the drag originated from a connector handle or edit control, don't start box drag
    try {
      const tgt = e.target;
      if (tgt && tgt.closest && tgt.closest('.uml-connector')) return;
      if (tgt && tgt.closest && tgt.closest('.uml-edit-btn')) return;
    } catch {
      // ignore
    }
    const clientX = (e.touches && e.touches[0] && e.touches[0].clientX) || e.clientX;
    const clientY = (e.touches && e.touches[0] && e.touches[0].clientY) || e.clientY;
    draggingRef.current = {
      name,
      startX: clientX,
      startY: clientY,
      origX: (positionsRef && positionsRef.current && positionsRef.current[name]?.x) || 0,
      origY: (positionsRef && positionsRef.current && positionsRef.current[name]?.y) || 0,
    };
    if (e.pointerId && e.currentTarget && e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  return { startDrag };
};

export default useBoxDrag;
