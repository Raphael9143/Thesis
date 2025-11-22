import React from 'react';

export default function AssociationModal({ assoc, classes = [], onChange, onClose, onSave }) {
  if (!assoc) return null;

  const updatePart = (idx, next) => {
    const parts = (assoc.parts || []).slice();
    parts[idx] = { ...(parts[idx] || {}), ...next };
    onChange && onChange({ ...assoc, parts });
  };

  const addPart = () => {
    const parts = [...(assoc.parts || []), { class: '', multiplicity: '', role: '' }];
    onChange && onChange({ ...assoc, parts });
  };

  const removePart = (idx) => {
    const parts = (assoc.parts || []).slice();
    parts.splice(idx, 1);
    onChange && onChange({ ...assoc, parts });
  };

  const updateAttr = (i, key, val) => {
    const attrs = (assoc.attributes || []).slice();
    attrs[i] = { ...(attrs[i] || {}), [key]: val };
    onChange && onChange({ ...assoc, attributes: attrs });
  };

  const addAttr = () =>
    onChange && onChange({ ...assoc, attributes: [...(assoc.attributes || []), { name: '', type: '' }] });
  const removeAttr = (i) => {
    const attrs = (assoc.attributes || []).slice();
    attrs.splice(i, 1);
    onChange && onChange({ ...assoc, attributes: attrs });
  };

  return (
    <div className="uml-modal-overlay" onClick={() => onClose && onClose()}>
      <div className="uml-modal" onClick={(e) => e.stopPropagation()}>
        <div className="uml-modal-title">Association details</div>

        <div className="uml-modal-row">
          <div>
            <label className="uml-modal-label">Type</label>
            <select
              className="uml-modal-input"
              value={assoc.type || 'association'}
              onChange={(e) => onChange && onChange({ ...assoc, type: e.target.value })}
            >
              <option value="association">Association</option>
              <option value="aggregation">Aggregation</option>
              <option value="composition">Composition</option>
              <option value="n-ary">N-ary</option>
              <option value="associationclass">AssociationClass</option>
            </select>
          </div>
          <div>
            <label className="uml-modal-label">Name (optional)</label>
            <input
              className="uml-modal-input"
              value={assoc.name || ''}
              onChange={(e) => onChange && onChange({ ...assoc, name: e.target.value })}
            />
          </div>
        </div>

        <div className="uml-modal-section">
          <label className="uml-modal-label">Parts</label>
          {(assoc.parts || []).map((p, i) => (
            <div key={i} className="uml-modal-row" style={{ alignItems: 'center', gap: 8 }}>
              <select
                className="uml-modal-input"
                value={p.class || ''}
                onChange={(e) => updatePart(i, { class: e.target.value })}
              >
                <option value="">-- select class --</option>
                {classes.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                className="uml-modal-input"
                placeholder="role"
                value={p.role || ''}
                onChange={(e) => updatePart(i, { role: e.target.value })}
              />
              <input
                className="uml-modal-input"
                placeholder="multiplicity"
                value={p.multiplicity || ''}
                onChange={(e) => updatePart(i, { multiplicity: e.target.value })}
              />
              <button onClick={() => removePart(i)}>Remove</button>
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <button onClick={addPart}>Add participant</button>
          </div>
        </div>

        {assoc.type === 'associationclass' && (
          <div className="uml-modal-section">
            <label className="uml-modal-label">AssociationClass attributes</label>
            {(assoc.attributes || []).map((at, i) => (
              <div key={i} className="uml-modal-row" style={{ gap: 8 }}>
                <input
                  className="uml-modal-input"
                  placeholder="name"
                  value={at.name || ''}
                  onChange={(e) => updateAttr(i, 'name', e.target.value)}
                />
                <input
                  className="uml-modal-input"
                  placeholder="type"
                  value={at.type || ''}
                  onChange={(e) => updateAttr(i, 'type', e.target.value)}
                />
                <button onClick={() => removeAttr(i)}>Remove</button>
              </div>
            ))}
            <div style={{ marginTop: 8 }}>
              <button onClick={addAttr}>Add attribute</button>
            </div>
          </div>
        )}

        <div className="uml-modal-actions">
          <button onClick={() => onClose && onClose()} title="Cancel">
            <i className="fa fa-times" /> Cancel
          </button>
          <button onClick={() => onSave && onSave(assoc)} title="Create association">
            <i className="fa fa-save" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
