import React from 'react';

export default function EnumEditor({
  en,
  editingName,
  editingType,
  editValue,
  onEditChange,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  newEnum,
  onUpdateValue,
  onDeleteValue,
  onStartAddValue,
  onCommitAddValue,
  onCancelAddValue,
}) {
  return (
    <div>
      <div className="uml-box-title">
        {editingName === en.name && editingType === 'enum' ? (
          <div className="uml-title-edit-controls">
            <input
              className="uml-title-input"
              autoFocus
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onCommitEdit()}
            />
            <i
              className="fa fa-plus uml-icon-btn"
              title="Add value"
              onClick={(e) => {
                e.stopPropagation();
                onStartAddValue();
              }}
            />
            <i
              className="fa fa-save uml-icon-btn"
              title="Save"
              onClick={(e) => {
                e.stopPropagation();
                onCommitEdit();
              }}
            />
            <i
              className="fa fa-times uml-icon-btn"
              title="Cancel"
              onClick={(e) => {
                e.stopPropagation();
                onCancelEdit();
              }}
            />
          </div>
        ) : (
          <>
            <div>
              <span>{'<<enumeration>>'}</span>
              <span> {en.name}</span>
            </div>
            <i
              className="fa fa-edit uml-edit-btn"
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit();
              }}
            />
          </>
        )}
      </div>
      <hr className="uml-seperate" />
      <div className="uml-box-body">
        {Array.isArray(en.values) &&
          en.values.map((v, idx) => {
            const text = typeof v === 'string' ? v : (v?.name ?? JSON.stringify(v));
            if (editingName === en.name && editingType === 'enum') {
              return (
                <div key={idx} className="uml-enum-var editing">
                  <input className="uml-enum-input" value={text} onChange={(e) => onUpdateValue(idx, e.target.value)} />
                  <i className="fa fa-trash uml-icon-btn" title="Delete value" onClick={() => onDeleteValue(idx)} />
                </div>
              );
            }
            return (
              <div key={idx} className="uml-enum-var">
                {text}
              </div>
            );
          })}

        {editingName === en.name && editingType === 'enum' && newEnum.adding && (
          <div className="uml-enum-var editing">
            <input
              placeholder="value"
              value={newEnum.value}
              onChange={(e) => onUpdateValue('new', e.target.value)}
              className="uml-enum-input"
            />
            <button onClick={onCommitAddValue}>Add</button>
            <button onClick={onCancelAddValue}>Cancel</button>
          </div>
        )}

        {editingName === en.name && editingType === 'enum' && !newEnum.adding && (
          <div className="uml-add-value" onClick={onStartAddValue}>
            + value
          </div>
        )}
      </div>
    </div>
  );
}
