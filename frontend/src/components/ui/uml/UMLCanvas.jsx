import React from 'react';
import { intersectBorder } from '../../../utils/umlUtils';

function drawDiamondPoints(tip, other, size = 14) {
  const dirX = other.x - tip.x;
  const dirY = other.y - tip.y;
  const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
  const along = { x: tip.x + (dirX / len) * size, y: tip.y + (dirY / len) * size };
  const nx = (-dirY / len) * (size * 0.6);
  const ny = (dirX / len) * (size * 0.6);
  const left = { x: along.x + nx, y: along.y + ny };
  const right = { x: along.x - nx, y: along.y - ny };
  const back = { x: tip.x + (dirX / len) * (size * 2), y: tip.y + (dirY / len) * (size * 2) };
  return [tip, left, back, right];
}

export default function UMLCanvas({
  associations,
  classes = [],
  centerOf,
  getRect,
  roleActiveKey,
  rolePositions,
  rolePreviewTarget,
}) {
  return (
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

      {/* Draw associations: support binary, n-ary, aggregation/composition, associationclass */}
      {(() => {
        // Build a map of binary pair -> association indices so we can offset parallel lines
        const pairToIndices = {};
        associations.forEach((a, i) => {
          const parts = Array.isArray(a.parts) ? a.parts : [];
          if (parts.length === 2) {
            const n1 = parts[0] && parts[0].class ? parts[0].class : '';
            const n2 = parts[1] && parts[1].class ? parts[1].class : '';
            const key = n1 < n2 ? `${n1}|${n2}` : `${n2}|${n1}`;
            (pairToIndices[key] = pairToIndices[key] || []).push(i);
          }
        });
        return associations.map((a, idx) => {
          const parts = Array.isArray(a.parts) ? a.parts : [];
          const type = a.type || 'association';
          // gather centers and rects
          const centers = parts.map((p) => ({
            name: p.class,
            center: centerOf(p.class),
            rect: getRect(p.class),
            raw: p,
          }));
          // skip if no parts
          if (centers.length === 0) return null;

          // Binary association (two ends)
          if (centers.length === 2) {
            const left = centers[0];
            const right = centers[1];
            if (!left.center || !right.center) return null;
            const p1 = left.rect ? intersectBorder(left.rect, left.center, right.center) : left.center;
            const p2 = right.rect ? intersectBorder(right.rect, right.center, left.center) : right.center;
            // Offset parallel associations between the same pair so they don't overlap
            const n1 = left.name || '';
            const n2 = right.name || '';
            const pairKey = n1 < n2 ? `${n1}|${n2}` : `${n2}|${n1}`;
            const indices = pairToIndices[pairKey] || [idx];
            const occIndex = indices.indexOf(idx);
            const count = indices.length;
            const spacing = 8;
            const offsetAmount = (occIndex - (count - 1) / 2) * spacing;
            const dirX = p2.x - p1.x;
            const dirY = p2.y - p1.y;
            const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
            const perpX = (-dirY / len) * offsetAmount;
            const perpY = (dirX / len) * offsetAmount;
            const p1o = { x: p1.x + perpX, y: p1.y + perpY };
            const p2o = { x: p2.x + perpX, y: p2.y + perpY };
            return (
              <g key={`assoc-${idx}`}>
                <line x1={p1o.x} y1={p1o.y} x2={p2o.x} y2={p2o.y} stroke="#333" strokeWidth={2} />
                {/* aggregation / composition markers on the first part */}
                {type === 'composition' && (
                  <polygon
                    points={drawDiamondPoints(p1o, p2o)
                      .map((pt) => `${pt.x},${pt.y}`)
                      .join(' ')}
                    fill="#333"
                    stroke="#333"
                    strokeWidth={1}
                  />
                )}
                {type === 'aggregation' && (
                  <polygon
                    points={drawDiamondPoints(p1o, p2o)
                      .map((pt) => `${pt.x},${pt.y}`)
                      .join(' ')}
                    fill="#fff"
                    stroke="#333"
                    strokeWidth={1.5}
                  />
                )}
                {/* associationclass: render a small class box near middle and connect with dashed line */}
                {type === 'associationclass' &&
                  a.attributes &&
                  (() => {
                    const mid = { x: (p1o.x + p2o.x) / 2, y: (p1o.y + p2o.y) / 2 };
                    const boxW = 140;
                    const boxH = Math.max(30, 18 + (a.attributes.length || 0) * 16);
                    const bx = mid.x + 24;
                    const by = mid.y - boxH / 2;
                    return (
                      <g key={`assocclass-${idx}`}>
                        <rect x={bx} y={by} width={boxW} height={boxH} fill="#fff" stroke="#333" />
                        <text x={bx + 8} y={by + 16} fontSize={12} fontWeight="bold">
                          {a.name || 'AssocClass'}
                        </text>
                        {a.attributes.map((att, i) => (
                          <text key={i} x={bx + 8} y={by + 34 + i * 14} fontSize={12}>
                            {att.name + (att.type ? ` : ${att.type}` : '')}
                          </text>
                        ))}
                        <line x1={mid.x} y1={mid.y} x2={bx} y2={by + boxH / 2} stroke="#333" strokeDasharray="6 4" />
                      </g>
                    );
                  })()}
              </g>
            );
          }

          // N-ary association: compute centroid and connect to each participant
          const valid = centers.filter((c) => c.center);
          if (valid.length < 2) return null;
          const centroid = valid.reduce((acc, c) => ({ x: acc.x + c.center.x, y: acc.y + c.center.y }), { x: 0, y: 0 });
          centroid.x /= valid.length;
          centroid.y /= valid.length;
          // draw connector lines from centroid to each part
          // If multiple parts connect to the same class, offset their lines so they don't overlap
          const nameToIndices = valid.reduce((acc, c, i) => {
            const nm = c.name || `__anon_${i}`;
            (acc[nm] = acc[nm] || []).push(i);
            return acc;
          }, {});
          const spacing = 8; // px between parallel lines
          const lines = valid.map((c, i) => {
            const pt = c.rect ? intersectBorder(c.rect, c.center, centroid) : c.center;
            const indices = nameToIndices[c.name || `__anon_${i}`] || [i];
            const occIndex = indices.indexOf(i);
            const count = indices.length;
            const offsetAmount = (occIndex - (count - 1) / 2) * spacing;
            // perpendicular to direction centroid -> pt
            const dirX = pt.x - centroid.x;
            const dirY = pt.y - centroid.y;
            const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
            const perpX = (-dirY / len) * offsetAmount;
            const perpY = (dirX / len) * offsetAmount;
            return (
              <line
                key={`n-${idx}-${i}`}
                x1={centroid.x + perpX}
                y1={centroid.y + perpY}
                x2={pt.x + perpX}
                y2={pt.y + perpY}
                stroke="#333"
                strokeWidth={2}
              />
            );
          });
          return (
            <g key={`nary-${idx}`}>
              {lines}
              {/* central marker: render a small diamond (white fill, bordered) */}
              <polygon
                points={`${centroid.x},${centroid.y - 8} ${centroid.x + 8},${centroid.y} ${centroid.x},${centroid.y + 8} ${centroid.x - 8},${centroid.y}`}
                fill="#fff"
                stroke="#333"
                strokeWidth={2}
              />
              {/* associationclass for n-ary */}
              {type === 'associationclass' &&
                a.attributes &&
                (() => {
                  const bx = centroid.x + 28;
                  const boxW = 140;
                  const boxH = Math.max(30, 18 + (a.attributes.length || 0) * 16);
                  const by = centroid.y - boxH / 2;
                  return (
                    <g key={`assocclass-n-${idx}`}>
                      <rect x={bx} y={by} width={boxW} height={boxH} fill="#fff" stroke="#333" />
                      <text x={bx + 8} y={by + 16} fontSize={12} fontWeight="bold">
                        {a.name || 'AssocClass'}
                      </text>
                      {a.attributes.map((att, i) => (
                        <text key={i} x={bx + 8} y={by + 34 + i * 14} fontSize={12}>
                          {att.name + (att.type ? ` : ${att.type}` : '')}
                        </text>
                      ))}
                      <line
                        x1={centroid.x}
                        y1={centroid.y}
                        x2={bx}
                        y2={by + boxH / 2}
                        stroke="#333"
                        strokeDasharray="6 4"
                      />
                    </g>
                  );
                })()}
            </g>
          );
        });
      })()}

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
}
