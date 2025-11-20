import React from 'react';
import { intersectBorder } from '../../../utils/umlUtils';

const UMLCanvas = ({
  associations,
  classes = [],
  centerOf,
  getRect,
  roleActiveKey,
  rolePositions,
  rolePreviewTarget,
}) => (
  <svg className="uml-canvas-svg" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
    {/* Draw generalizations (inheritance) first */}
    {Array.isArray(classes) &&
      classes.map((c, idx) => {
        const subsName = c.name;
        const subsRect = getRect(subsName);
        const subsCenter = centerOf(subsName);
        if (!c.superclasses || !Array.isArray(c.superclasses)) return null;
        return c.superclasses.map((supName, sidx) => {
          const supRect = getRect(supName);
          const supCenter = centerOf(supName);
          if (!subsCenter || !supCenter) return null;
          const pFrom = subsRect ? intersectBorder(subsRect, subsCenter, supCenter) : subsCenter;
          const pTo = supRect ? intersectBorder(supRect, supCenter, subsCenter) : supCenter;
          // base point for triangle a little before tip
          const dirX = pTo.x - pFrom.x;
          const dirY = pTo.y - pFrom.y;
          const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
          const base = { x: pTo.x - (dirX / len) * 14, y: pTo.y - (dirY / len) * 14 };
          const nx = (-dirY / len) * 8;
          const ny = (dirX / len) * 8;
          const pLeft = { x: base.x + nx, y: base.y + ny };
          const pRight = { x: base.x - nx, y: base.y - ny };

          return (
            <g key={`gen-${idx}-${sidx}`}>
              <line x1={pFrom.x} y1={pFrom.y} x2={base.x} y2={base.y} stroke="#333" strokeWidth={2} />
              <polygon
                points={`${pTo.x},${pTo.y} ${pLeft.x},${pLeft.y} ${pRight.x},${pRight.y}`}
                fill="#fff"
                stroke="#333"
                strokeWidth={2}
              />
            </g>
          );
        });
      })}

    {/* Draw associations (simple lines) */}
    {associations.map((a, idx) => {
      const left = a.parts?.[0];
      const right = a.parts?.[1];
      if (!left || !right) return null;
      const leftName = left.class;
      const rightName = right.class;
      const c1 = centerOf(leftName);
      const c2 = centerOf(rightName);
      const rect1 = getRect(leftName);
      const rect2 = getRect(rightName);
      const p1 = rect1 ? intersectBorder(rect1, c1, c2) : c1;
      const p2 = rect2 ? intersectBorder(rect2, c2, c1) : c2;
      return (
        <g key={idx}>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#333" strokeWidth={2} />
        </g>
      );
    })}

    {roleActiveKey &&
      rolePositions[roleActiveKey] &&
      (() => {
        const [idxStr, side] = roleActiveKey.split(':');
        const assoc = associations[Number(idxStr)];
        if (!assoc) return null;
        const part = side === 'left' ? assoc.parts?.[0] : assoc.parts?.[1];
        const ownerName = part?.class;
        const from = rolePositions[roleActiveKey];
        const targetName = rolePreviewTarget || ownerName;
        const targetRect = getRect(targetName);
        const tCenter = centerOf(targetName);
        const pTarget = targetRect ? intersectBorder(targetRect, tCenter, from) : tCenter;
        return (
          <line
            x1={from.x}
            y1={from.y}
            x2={pTarget.x}
            y2={pTarget.y}
            stroke="#336"
            strokeWidth={1.5}
            strokeDasharray="6 6"
          />
        );
      })()}
  </svg>
);

export default UMLCanvas;
