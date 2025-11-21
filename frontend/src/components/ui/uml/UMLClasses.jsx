import React from 'react';

const UMLClasses = ({ classes, enums, positions, boxRefs, startDrag, BOX_W, BOX_MIN_H }) => (
  <div style={{ position: 'relative', minHeight: 400, height: '100%' }}>
    {classes.map((c) => {
      const pos = positions[c.name] || { x: 0, y: 0 };
      return (
        <div
          key={c.name}
          ref={(el) => (boxRefs.current[c.name] = el)}
          className="uml-box"
          style={{ left: pos.x, top: pos.y, minWidth: BOX_W, width: 'auto', minHeight: BOX_MIN_H }}
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
            {/* operations intentionally omitted in preview */}
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
);

export default UMLClasses;
