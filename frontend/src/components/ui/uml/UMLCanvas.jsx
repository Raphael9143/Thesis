import React from 'react';
import { intersectBorder } from '../../../utils/umlUtils';

const UMLCanvas = ({ associations, centerOf, getRect, roleActiveKey, rolePositions, rolePreviewTarget }) => (
  <svg className="uml-canvas-svg" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
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
