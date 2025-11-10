import { useMemo } from 'react';

// Compute multiplicity label positions for associations
// Inputs:
// - associations: array
// - centerOf: function(name) -> {x,y}
// - getRect: function(name) -> rect or null
// - perpOffset: utility
// - offsetAlong, intersectBorder: utilities
const useMultiplicityPositions = (associations, centerOf, getRect, { perpOffset, offsetAlong, intersectBorder }) =>
  useMemo(() => {
    const mp = {};
    associations.forEach((a, i) => {
      const left = a.parts?.[0];
      const right = a.parts?.[1];
      if (!left || !right) return;
      const leftName = left.class;
      const rightName = right.class;
      const c1 = centerOf(leftName);
      const c2 = centerOf(rightName);
      const rect1 = getRect(leftName);
      const rect2 = getRect(rightName);
      const p1 = rect1 ? intersectBorder(rect1, c1, c2) : offsetAlong(c1, c2, 14);
      const p2 = rect2 ? intersectBorder(rect2, c2, c1) : offsetAlong(c2, c1, 14);
      mp[`${i}:left`] = perpOffset(p1, c1, c2, 14, 6);
      mp[`${i}:right`] = perpOffset(p2, c2, c1, 14, 6);
    });
    return mp;
  }, [associations, centerOf, getRect, perpOffset, offsetAlong, intersectBorder]);

export default useMultiplicityPositions;
