import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../../../assets/styles/components/ui/UMLPreview.css';
import '../../../assets/styles/components/ui/UMLEditor.css';
import useBoxMeasurements from '../../../hooks/useBoxMeasurements';
import useBoxDrag from '../../../hooks/useBoxDrag';
import UMLCanvas from './UMLCanvas';
import userAPI from '../../../../services/userAPI';
import AttributeEditor from './AttributeEditor';
import EnumEditor from './EnumEditor';
import UmlToolbox from './UmlToolbox';
import AttributeTypeSelect from './AttributeTypeSelect';

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function UMLEditor({ initialModel = null, onResult }) {
  const containerRef = useRef(null);
  const boxRefs = useRef({});
  const positionsRef = useRef({});

  const location = useLocation();
  const starter = initialModel ||
    location?.state?.model || { model: 'Model', enums: [], classes: [], associations: [] };

  const [classes, setClasses] = useState(starter.classes || []);
  const [enums, setEnums] = useState(starter.enums || []);
  const [associations, setAssociations] = useState(starter.associations || []);
  const [positions, setPositions] = useState({});
  const [constraints, setConstraints] = useState(starter.constraints || []);
  const [constraintDraft, setConstraintDraft] = useState(null); // { id, type, name, expression, ownerClass }
  const [nextIndex, setNextIndex] = useState((starter.classes?.length || 0) + 1);

  const BOX_W = 220;
  const BOX_MIN_H = 60;

  const { centerOf, getRect } = useBoxMeasurements({ boxRefs, positions, containerRef, BOX_W, BOX_MIN_H });
  const { startDrag } = useBoxDrag({ setPositions, containerRef, positionsRef });

  useEffect(() => {
    // initialize positions in a grid similar to preview
    // but preserve any existing positions so adding a new class doesn't reset others
    setPositions((prev) => {
      const p = { ...prev };
      const perRow = Math.max(1, Math.ceil(Math.sqrt(Math.max(1, (classes || []).length))));
      (classes || []).forEach((c, i) => {
        if (!p[c.name]) {
          const row = Math.floor(i / perRow);
          const col = i % perRow;
          p[c.name] = { x: col * (BOX_W + 40) + 40, y: row * (BOX_MIN_H + 40) + 40 };
        }
      });
      (enums || []).forEach((e, i) => {
        const key = `enum:${e.name}`;
        if (!p[key]) p[key] = { x: (perRow + 1) * (BOX_W + 40) + 40, y: i * (BOX_MIN_H + 40) + 40 };
      });
      positionsRef.current = p;
      return p;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes.length, enums.length]);

  useEffect(() => {
    // If initialModel changes (e.g., coming from preview), adopt it
    const modelToUse = initialModel || location?.state?.model;
    if (!modelToUse) return;
    setClasses(modelToUse.classes || []);
    setEnums(modelToUse.enums || []);
    setAssociations(modelToUse.associations || []);
  }, [initialModel, location?.state?.model]);

  // If we don't have a model but a ?file= param exists, parse it directly
  useEffect(() => {
    if (initialModel || location?.state?.model) return;
    try {
      const params = new URLSearchParams(location.search || '');
      const qfile = params.get('file');
      if (!qfile) return;
      const decoded = decodeURIComponent(qfile);
      let cancelled = false;
      (async () => {
        try {
          const res = await userAPI.parseUseModel(decoded);
          const payload = res?.data ?? res;
          const m = payload.model ? payload.model : payload;
          if (!cancelled && m) {
            setClasses(m.classes || []);
            setEnums(m.enums || []);
            setAssociations(m.associations || []);
          }
        } catch {
          // ignore parse errors here — preview shows parse UI
        }
      })();
      return () => {
        cancelled = true;
      };
    } catch {
      // noop
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // link dragging state (temporary line and hover)
  const [linkDrag, setLinkDrag] = useState(null);
  // hovered target (not currently used visually)
  const [choice, setChoice] = useState(null);

  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  const onToolDragStart = (ev, type) => ev.dataTransfer.setData('application/uml', type);
  const openConstraintModal = () => {
    setConstraintDraft({ id: uid('con'), type: 'inv', name: '', expression: '', ownerClass: null });
  };
  const onCanvasDragOver = (e) => e.preventDefault();
  const onCanvasDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/uml');
    const rect = containerRef.current?.getBoundingClientRect();
    const x = (e.clientX || 0) - (rect?.left || 0);
    const y = (e.clientY || 0) - (rect?.top || 0);
    if (type === 'class') {
      const name = `Class${nextIndex}`;
      setClasses((s) => [...s, { name, attributes: [], superclasses: [] }]);
      setPositions((p) => ({ ...p, [name]: { x: Math.max(12, x - BOX_W / 2), y: Math.max(12, y - 28) } }));
      setNextIndex((n) => n + 1);
    }
    if (type === 'enum') {
      const name = `Enum${nextIndex}`;
      setEnums((s) => [...s, { name, values: [] }]);
      setPositions((p) => ({ ...p, [`enum:${name}`]: { x: Math.max(12, x - BOX_W / 2), y: Math.max(12, y - 28) } }));
      setNextIndex((n) => n + 1);
    }
    // no drag-to-add for constraints; use modal
  };

  const cancelEdit = (name, type = 'class') => {
    // discard staged buffers for this item and reset editing state
    if (type === 'enum') {
      setEnumEditBuffers((prev) => {
        const np = { ...prev };
        delete np[name];
        return np;
      });
      setNewEnumInputs((n) => ({ ...n, [name]: { value: '', adding: false } }));
    } else {
      setAttrEditBuffers((prev) => {
        const np = { ...prev };
        delete np[name];
        return np;
      });
      setNewAttrInputs((n) => ({ ...n, [name]: { name: '', type: '', adding: false } }));
    }
    setEditingName(null);
    setEditingType('class');
    setEditValue('');
  };

  const startLinkDrag = (ev, fromName) => {
    ev.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    setLinkDrag({ from: fromName, x: (ev.clientX || 0) - (rect?.left || 0), y: (ev.clientY || 0) - (rect?.top || 0) });
  };

  useEffect(() => {
    if (!linkDrag) return undefined;
    const onMove = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const x = (e.clientX || 0) - (rect?.left || 0);
      const y = (e.clientY || 0) - (rect?.top || 0);
      setLinkDrag((l) => ({ ...l, x, y }));
    };
    const onUp = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const x = (e.clientX || 0) - (rect?.left || 0);
      const y = (e.clientY || 0) - (rect?.top || 0);
      let target = null;
      Object.keys(positions).forEach((name) => {
        const left = positions[name].x;
        const top = positions[name].y;
        const right = left + BOX_W;
        const bottom = top + BOX_MIN_H;
        if (x >= left && x <= right && y >= top && y <= bottom) target = name;
      });
      if (target && target !== linkDrag.from) setChoice({ from: linkDrag.from, to: target, x, y });
      setLinkDrag(null);
      // clear hover (not used)
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [linkDrag, positions]);

  const addAssociation = (from, to, left = '1', right = '*', name = '') => {
    const assoc = {
      id: uid('a'),
      name,
      parts: [
        { class: from, multiplicity: left, role: from },
        { class: to, multiplicity: right, role: to },
      ],
    };
    setAssociations((s) => [...s, assoc]);
  };

  const addGeneralization = (sub, sup) =>
    setClasses((s) =>
      s.map((c) => (c.name === sub ? { ...c, superclasses: Array.from(new Set([...(c.superclasses || []), sup])) } : c))
    );

  const [editingName, setEditingName] = useState(null);
  const [editingType, setEditingType] = useState('class'); // 'class' or 'enum'
  const [editValue, setEditValue] = useState('');
  const [attrEditBuffers, setAttrEditBuffers] = useState({}); // staged attribute edits per class
  const [enumEditBuffers, setEnumEditBuffers] = useState({}); // staged enum value edits per enum
  const [newAttrInputs, setNewAttrInputs] = useState({}); // { [className]: { name:'', type:'', adding: bool } }
  const [assocModal, setAssocModal] = useState(null); // { from, to, left, right, name }
  const [newEnumInputs, setNewEnumInputs] = useState({}); // { [enumName]: { value:'', adding: bool } }

  // (modal actions inline in modal below)

  const commitEdit = (oldName, type = 'class') => {
    const val = (editValue || '').trim();
    // apply staged edits (attributes / enum values) and optionally rename
    if (type === 'enum') {
      setEnums((s) =>
        s.map((e) => {
          if (e.name !== oldName) return e;
          const newName = val || oldName;
          return { ...e, name: newName, values: enumEditBuffers[oldName] ?? e.values };
        })
      );
      // move/cleanup buffer
      setEnumEditBuffers((prev) => {
        const np = { ...prev };
        if (oldName in np) {
          const data = np[oldName];
          delete np[oldName];
          if (val && val !== oldName) np[val] = data;
        }
        return np;
      });
      // if renaming, update associations and positions
      if (val && val !== oldName) {
        setAssociations((as) =>
          as.map((a) => ({
            ...a,
            parts: a.parts?.map((p) => ({ ...p, class: p.class === oldName ? val : p.class })) || [],
          }))
        );
        setPositions((p) => {
          const np = { ...p };
          if (np[`enum:${oldName}`]) {
            np[`enum:${val}`] = np[`enum:${oldName}`];
            delete np[`enum:${oldName}`];
          }
          return np;
        });
      }
    } else {
      setClasses((s) =>
        s.map((c) => {
          if (c.name !== oldName) return c;
          const newName = val || oldName;
          return { ...c, name: newName, attributes: attrEditBuffers[oldName] ?? c.attributes };
        })
      );
      setAttrEditBuffers((prev) => {
        const np = { ...prev };
        if (oldName in np) {
          const data = np[oldName];
          delete np[oldName];
          if (val && val !== oldName) np[val] = data;
        }
        return np;
      });
      if (val && val !== oldName) {
        setAssociations((as) =>
          as.map((a) => ({
            ...a,
            parts: a.parts?.map((p) => ({ ...p, class: p.class === oldName ? val : p.class })) || [],
          }))
        );
        setPositions((p) => {
          const np = { ...p };
          if (np[oldName]) {
            np[val] = np[oldName];
            delete np[oldName];
          }
          return np;
        });
      }
    }

    setEditingName(null);
    setEditingType('class');
    setEditValue('');
  };

  // start adding attribute inline for a class
  const startAddingAttr = (clsName) => {
    setNewAttrInputs((n) => ({ ...n, [clsName]: { name: '', type: '', adding: true } }));
    setEditingName(clsName);
    setEditingType('class');
    ensureAttrBuffer(clsName);
  };

  // ensure a staged buffer exists for editing a class's attributes
  const ensureAttrBuffer = (clsName) => {
    setAttrEditBuffers((prev) => {
      if (prev[clsName]) return prev;
      const cls = classes.find((c) => c.name === clsName) || { attributes: [] };
      const copy = (cls.attributes || []).map((a) => (typeof a === 'object' ? { ...a } : a));
      return { ...prev, [clsName]: copy };
    });
  };

  const cancelAddingAttr = (clsName) =>
    setNewAttrInputs((n) => ({
      ...n,
      [clsName]: { ...(n[clsName] || {}), adding: false },
    }));

  const commitAddingAttr = (clsName) => {
    const data = newAttrInputs[clsName];
    if (!data) return cancelAddingAttr(clsName);
    const nm = (data.name || '').trim();
    const tp = (data.type || '').trim();
    if (!nm) return; // require a name
    const attrObj = tp ? { name: nm, type: tp } : { name: nm };

    // if editing this class, stage into buffer; otherwise write directly
    if (editingName === clsName) {
      setAttrEditBuffers((prev) => ({ ...prev, [clsName]: [...(prev[clsName] || []), attrObj] }));
    } else {
      setClasses((s) =>
        s.map((c) => (c.name === clsName ? { ...c, attributes: [...(c.attributes || []), attrObj] } : c))
      );
    }

    setNewAttrInputs((n) => ({ ...n, [clsName]: { name: '', type: '', adding: false } }));
  };

  const updateNewAttrInput = (clsName, key, value) =>
    setNewAttrInputs((n) => ({ ...n, [clsName]: { ...(n[clsName] || {}), [key]: value } }));

  const updateAttribute = (clsName, idx, name, type) => {
    // if editing this class, update staged buffer, otherwise update live classes
    if (editingName === clsName) {
      setAttrEditBuffers((prev) => ({
        ...prev,
        [clsName]: (prev[clsName] || classes.find((c) => c.name === clsName)?.attributes || [])
          .map((a, i) => (i === idx ? (name ? (type ? { name, type } : { name }) : null) : a))
          .filter(Boolean),
      }));
      return;
    }

    setClasses((s) =>
      s.map((c) =>
        c.name === clsName
          ? {
              ...c,
              attributes: c.attributes
                .map((a, i) => (i === idx ? (name ? (type ? { name, type } : { name }) : null) : a))
                .filter(Boolean),
            }
          : c
      )
    );
  };

  const deleteAttribute = (clsName, idx) => {
    // stage deletion if editing, otherwise apply immediately
    if (editingName === clsName) {
      setAttrEditBuffers((prev) => ({
        ...prev,
        [clsName]: (prev[clsName] || classes.find((c) => c.name === clsName)?.attributes || []).filter(
          (_, i) => i !== idx
        ),
      }));
      return;
    }

    setClasses((s) =>
      s.map((c) => (c.name === clsName ? { ...c, attributes: c.attributes.filter((_, i) => i !== idx) } : c))
    );
  };

  // Enum value editing helpers
  const startAddingEnumValue = (enumName) => {
    setNewEnumInputs((n) => ({ ...n, [enumName]: { value: '', adding: true } }));
    setEditingName(enumName);
    setEditingType('enum');
  };

  // ensure a staged buffer exists for editing an enum's values
  const ensureEnumBuffer = (enumName) => {
    setEnumEditBuffers((prev) => {
      if (prev[enumName]) return prev;
      const en = enums.find((e) => e.name === enumName) || { values: [] };
      const copy = Array.isArray(en.values) ? [...en.values] : [];
      return { ...prev, [enumName]: copy };
    });
  };

  const cancelAddingEnumValue = (enumName) =>
    setNewEnumInputs((n) => ({ ...n, [enumName]: { ...(n[enumName] || {}), adding: false } }));

  const commitAddingEnumValue = (enumName) => {
    const data = newEnumInputs[enumName];
    if (!data) return cancelAddingEnumValue(enumName);
    const val = (data.value || '').trim();
    if (!val) return;
    // if editing this enum, stage into buffer; otherwise write directly
    if (editingName === enumName) {
      setEnumEditBuffers((prev) => ({ ...prev, [enumName]: [...(prev[enumName] || []), val] }));
    } else {
      setEnums((s) => s.map((e) => (e.name === enumName ? { ...e, values: [...(e.values || []), val] } : e)));
    }
    setNewEnumInputs((n) => ({ ...n, [enumName]: { value: '', adding: false } }));
  };

  const updateNewEnumInput = (enumName, value) =>
    setNewEnumInputs((n) => ({ ...n, [enumName]: { ...(n[enumName] || {}), value } }));

  const updateEnumValue = (enumName, idx, value) => {
    // if editing, update buffer, otherwise update live enums
    if (editingName === enumName) {
      setEnumEditBuffers((prev) => ({
        ...prev,
        [enumName]: (prev[enumName] || enums.find((e) => e.name === enumName)?.values || []).map((v, i) =>
          i === idx ? value : v
        ),
      }));
      return;
    }

    setEnums((s) =>
      s.map((e) => (e.name === enumName ? { ...e, values: e.values.map((v, i) => (i === idx ? value : v)) } : e))
    );
  };

  const deleteEnumValue = (enumName, idx) => {
    if (editingName === enumName) {
      setEnumEditBuffers((prev) => ({
        ...prev,
        [enumName]: (prev[enumName] || enums.find((e) => e.name === enumName)?.values || []).filter(
          (_, i) => i !== idx
        ),
      }));
      return;
    }

    setEnums((s) => s.map((e) => (e.name === enumName ? { ...e, values: e.values.filter((_, i) => i !== idx) } : e)));
  };

  // attribute editing helpers remain in this file; types/options are provided to components

  const exportModel = () => {
    const normalizeAttr = (a) => {
      if (a == null) return null;
      if (typeof a === 'string') {
        const parts = a.split(':').map((s) => s.trim());
        return parts.length > 1 ? { name: parts[0], type: parts.slice(1).join(':') } : { name: parts[0] };
      }
      if (typeof a === 'object') return { name: a.name || '', type: a.type || '' };
      return { name: String(a) };
    };
    const modelJson = {
      model: starter.model || 'Model',
      enums: enums.map((e) => ({
        name: e.name,
        values: Array.isArray(e.values)
          ? e.values.map((v) => (typeof v === 'string' ? v : (v?.name ?? String(v))))
          : [],
      })),
      classes: classes.map((c) => ({
        name: c.name,
        attributes: Array.isArray(c.attributes) ? c.attributes.map(normalizeAttr).filter(Boolean) : [],
        operations: c.operations || [],
        superclasses: c.superclasses || [],
        isAbstract: !!c.isAbstract,
      })),
      associations: associations.map((a) => ({ name: a.name || '', parts: a.parts })),
      constraints: (constraints || []).map((c) => ({
        id: c.id,
        type: c.type,
        name: c.name || '',
        expression: c.expression || '',
        ownerClass: c.ownerClass || null,
      })),
    };

    // call backend converter and forward response
    console.log(JSON.stringify(modelJson, null, 2));
    userAPI
      .convertUmlJson({ graphJson: modelJson })
      .then((res) => {
        const data = res?.data ?? res;
        console.log('Server convert result:', data);
        if (onResult) onResult(data);
      })
      .catch((err) => {
        console.error('convertUmlJson failed', err);
        // still call onResult with raw model if provided
        if (onResult) onResult({ success: false, error: err?.message || String(err), graphJson: modelJson });
      });
  };

  // No manual path import allowed — preview provides parsed model via router state

  return (
    <div className="uml-editor">
      <UmlToolbox
        onToolDragStart={onToolDragStart}
        onExport={exportModel}
        onOpenConstraintModal={openConstraintModal}
      />

      <div className="uml-canvas-area">
        <div ref={containerRef} onDragOver={onCanvasDragOver} onDrop={onCanvasDrop} className="uml-canvas">
          {/* svg layer */}
          <UMLCanvas associations={associations} classes={classes} centerOf={centerOf} getRect={getRect} />

          {/* render boxes with existing UML CSS classes */}
          {[...classes].map((c) => {
            const pos = positions[c.name] || { x: 40, y: 40 };
            const newAttr = newAttrInputs[c.name] || { name: '', type: '', adding: false };
            const attrs = editingName === c.name ? (attrEditBuffers[c.name] ?? c.attributes) : c.attributes;
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
                        onKeyDown={(e) => e.key === 'Enter' && commitEdit(c.name)}
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
                          commitEdit(c.name);
                        }}
                      />
                      <i
                        className="fa fa-times uml-icon-btn"
                        title="Cancel"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEdit(c.name, 'class');
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
                          ensureAttrBuffer(c.name);
                          setEditingName(c.name);
                          setEditingType('class');
                          setEditValue(c.name);
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
                          clsName={c.name}
                          attr={a}
                          idx={idx}
                          editing={editingName === c.name}
                          onUpdate={(i, n, t) => updateAttribute(c.name, i, n, t)}
                          onDelete={(i) => deleteAttribute(c.name, i)}
                          classes={classes}
                          enums={enums}
                        />
                      ))}
                    {/* new attr inline editor when adding */}
                    {editingName === c.name && newAttr.adding && (
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
                  </div>
                  <div className="uml-box-actions">
                    <div
                      className="uml-connector"
                      title="Drag to link"
                      onPointerDown={(e) => startLinkDrag(e, c.name)}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {[...enums].map((en) => {
            const key = `enum:${en.name}`;
            const pos = positions[key] || { x: 40, y: 40 };
            const newEnum = newEnumInputs[en.name] || { value: '', adding: false };
            return (
              <div
                key={en.name}
                ref={(el) => (boxRefs.current[key] = el)}
                className="uml-box uml-enum"
                style={{ left: pos.x, top: pos.y, width: BOX_W / 1.2 }}
                onMouseDown={(e) => startDrag(key, e)}
              >
                <EnumEditor
                  en={en}
                  editingName={editingName}
                  editingType={editingType}
                  editValue={editValue}
                  onEditChange={(v) => setEditValue(v)}
                  onStartEdit={() => {
                    ensureEnumBuffer(en.name);
                    setEditingName(en.name);
                    setEditingType('enum');
                    setEditValue(en.name);
                  }}
                  onCommitEdit={() => commitEdit(en.name, 'enum')}
                  onCancelEdit={() => {
                    cancelEdit(en.name, 'enum');
                  }}
                  newEnum={newEnum}
                  onUpdateValue={(idx, val) => {
                    if (idx === 'new') updateNewEnumInput(en.name, val);
                    else updateEnumValue(en.name, idx, val);
                  }}
                  onDeleteValue={(idx) => deleteEnumValue(en.name, idx)}
                  onStartAddValue={() => startAddingEnumValue(en.name)}
                  onCommitAddValue={() => commitAddingEnumValue(en.name)}
                  onCancelAddValue={() => cancelAddingEnumValue(en.name)}
                  classes={classes}
                />
              </div>
            );
          })}

          {/* temporary link line */}
          {linkDrag && (
            <svg className="uml-temp-svg">
              {centerOf(linkDrag.from) && (
                <line
                  x1={centerOf(linkDrag.from).x}
                  y1={centerOf(linkDrag.from).y}
                  x2={linkDrag.x}
                  y2={linkDrag.y}
                  stroke="#333"
                  strokeWidth={2}
                />
              )}
            </svg>
          )}

          {choice && (
            <div className="uml-choice-popup" style={{ left: choice.x + 8, top: choice.y + 8 }}>
              <div className="uml-choice-title">Create relationship</div>
              <div className="uml-choice-actions">
                <button
                  onClick={() => {
                    setAssocModal({ from: choice.from, to: choice.to, left: '1', right: '*', name: '' });
                    setChoice(null);
                  }}
                >
                  Association
                </button>
                <button
                  onClick={() => {
                    addGeneralization(choice.from, choice.to);
                    setChoice(null);
                  }}
                >
                  Generalization
                </button>
                <button onClick={() => setChoice(null)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Association modal */}
          {assocModal && (
            <div className="uml-modal-overlay" onClick={() => setAssocModal(null)}>
              <div className="uml-modal" onClick={(e) => e.stopPropagation()}>
                <div className="uml-modal-title">Association details</div>
                <div className="uml-modal-row">
                  <div>
                    <label className="uml-modal-label">Left multiplicity</label>
                    <input
                      className="uml-modal-input"
                      value={assocModal.left}
                      onChange={(e) => setAssocModal((m) => ({ ...m, left: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="uml-modal-label">Right multiplicity</label>
                    <input
                      className="uml-modal-input"
                      value={assocModal.right}
                      onChange={(e) => setAssocModal((m) => ({ ...m, right: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="uml-modal-section">
                  <label className="uml-modal-label">Name (optional)</label>
                  <input
                    className="uml-modal-input"
                    value={assocModal.name}
                    onChange={(e) => setAssocModal((m) => ({ ...m, name: e.target.value }))}
                  />
                </div>
                <div className="uml-modal-actions">
                  <button onClick={() => setAssocModal(null)} title="Cancel">
                    <i className="fa fa-times" /> Cancel
                  </button>
                  <button
                    onClick={() => {
                      addAssociation(
                        assocModal.from,
                        assocModal.to,
                        assocModal.left || '1',
                        assocModal.right || '*',
                        assocModal.name || ''
                      );
                      setAssocModal(null);
                    }}
                    title="Create association"
                  >
                    <i className="fa fa-save" /> Save
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Constraint modal (single textarea) */}
          {constraintDraft && (
            <div className="uml-modal-overlay" onClick={() => setConstraintDraft(null)}>
              <div className="uml-modal uml-modal-small" onClick={(e) => e.stopPropagation()}>
                <div className="uml-modal-title">New Constraint</div>
                <div className="uml-modal-section">
                  <label className="uml-modal-label">Constraint (single-line header optional)</label>
                  <textarea
                    rows={4}
                    className="uml-modal-input"
                    placeholder="Optional: prefix with `inv: ClassName: ` or `pre: ClassName: `, then the expression"
                    value={constraintDraft.expression || ''}
                    onChange={(e) => setConstraintDraft((d) => ({ ...d, expression: e.target.value }))}
                  />
                </div>
                <div className="uml-modal-actions">
                  <button onClick={() => setConstraintDraft(null)} title="Cancel">
                    <i className="fa fa-times" /> Cancel
                  </button>
                  <button
                    onClick={() => {
                      // parse optional type and owner from the start of the text
                      const raw = (constraintDraft.expression || '').trim();
                      const m = raw.match(/^(?:(inv|pre|post)\s*[:\-\s]+)?(?:(\w+)\s*[:\-\s]+)?([\s\S]+)$/i);
                      let type = 'inv';
                      let owner = null;
                      let expr = raw;
                      if (m) {
                        if (m[1]) type = m[1].toLowerCase();
                        if (m[2]) owner = m[2];
                        expr = (m[3] || '').trim();
                      }
                      const con = {
                        id: constraintDraft.id || uid('con'),
                        type,
                        name: '',
                        expression: expr,
                        ownerClass: owner,
                      };
                      setConstraints((s) => [...s, con]);
                      setConstraintDraft(null);
                    }}
                    title="Create constraint"
                  >
                    <i className="fa fa-save" /> Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
