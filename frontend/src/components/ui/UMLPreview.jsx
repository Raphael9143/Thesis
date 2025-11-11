import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../assets/styles/components/ui/UMLPreview.css';
import { offsetAlong, pushOutward, perpOffset, intersectBorder, fmtMultiplicity } from '../../utils/umlUtils';
import useBoxMeasurements from '../../hooks/useBoxMeasurements';
import useMultiplicityPositions from '../../hooks/useMultiplicityPositions';
import useBoxDrag from '../../hooks/useBoxDrag';
import useRoleDrag from '../../hooks/useRoleDrag';
import UMLHeader from './uml/UMLHeader';
import UMLCanvas from './uml/UMLCanvas';
import UMLRoles from './uml/UMLRoles';
import UMLClasses from './uml/UMLClasses';

export default function UMLPreview({ model, cli, onClose }) {
  const containerRef = useRef(null);
  const [positions, setPositions] = useState({});
  const positionsRef = useRef(positions);

  const boxRefs = useRef({});

  const classes = useMemo(() => model?.classes || [], [model]);
  const enums = useMemo(() => model?.enums || [], [model]);
  const associations = useMemo(() => model?.associations || [], [model]);

  const BOX_W = 220;
  const GAP_X = 40;
  const GAP_Y = 40;
  const BOX_MIN_H = 60;

  const { centerOf, getRect } = useBoxMeasurements({ boxRefs, positions, containerRef, BOX_W, BOX_MIN_H });

  // keep a ref copy of positions for hooks that need the latest value in event handlers
  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  // initial grid layout for boxes (classes + enums)
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

  // multiplicity positions extracted to hook
  const multiplicityPositions = useMultiplicityPositions(associations, centerOf, getRect, {
    perpOffset,
    offsetAlong,
    intersectBorder,
  });
  // box drag hook
  const { startDrag } = useBoxDrag({ setPositions, containerRef, positionsRef });

  // role drag hook
  const { rolePositions, setRolePositions, startRoleDrag, roleActiveKey, rolePreviewTarget } = useRoleDrag({
    boxRefs,
    containerRef,
    initialPositions: {},
  });

  // compute initial role positions so the labels start outside their owning class boxes
  useEffect(() => {
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
      const p1 = rect1 ? intersectBorder(rect1, c1, c2) : offsetAlong(c1, c2, 14);
      const p2 = rect2 ? intersectBorder(rect2, c2, c1) : offsetAlong(c2, c1, 14);
      rp[`${i}:left`] = pushOutward(p1, c1, 18);
      rp[`${i}:right`] = pushOutward(p2, c2, 18);
    });
    setRolePositions(rp);
  }, [positions, associations, centerOf, getRect, setRolePositions]);

  // fmtMultiplicity moved to utils

  const overlay = (
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

  // Render overlay at document.body to escape any parent stacking contexts
  return typeof document !== 'undefined' ? createPortal(overlay, document.body) : overlay;
}
