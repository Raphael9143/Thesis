import React, { useEffect, useState } from 'react';
import NotificationPopup from '../../NotificationPopup';

export default function AssociationModal({ assoc, classes = [], onChange, onClose, onSave, onDelete }) {
  const [errors, setErrors] = useState([]);
  const [showNotification, setShowNotification] = useState(false);

  // Ensure sensible defaults when modal opens: default class selection and attribute types
  useEffect(() => {
    if (!assoc) return;
    let changed = false;
    const next = { ...assoc };
    // default parts class to first available class
    next.parts = (assoc.parts || []).map((p) => {
      const cp = { ...(p || {}) };
      if ((!cp.class || cp.class === '') && classes && classes.length) {
        cp.class = classes[0].name;
        changed = true;
      }
      if (!cp.role || cp.role === '') {
        cp.role = cp.class || (classes && classes[0] && classes[0].name) || '';
      }
      cp.multiplicity = cp.multiplicity || '';
      return cp;
    });
    // default attribute types
    next.attributes = (assoc.attributes || []).map((at) => {
      const nat = { ...(at || {}) };
      if (!nat.type) {
        nat.type = 'String';
        changed = true;
      }
      return nat;
    });
    if (!next.type) {
      next.type = 'association';
      changed = true;
    }
    if (changed) onChange && onChange(next);
  }, [assoc, classes, onChange]);

  if (!assoc) return null;

  const updatePart = (idx, next) => {
    const parts = (assoc.parts || []).slice();
    parts[idx] = { ...(parts[idx] || {}), ...next };
    onChange && onChange({ ...assoc, parts });
  };

  const addPart = () => {
    const parts = [
      ...(assoc.parts || []),
      { class: classes[0]?.name || '', multiplicity: '', role: classes[0]?.name || '' },
    ];
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
    onChange && onChange({ ...assoc, attributes: [...(assoc.attributes || []), { name: '', type: 'String' }] });
  const removeAttr = (i) => {
    const attrs = (assoc.attributes || []).slice();
    attrs.splice(i, 1);
    onChange && onChange({ ...assoc, attributes: attrs });
  };

  const validate = () => {
    const errs = [];
    if (!assoc.name || !assoc.name.trim()) errs.push('Association name is required');
    const parts = assoc.parts || [];
    if (!parts.length) errs.push('At least one participant is required');
    parts.forEach((p, i) => {
      if (!p.class || !p.class.trim()) errs.push(`Participant #${i + 1}: class is required`);
      if (!p.role || !p.role.trim()) errs.push(`Participant #${i + 1}: role is required`);
      if (!p.multiplicity || !p.multiplicity.trim()) errs.push(`Participant #${i + 1}: multiplicity is required`);
    });
    // associationclass attributes validation
    if (assoc.type === 'associationclass') {
      (assoc.attributes || []).forEach((at, i) => {
        if (!at.name || !at.name.trim()) errs.push(`Attribute #${i + 1}: name is required`);
        if (!at.type || !at.type.trim()) errs.push(`Attribute #${i + 1}: type is required`);
      });
    }
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (errs.length) {
      setErrors(errs);
      setShowNotification(true);
      return;
    }
    setErrors([]);
    onSave && onSave(assoc);
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
            <label className="uml-modal-label">
              Name <span className="required">*</span>
            </label>
            <input
              className="uml-modal-input"
              value={assoc.name || ''}
              onChange={(e) => onChange && onChange({ ...assoc, name: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="uml-modal-section">
          <label className="uml-modal-label">
            Parts <span className="required">*</span>
          </label>
          {(assoc.parts || []).map((p, i) => (
            <div key={i} className="uml-modal-row" style={{ alignItems: 'center', gap: 8 }}>
              <select
                className="uml-modal-input"
                value={p.class || classes[0]?.name || ''}
                onChange={(e) => updatePart(i, { class: e.target.value })}
                required
              >
                {classes.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                className="uml-modal-input"
                placeholder="role"
                value={p.role || p.class || classes[0]?.name || ''}
                onChange={(e) => updatePart(i, { role: e.target.value })}
                required
              />
              <input
                className="uml-modal-input"
                placeholder="multiplicity"
                value={p.multiplicity || ''}
                onChange={(e) => updatePart(i, { multiplicity: e.target.value })}
                required
              />
              <button type="button" className="icon-btn" title="Remove participant" onClick={() => removePart(i)}>
                <i className="fa fa-trash" />
              </button>
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <button type="button" className="icon-btn" title="Add participant" onClick={addPart}>
              <i className="fa fa-plus" />
            </button>
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
                  required
                />
                <select
                  className="uml-modal-input"
                  value={at.type || 'String'}
                  onChange={(e) => updateAttr(i, 'type', e.target.value)}
                >
                  <option value="String">String</option>
                  <option value="Integer">Integer</option>
                  <option value="Boolean">Boolean</option>
                  <option value="Float">Float</option>
                </select>
                <button type="button" className="icon-btn" title="Remove attribute" onClick={() => removeAttr(i)}>
                  <i className="fa fa-trash" />
                </button>
              </div>
            ))}
            <div style={{ marginTop: 8 }}>
              <button type="button" className="icon-btn" title="Add attribute" onClick={addAttr}>
                <i className="fa fa-plus" />
              </button>
            </div>
          </div>
        )}

        <div className="uml-modal-actions">
          <button type="button" className="icon-btn" title="Cancel" onClick={() => onClose && onClose()}>
            <i className="fa fa-times" />
          </button>
          {typeof onDelete === 'function' && assoc && (
            <button
              type="button"
              className="icon-btn"
              title="Delete association"
              onClick={() => {
                if (window.confirm('Delete this association?')) {
                  onDelete && onDelete(assoc);
                }
              }}
            >
              <i className="fa fa-trash" />
            </button>
          )}
          <button type="button" className="icon-btn" title="Save" onClick={handleSave}>
            <i className="fa fa-save" />
          </button>
        </div>

        {showNotification && (
          <NotificationPopup
            message={errors.join('\n')}
            open={showNotification}
            type="error"
            onClose={() => setShowNotification(false)}
          />
        )}
      </div>
    </div>
  );
}
