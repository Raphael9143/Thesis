import React from 'react';
import AttributeTypeSelect from './AttributeTypeSelect';

export default function AttributeEditor({ attr, idx, editing, onUpdate, onDelete, classes = [], enums = [] }) {
  if (!editing) {
    return <div className="uml-attr">{typeof attr === 'string' ? attr : attr.name}</div>;
  }
  const name = typeof attr === 'string' ? attr : attr.name;
  const type = typeof attr === 'string' ? '' : attr.type || '';
  return (
    <div className="uml-attr">
      <input value={name} onChange={(e) => onUpdate(idx, e.target.value, type)} />
      <AttributeTypeSelect value={type} onChange={(v) => onUpdate(idx, name, v)} classes={classes} enums={enums} />
      <i className="fa fa-trash uml-icon-btn" onClick={() => onDelete(idx)} />
    </div>
  );
}
