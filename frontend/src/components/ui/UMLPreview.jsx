import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../../assets/styles/components/ui/UMLPreview.css';
import { offsetAlong, pushOutward, perpOffset, intersectBorder, fmtMultiplicity } from '../../utils/umlUtils';
import UMLHeader from './uml/UMLHeader';
import UMLCanvas from './uml/UMLCanvas';
import UMLRoles from './uml/UMLRoles';
import UMLClasses from './uml/UMLClasses';

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

  // pure helpers (moved to src/utils/umlUtils.js)

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

  // intersectBorder moved to utils

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

  // fmtMultiplicity moved to utils

  return (
    <div className="uml-modal-overlay">
      <div className="uml-modal">
        <UMLHeader model={model} onClose={onClose} />
        <div className="uml-modal-body" ref={containerRef}>
          <UMLCanvas
            associations={associations}
            centerOf={centerOf}
            getRect={getRect}
            roleActiveKey={roleActiveKey}
            rolePositions={rolePositions}
            rolePreviewTarget={rolePreviewTarget}
          />

          <UMLRoles
            rolePositions={rolePositions}
            associations={associations}
            startRoleDrag={startRoleDrag}
            fmtMultiplicity={fmtMultiplicity}
            multiplicityPositions={multiplicityPositions}
            roleActiveKey={roleActiveKey}
          />

          <UMLClasses
            classes={classes}
            enums={enums}
            positions={positions}
            boxRefs={boxRefs}
            startDrag={startDrag}
            BOX_W={BOX_W}
            BOX_MIN_H={BOX_MIN_H}
          />
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
