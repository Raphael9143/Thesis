import React from 'react';
import AttributeTypeSelect from './AttributeTypeSelect';

export default function AttributeEditor({
  clsName,
  attr,
  idx,
  editing,
  onUpdate, // (idx, name, type)
  onDelete,
  classes = [],
  enums = [],
}) {
  const aname = typeof attr === 'string' ? attr : attr?.name || '';
  const atype = typeof attr === 'string' ? '' : attr?.type || '';

  if (!editing) {
    let text = '';
    if (attr == null) text = '';
    else if (typeof attr === 'string') text = attr;
    else if (typeof attr === 'object')
      text = attr.name ? `${attr.name}${attr.type ? `: ${attr.type}` : ''}` : JSON.stringify(attr);
    return <div className="uml-attr">{text}</div>;
  }

  return (
    <div className="uml-attr editing">
      <input className="uml-attr-name" value={aname} onChange={(e) => onUpdate(idx, e.target.value, atype)} />
      <AttributeTypeSelect value={atype} onChange={(v) => onUpdate(idx, aname, v)} classes={classes} enums={enums} />
      <i
        className="fa fa-trash uml-icon-btn"
        title="Delete attribute"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(idx);
        }}
      />
    </div>
  );
}
