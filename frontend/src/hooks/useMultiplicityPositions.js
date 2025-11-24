import { useMemo } from 'react';

// Compute multiplicity label positions for associations
// Inputs:
// - associations: array
// - centerOf: function(name) -> {x,y}
// - getRect: function(name) -> rect or null
// - perpOffset: utility
// - offsetAlong, intersectBorder: utilities
const useMultiplicityPositions = (
  associations,
  centerOf,
  getRect,
  { perpOffset, offsetAlong, intersectBorder }
) =>
  useMemo(() => {
    const mp = {};
    associations.forEach((a, i) => {
      const parts = Array.isArray(a.parts) ? a.parts : [];
      const centers = parts.map((p) => ({
        name: p.class,
        center: centerOf(p.class),
        rect: getRect(p.class),
        raw: p,
      }));
      // for each part compute multiplicity position
      centers.forEach((c, idx) => {
        if (!c.center) return;
        const otherCenters = centers.filter((x) => x !== c && x.center).map((x) => x.center);
        let anchorTarget = null;
        if (otherCenters.length > 0) {
          // choose the first other center as a target for direction
          anchorTarget = otherCenters[0];
        } else {
          anchorTarget = { x: c.center.x + 20, y: c.center.y };
        }
        const p = c.rect
          ? intersectBorder(c.rect, c.center, anchorTarget)
          : offsetAlong(c.center, anchorTarget, 14);
        mp[`${i}:${idx}`] = perpOffset(p, c.center, anchorTarget, 14, 6);
      });
    });
    return mp;
  }, [associations, centerOf, getRect, perpOffset, offsetAlong, intersectBorder]);

export default useMultiplicityPositions;
