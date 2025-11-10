import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../../assets/styles/components/ui/UMLPreview.css';

export default function UMLPreview({ model, cli, onClose }) {
  const containerRef = useRef(null);
  const [positions, setPositions] = useState({});
  const draggingRef = useRef(null);
  const boxRefs = useRef({});
  const roleDraggingRef = useRef(null);
  const [rolePositions, setRolePositions] = useState({});
  const [rolePreviewTarget, setRolePreviewTarget] = useState(null);
  const [roleActiveKey, setRoleActiveKey] = useState(null);

  const classes = useMemo(() => model?.classes || [], [model]);
  const enums = useMemo(() => model?.enums || [], [model]);
  const associations = useMemo(() => model?.associations || [], [model]);

  const BOX_W = 220;
  const GAP_X = 40;
  const GAP_Y = 40;
  const BOX_MIN_H = 60;

  // helpers reused across effects/renders
  const offsetAlong = (from, to, dist = 14) => {
    const vx = to.x - from.x;
    const vy = to.y - from.y;
    const len = Math.sqrt(vx * vx + vy * vy) || 1;
    return { x: from.x + (vx / len) * dist, y: from.y + (vy / len) * dist };
  };

  const pushOutward = (pt, center, extra = 18) => {
    const vx = pt.x - center.x;
    const vy = pt.y - center.y;
    const len = Math.sqrt(vx * vx + vy * vy) || 1;
    return { x: pt.x + (vx / len) * extra, y: pt.y + (vy / len) * extra };
  };

  const perpOffset = (pt, towards, other, perp = 12, along = 6) => {
    // pt: base point on edge; towards: center of owning box; other: the other end center
    const ux = other.x - pt.x;
    const uy = other.y - pt.y;
    const ulen = Math.sqrt(ux * ux + uy * uy) || 1;
    const vx = ux / ulen;
    const vy = uy / ulen;
    // normal (perpendicular) vector
    let nx = -vy;
    let ny = vx;
    // choose sign so normal points away from the owning box center
    const dot = (pt.x - towards.x) * nx + (pt.y - towards.y) * ny;
    const sign = dot >= 0 ? 1 : -1;
    nx *= sign;
    ny *= sign;
    return { x: pt.x + nx * perp + vx * along, y: pt.y + ny * perp + vy * along };
  };

  useEffect(() => {
    const p = {};
    const perRow = Math.max(1, Math.ceil(Math.sqrt(Math.max(1, classes.length))));
    classes.forEach((c, i) => {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      p[c.name] = { x: col * (BOX_W + GAP_X) + 40, y: row * (BOX_MIN_H + GAP_Y) + 40 };
    });
    enums.forEach((e, i) => {
      p[`enum:${e.name}`] = { x: (perRow + 1) * (BOX_W + GAP_X) + 40, y: i * (BOX_MIN_H + GAP_Y) + 40 };
    });
    setPositions(p);
  }, [classes, enums]);

  const centerOf = useCallback(
    (name) => {
      const p = positions[name] || { x: 0, y: 0 };
      const el = boxRefs.current[name] || boxRefs.current[`enum:${name}`];
      const w = (el && el.offsetWidth) || BOX_W;
      const h = (el && el.offsetHeight) || BOX_MIN_H;
      return { x: p.x + w / 2, y: p.y + h / 2 };
    },
    [positions]
  );

  const intersectBorder = (rect, from, to) => {
    if (!rect) return from;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = to.x - cx;
    const dy = to.y - cy;
    if (dx === 0 && dy === 0) return { x: cx, y: cy };
    const candidates = [];
    if (dx !== 0) {
      const t1 = (rect.left - cx) / dx;
      const y1 = cy + t1 * dy;
      if (t1 >= 0 && y1 >= rect.top && y1 <= rect.top + rect.height) candidates.push({ t: t1, x: rect.left, y: y1 });
      const t2 = (rect.left + rect.width - cx) / dx;
      const y2 = cy + t2 * dy;
      if (t2 >= 0 && y2 >= rect.top && y2 <= rect.top + rect.height)
        candidates.push({ t: t2, x: rect.left + rect.width, y: y2 });
    }
    if (dy !== 0) {
      const t3 = (rect.top - cy) / dy;
      const x3 = cx + t3 * dx;
      if (t3 >= 0 && x3 >= rect.left && x3 <= rect.left + rect.width) candidates.push({ t: t3, x: x3, y: rect.top });
      const t4 = (rect.top + rect.height - cy) / dy;
      const x4 = cx + t4 * dx;
      if (t4 >= 0 && x4 >= rect.left && x4 <= rect.left + rect.width)
        candidates.push({ t: t4, x: x4, y: rect.top + rect.height });
    }
    if (candidates.length === 0) return { x: cx, y: cy };
    candidates.sort((a, b) => a.t - b.t);
    return { x: candidates[0].x, y: candidates[0].y };
  };

  const getRect = (name) => {
    const el = boxRefs.current[name] || boxRefs.current[`enum:${name}`];
    if (!el || !containerRef.current) return null;
    const r = el.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    return { left: r.left - containerRect.left, top: r.top - containerRect.top, width: r.width, height: r.height };
  };

  useEffect(() => {
    // compute initial role positions so the labels start outside their owning class boxes
    const rp = {};

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
      // find border intersection points (or fallback to along-center offset)
      const p1 = rect1 ? intersectBorder(rect1, c1, c2) : offsetAlong(c1, c2, 14);
      const p2 = rect2 ? intersectBorder(rect2, c2, c1) : offsetAlong(c2, c1, 14);
      // push the label a bit outward from the owning box so it appears outside
      rp[`${i}:left`] = pushOutward(p1, c1, 18);
      rp[`${i}:right`] = pushOutward(p2, c2, 18);
    });
    setRolePositions(rp);
  }, [positions, associations, centerOf]);

  const multiplicityPositions = useMemo(() => {
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
  }, [associations, centerOf]);
  useEffect(() => {
    const getXY = (ev) => {
      // touch events
      if (ev.touches && ev.touches[0]) return { clientX: ev.touches[0].clientX, clientY: ev.touches[0].clientY };
      // pointer/mouse events
      return { clientX: ev.clientX, clientY: ev.clientY };
    };

    function onMove(e) {
      const { clientX, clientY } = getXY(e);
      if (roleDraggingRef.current) {
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
        return;
      }
      if (!draggingRef.current) return;
      const { name, startX, startY, origX, origY } = draggingRef.current;
      const nx = origX + (clientX - startX);
      const ny = origY + (clientY - startY);
      setPositions((prev) => ({ ...prev, [name]: { x: nx, y: ny } }));
    }
    function onUp() {
      draggingRef.current = null;
      roleDraggingRef.current = null;
      setRoleActiveKey(null);
      setRolePreviewTarget(null);
    }

    // listen to both pointer and mouse/touch events so releases are consistently observed
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  const startDrag = (name, e) => {
    e.stopPropagation();
    const clientX = (e.touches && e.touches[0] && e.touches[0].clientX) || e.clientX;
    const clientY = (e.touches && e.touches[0] && e.touches[0].clientY) || e.clientY;
    draggingRef.current = {
      name,
      startX: clientX,
      startY: clientY,
      origX: positions[name]?.x || 0,
      origY: positions[name]?.y || 0,
    };
    // capture pointer when available so we reliably receive the up event
    if (e.pointerId && e.currentTarget && e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {
        console.warn('Failed to set pointer capture', err);
      }
    }
  };

  const startRoleDrag = (key, ownerName, e) => {
    e.stopPropagation();
    e.preventDefault();
    const { clientX, clientY } =
      e.touches && e.touches[0]
        ? { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
        : { clientX: e.clientX, clientY: e.clientY };
    const pos = rolePositions[key] || { x: 0, y: 0 };
    roleDraggingRef.current = { key, ownerName, startX: clientX, startY: clientY, origX: pos.x, origY: pos.y };
    setRoleActiveKey(key);
    // capture pointer when available so pointerup is reliably delivered
    if (e.pointerId && e.currentTarget && e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {
        console.warn('Failed to set pointer capture', err);
      }
    }
  };

  const fmtMultiplicity = (part) => {
    if (!part) return '';
    // allow multiple possible shapes from parser
    if (typeof part.multiplicity === 'string' && part.multiplicity.trim()) return part.multiplicity.trim();
    if (typeof part.cardinality === 'string' && part.cardinality.trim()) return part.cardinality.trim();
    const min = part.min ?? part.lower ?? part.lowerBound ?? '';
    const max = part.max ?? part.upper ?? part.upperBound ?? '';
    // if both empty, but maybe there's a single bound in 'range'
    if ((min === '' || min === null) && (max === '' || max === null)) {
      if (part.range && typeof part.range === 'string') return part.range;
      return '';
    }
    if (max === '' || max === null) {
      if (min === '' || min === null) return '*';
      return `${min}..*`;
    }
    if (String(min) === String(max)) return String(min);
    return `${min}..${max}`;
  };

  return (
    <div className="uml-modal-overlay">
      <div className="uml-modal">
        <div className="uml-modal-header">
          <div style={{ fontWeight: 700 }}>{model?.model || 'Model'}</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <a className="close-uml-button" onClick={onClose} title="Close preview">
              <i className="fa-solid fa-xmark"></i>
            </a>
          </div>
        </div>
        <div className="uml-modal-body" ref={containerRef}>
          <svg
            className="uml-canvas-svg"
            style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
          >
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
              // no inline SVG labels here; multiplicities are rendered as fixed HTML elements
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
                // compute intersection point on target class border so the dashed line points to the class edge
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

          {Object.entries(rolePositions).map(([key, pos]) => {
            const [idxStr, side] = key.split(':');
            const assoc = associations[Number(idxStr)];
            if (!assoc) return null;
            const part = side === 'left' ? assoc.parts?.[0] : assoc.parts?.[1];
            if (!part) return null;
            const role = part.role || part.name || '';
            const ownerName = part.class;
            return (
              <div
                key={key}
                className={`uml-role-label ${roleActiveKey === key ? 'dragging' : ''}`}
                style={{ position: 'absolute', left: pos.x, top: pos.y, transform: 'translate(-50%,-50%)' }}
                onMouseDown={(e) => startRoleDrag(key, ownerName, e)}
                onPointerDown={(e) => startRoleDrag(key, ownerName, e)}
                onTouchStart={(e) => startRoleDrag(key, ownerName, e)}
              >
                <div className="uml-role-name">{role}</div>
              </div>
            );
          })}

          {Object.entries(multiplicityPositions).map(([key, pos]) => {
            const [idxStr, side] = key.split(':');
            const assoc = associations[Number(idxStr)];
            if (!assoc) return null;
            const part = side === 'left' ? assoc.parts?.[0] : assoc.parts?.[1];
            if (!part) return null;
            const mult = fmtMultiplicity(part);
            if (!mult) return null;
            return (
              <div
                key={`mult-${key}`}
                className="uml-mult-static"
                style={{ position: 'absolute', left: pos.x, top: pos.y, transform: 'translate(-50%,-50%)' }}
              >
                {mult}
              </div>
            );
          })}

          <div style={{ position: 'relative', minHeight: 400 }}>
            {classes.map((c) => {
              const pos = positions[c.name] || { x: 0, y: 0 };
              return (
                <div
                  key={c.name}
                  ref={(el) => (boxRefs.current[c.name] = el)}
                  className="uml-box"
                  style={{ left: pos.x, top: pos.y, width: BOX_W, minHeight: BOX_MIN_H }}
                  onMouseDown={(e) => startDrag(c.name, e)}
                >
                  <div className="uml-box-title">{c.name}</div>
                  <div className="uml-box-body">
                    <div className="uml-attributes">
                      {Array.isArray(c.attributes) &&
                        c.attributes.map((a) => (
                          <div key={a.name} className="uml-attr">
                            {a.name}: {a.type}
                          </div>
                        ))}
                    </div>
                    <div className="uml-ops">
                      {Array.isArray(c.operations) &&
                        c.operations.map((op) => (
                          <div key={op.name} className="uml-op">
                            {op.name}({op.signature || ''})
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {enums.map((e) => {
              const key = `enum:${e.name}`;
              const pos = positions[key] || { x: 0, y: 0 };
              return (
                <div
                  key={e.name}
                  ref={(el) => (boxRefs.current[key] = el)}
                  className="uml-box uml-enum"
                  style={{ left: pos.x, top: pos.y, width: BOX_W / 1.2, minHeight: BOX_MIN_H }}
                  onMouseDown={(ev) => startDrag(key, ev)}
                >
                  <div className="uml-box-title">
                    {'<<enumeration>>'} {e.name}
                  </div>
                  <div className="uml-box-body">
                    {Array.isArray(e.values) &&
                      e.values.map((v) => (
                        <div key={v} className="uml-enum-var">
                          {v}
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {cli && (
          <details style={{ padding: 8, borderTop: '1px solid #eee' }}>
            <summary>
              <a>CLI format</a>
            </summary>
            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'auto' }}>{cli}</pre>
          </details>
        )}
      </div>
    </div>
  );
}
