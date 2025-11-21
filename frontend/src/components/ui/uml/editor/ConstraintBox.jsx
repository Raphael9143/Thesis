import React from 'react';

export default function ConstraintBox({ constraints = [], positions = {}, BOX_W = 220 }) {
  if (!Array.isArray(constraints) || constraints.length === 0) return null;
  return (
    <div className="uml-constraints-layer">
      {constraints.map((c) => {
        // position near ownerClass if available
        const owner = c.ownerClass;
        const key = owner || c.id;
        const pos = owner ? positions[owner] : null;
        const style = pos
          ? { position: 'absolute', left: pos.x + BOX_W - 36, top: pos.y + 6 }
          : { position: 'absolute', left: 8, top: 8 };
        return (
          <div className="uml-constraint-badge" key={key} style={style} title={c.expression}>
            <span className="uml-constraint-type">{c.type}</span>
          </div>
        );
      })}
    </div>
  );
}
