import React from 'react';

export default function EnumBox({
  en,
  pos,
  boxRefs,
  startDrag,
  editingName,
  editValue,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  newEnum,
  onUpdateValue,
  onDeleteValue,
  onCommitAddValue,
  onCancelAddValue,
}) {
  return (
    <div
      key={en.name}
      ref={(el) => (boxRefs.current[`enum:${en.name}`] = el)}
      className="uml-box uml-enum"
      style={{ left: pos.x, top: pos.y, width: 220 / 1.2 }}
      onMouseDown={(e) => startDrag(`enum:${en.name}`, e)}
    >
      <div className="uml-box-title">
        {editingName === en.name && editingName ? (
          <div className="uml-title-edit-controls">
            <input
              className="uml-title-input"
              autoFocus
              value={editValue}
              onChange={(e) => onStartEdit && onStartEdit(e.target.value)}
            />
            <i
              className="fa fa-save uml-icon-btn"
              title="Save"
              onClick={(e) => {
                e.stopPropagation();
                onCommitEdit && onCommitEdit(en.name);
              }}
            />
            <i
              className="fa fa-times uml-icon-btn"
              title="Cancel"
              onClick={(e) => {
                e.stopPropagation();
                onCancelEdit && onCancelEdit(en.name, 'enum');
              }}
            />
          </div>
        ) : (
          <>
            <div>
              {'<<enumeration>>'} {en.name}
            </div>
            <i
              className="fa fa-edit uml-edit-btn"
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit && onStartEdit(en.name);
              }}
            />
          </>
        )}
      </div>
      <hr className="uml-seperate" />
      <div className="uml-box-body">
        <div className="uml-attributes">
          {(Array.isArray(en.values) ? en.values : []).map((v, idx) => (
            <div className="uml-attr" key={idx}>
              {editingName === en.name ? (
                <input value={v} onChange={(e) => onUpdateValue(idx, e.target.value)} />
              ) : (
                <div>{v}</div>
              )}

              {editingName === en.name && (
                <i
                  className="fa fa-trash uml-icon-btn"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteValue(idx);
                  }}
                />
              )}
            </div>
          ))}

          {editingName === en.name && newEnum?.adding && (
            <div className="uml-attr editing">
              <input placeholder="value" value={newEnum.value} onChange={(e) => onUpdateValue('new', e.target.value)} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCommitAddValue && onCommitAddValue(en.name);
                }}
              >
                Add
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelAddValue && onCancelAddValue(en.name);
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
