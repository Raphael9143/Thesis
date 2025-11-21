import React from 'react';
import AttributeEditor from './AttributeEditor';
import AttributeTypeSelect from './AttributeTypeSelect';

export default function ClassBox({
  c,
  pos,
  boxRefs,
  startDrag,
  editingName,
  editValue,
  setEditValue,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  startAddingAttr,
  newAttr,
  attrs,
  onUpdateAttribute,
  onDeleteAttribute,
  updateNewAttrInput,
  commitAddingAttr,
  cancelAddingAttr,
  startLinkDrag,
  classes,
  enums,
}) {
  return (
    <div
      key={c.name}
      ref={(el) => (boxRefs.current[c.name] = el)}
      className="uml-box"
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={(e) => startDrag(c.name, e)}
    >
      <div className="uml-box-title">
        {editingName === c.name ? (
          <div className="uml-title-edit-controls">
            <input
              className="uml-title-input"
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onCommitEdit(c.name)}
            />
            <i
              className="fa fa-plus uml-icon-btn"
              title="Add attribute"
              onClick={(e) => {
                e.stopPropagation();
                startAddingAttr(c.name);
              }}
            />
            <i
              className="fa fa-save uml-icon-btn"
              title="Save"
              onClick={(e) => {
                e.stopPropagation();
                onCommitEdit(c.name);
              }}
            />
            <i
              className="fa fa-times uml-icon-btn"
              title="Cancel"
              onClick={(e) => {
                e.stopPropagation();
                onCancelEdit(c.name, 'class');
              }}
            />
          </div>
        ) : (
          <>
            <div>{c.name}</div>
            <i
              className="fa fa-edit uml-edit-btn"
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit(c.name);
              }}
            />
          </>
        )}
      </div>
      <div className="uml-box-body">
        <div className="uml-attributes">
          {Array.isArray(attrs) &&
            attrs.map((a, idx) => (
              <AttributeEditor
                key={idx}
                attr={a}
                idx={idx}
                editing={editingName === c.name}
                onUpdate={(i, n, t) => onUpdateAttribute(c.name, i, n, t)}
                onDelete={(i) => onDeleteAttribute(c.name, i)}
                classes={classes}
                enums={enums}
              />
            ))}

          {/* new attr inline editor when adding */}
          {editingName === c.name && newAttr?.adding && (
            <div className="uml-attr editing">
              <input
                placeholder="name"
                value={newAttr.name}
                onChange={(e) => updateNewAttrInput(c.name, 'name', e.target.value)}
                className="uml-attr-name"
              />
              <AttributeTypeSelect
                value={newAttr.type}
                onChange={(v) => updateNewAttrInput(c.name, 'type', v)}
                classes={classes}
                enums={enums}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  commitAddingAttr(c.name);
                }}
              >
                Add
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cancelAddingAttr(c.name);
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* operations list */}
          {Array.isArray(c.operations) && c.operations.length > 0 && (
            <div className="uml-operations">
              {c.operations.map((op, i) => {
                const opname = typeof op === 'string' ? op : op.name || '';
                const sig = typeof op === 'object' && op.signature ? op.signature : '';
                return (
                  <div key={i} className="uml-op">
                    {opname}
                    {sig ? <span className="uml-op-sig">({sig})</span> : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="uml-box-actions">
          <div className="uml-connector" title="Drag to link" onPointerDown={(e) => startLinkDrag(e, c.name)} />
        </div>
      </div>
    </div>
  );
}
