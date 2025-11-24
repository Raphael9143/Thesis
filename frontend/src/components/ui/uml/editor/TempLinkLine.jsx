import React from 'react';

export default function TempLinkLine({ linkDrag, centerOf }) {
  if (!linkDrag) return null;
  const center = centerOf && centerOf(linkDrag.from);
  if (!center) return null;
  return (
    <svg className="uml-temp-svg">
      <line
        x1={center.x}
        y1={center.y}
        x2={linkDrag.x}
        y2={linkDrag.y}
        stroke="#333"
        strokeWidth={2}
      />
    </svg>
  );
}
