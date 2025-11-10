import React from 'react';

const UMLRoles = ({
  rolePositions,
  associations,
  startRoleDrag,
  fmtMultiplicity,
  multiplicityPositions,
  roleActiveKey,
}) => (
  <>
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
  </>
);

export default UMLRoles;
