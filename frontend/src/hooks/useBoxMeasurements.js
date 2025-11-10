import { useCallback } from 'react';

// Hook: compute centers and rects for boxes using refs + positions
// Inputs:
// - boxRefs: ref object that maps name -> DOM element
// - positions: map name -> {x,y} top-left positions used for layout
// - containerRef: ref to the container element used to compute relative coords
// - BOX_W, BOX_MIN_H: fallbacks for width/height when element not yet measured
// Returns: { centerOf(name): {x,y}, getRect(name): {left,top,width,height} | null }
const useBoxMeasurements = ({ boxRefs, positions, containerRef, BOX_W = 220, BOX_MIN_H = 60 }) => {
  const centerOf = useCallback(
    (name) => {
      const p = positions[name] || { x: 0, y: 0 };
      const el = (boxRefs && boxRefs.current && (boxRefs.current[name] || boxRefs.current[`enum:${name}`])) || null;
      const w = (el && el.offsetWidth) || BOX_W;
      const h = (el && el.offsetHeight) || BOX_MIN_H;
      return { x: p.x + w / 2, y: p.y + h / 2 };
    },
    [positions, boxRefs, BOX_W, BOX_MIN_H]
  );

  const getRect = useCallback(
    (name) => {
      const el = (boxRefs && boxRefs.current && (boxRefs.current[name] || boxRefs.current[`enum:${name}`])) || null;
      if (!el || !containerRef?.current) return null;
      const r = el.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      return { left: r.left - containerRect.left, top: r.top - containerRect.top, width: r.width, height: r.height };
    },
    [boxRefs, containerRef]
  );

  return { centerOf, getRect };
};

export default useBoxMeasurements;
