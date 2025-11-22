import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../../../assets/styles/components/ui/UMLPreview.css';
import '../../../assets/styles/components/ui/UMLEditor.css';
import useBoxMeasurements from '../../../hooks/useBoxMeasurements';
import useBoxDrag from '../../../hooks/useBoxDrag';
import useConstraints from '../../../hooks/useConstraints';
import useLinkDrag from '../../../hooks/useLinkDrag';
import UMLCanvas from './UMLCanvas';
import userAPI from '../../../../services/userAPI';
import ClassBox from './editor/ClassBox';
import EnumBox from './editor/EnumBox';
import UmlToolbox from './editor/UmlToolbox';
import AttributeTypeSelect from './editor/AttributeTypeSelect';
import ConstraintModal from './editor/ConstraintModal';
import ChoicePopup from './editor/ChoicePopup';
import AssociationModal from './editor/AssociationModal';
import ConstraintList from './editor/ConstraintList';
import ConstraintBox from './editor/ConstraintBox';
import UmlEditorContext from '../../../contexts/UmlEditorContext';
import ModelTreePane from './editor/ModelTreePane';
import ExportModal from './ExportModal'; // Export modal component

export default function UMLEditor({ initialModel = null }) {
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
  const { constraints, constraintDraft, setConstraintDraft, createConstraint, deleteConstraint } = useConstraints(
    starter.constraints || []
  );
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

  // link dragging moved into hook

  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  const onToolDragStart = (ev, type) => ev.dataTransfer.setData('application/uml', type);
  // constraints handled by useConstraints hook (openConstraintModal, createConstraint, deleteConstraint)
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
    setEditValue('');
  };

  // useLinkDrag hook handles temporary link line, pointer listeners and choice
  const { linkDrag, startLinkDrag, choice, setChoice, assocModal, setAssocModal, addAssociation, addGeneralization } =
    useLinkDrag({
      positionsRef,
      containerRef,
      BOX_W,
      BOX_MIN_H,
      onAddAssociation: (assoc) => setAssociations((s) => [...s, assoc]),
      onAddGeneralization: (sub, sup) =>
        setClasses((s) =>
          s.map((c) => {
            if (c.name === sub) {
              return { ...c, superclasses: Array.from(new Set([...(c.superclasses || []), sup])) };
            }
            return c;
          })
        ),
    });

  // addAssociation and addGeneralization provided by hook and routed above

  const [editingName, setEditingName] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [attrEditBuffers, setAttrEditBuffers] = useState({}); // staged attribute edits per class
  const [enumEditBuffers, setEnumEditBuffers] = useState({}); // staged enum value edits per enum
  const [newAttrInputs, setNewAttrInputs] = useState({}); // { [className]: { name:'', type:'', adding: bool } }
  // assocModal handled by hook
  const [newEnumInputs, setNewEnumInputs] = useState({}); // { [enumName]: { value:'', adding: bool } }
  // operations will be exposed/editable from the ModelTree pane below the canvas

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
    setEditValue('');
  };

  const deleteClass = (className) => {
    // Remove the class
    setClasses((prevClasses) => prevClasses.filter((c) => c.name !== className));

    // Remove associations related to the class
    setAssociations((prevAssociations) =>
      prevAssociations.filter((assoc) => !assoc.parts.some((part) => part.class === className))
    );

    // Remove positions related to the class
    setPositions((prevPositions) => {
      const updatedPositions = { ...prevPositions };
      delete updatedPositions[className];
      return updatedPositions;
    });
  };

  // start adding attribute inline for a class
  const startAddingAttr = (clsName) => {
    setNewAttrInputs((n) => ({ ...n, [clsName]: { name: '', type: '', adding: true } }));
    setEditingName(clsName);
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

  // Build the JSON payload sent to export endpoint
  const buildModelJson = () => {
    const normalizeAttr = (a) => {
      if (a == null) return null;
      if (typeof a === 'string') {
        const parts = a.split(':').map((s) => s.trim());
        return parts.length > 1 ? { name: parts[0], type: parts.slice(1).join(':') } : { name: parts[0] };
      }
      if (typeof a === 'object') return { name: a.name || '', type: a.type || '' };
      return { name: String(a) };
    };
    return {
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
      associations: associations.map((a) => ({
        name: a.name || '',
        parts: a.parts || [],
        type: a.type || 'association',
        attributes: Array.isArray(a.attributes) ? a.attributes.map(normalizeAttr).filter(Boolean) : [],
      })),
      constraints: (constraints || []).map((c) => ({
        id: c.id,
        type: c.type,
        name: c.name || '',
        expression: c.expression || '',
        ownerClass: c.ownerClass || null,
      })),
    };
  };

  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportedText, setExportedText] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const handleExport = async () => {
    setExportError(null);
    setExporting(true);
    try {
      const modelJson = buildModelJson();
      const res = await userAPI.convertUmlJson(modelJson); // backend expects raw model JSON body
      const data = res?.data ?? res;
      // Accept either plain string or structured object
      const useText =
        typeof data === 'string' ? data : data.useText || data.fileContent || JSON.stringify(data, null, 2);
      setExportedText(useText);
      setExportModalVisible(true);
    } catch (e) {
      console.error('Export failed:', e);
      setExportError(e?.response?.data?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const contextValue = {
    positionsRef,
    positions,
    setPositions,
    boxRefs,
    startDrag,
    startLinkDrag,
    ensureAttrBuffer,
    ensureEnumBuffer,
    updateAttribute,
    deleteAttribute,
    startAddingAttr,
    updateNewAttrInput,
    commitAddingAttr,
    cancelAddingAttr,
    updateEnumValue,
    deleteEnumValue,
    commitAddingEnumValue,
    classes,
    enums,
    editingName,
    editValue,
    setEditValue,
    deleteClass, // Pass deleteClass to context
  };

  const handleUpdateNode = (key, text) => {
    if (!key) return;
    // class:name -> store as _notes on the class
    if (key.startsWith('class:')) {
      const name = key.split(':')[1];
      setClasses((s) => s.map((c) => (c.name === name ? { ...c, _notes: text } : c)));
      return;
    }
    // assoc:index
    if (key.startsWith('assoc:')) {
      const idx = parseInt(key.split(':')[1], 10);
      if (Number.isFinite(idx)) {
        setAssociations((s) => s.map((a, i) => (i === idx ? { ...a, _notes: text } : a)));
      }
      return;
    }
    // inv:id (not directly mutable here - constraints are managed by useConstraints hook)
    if (key.startsWith('inv:')) {
      return;
    }
    if (key.startsWith('op:')) {
      const parts = key.split(':');
      const className = parts[1];
      const idx = parseInt(parts[2], 10);
      setClasses((s) =>
        s.map((c) => {
          if (c.name !== className) return c;
          const ops = Array.isArray(c.operations) ? [...c.operations] : [];
          if (ops[idx]) {
            const op = ops[idx];
            const newOp = typeof op === 'string' ? { name: op, _notes: text } : { ...op, _notes: text };
            ops[idx] = newOp;
            return { ...c, operations: ops };
          }
          return c;
        })
      );
      return;
    }
  };

  return (
    <UmlEditorContext.Provider value={contextValue}>
      <div className="uml-editor">
        <div className="uml-left-panel">
          <UmlToolbox onToolDragStart={onToolDragStart} />
          <div className="uml-divider" />
          <ModelTreePane
            modelName={starter.model || 'Model'}
            classes={classes}
            associations={associations}
            constraints={constraints}
            enumerations={enums}
            onUpdateNode={handleUpdateNode}
          />
          <button
            className="export-button"
            onClick={handleExport}
            disabled={exporting}
            title={exportError || 'Export USE model'}
          >
            {exporting ? 'Exporting…' : 'Export'}
          </button>
          {exportError && <div className="export-error">{exportError}</div>}
        </div>

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
                <ClassBox
                  key={c.name}
                  c={c}
                  pos={pos}
                  boxRefs={boxRefs}
                  startDrag={startDrag}
                  editingName={editingName}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  onStartEdit={() => {
                    ensureAttrBuffer(c.name);
                    setEditingName(c.name);
                    setEditValue(c.name);
                  }}
                  onCommitEdit={() => commitEdit(c.name)}
                  onCancelEdit={() => cancelEdit(c.name, 'class')}
                  startAddingAttr={startAddingAttr}
                  newAttr={newAttr}
                  attrs={attrs}
                  onUpdateAttribute={updateAttribute}
                  onDeleteAttribute={deleteAttribute}
                  updateNewAttrInput={updateNewAttrInput}
                  commitAddingAttr={commitAddingAttr}
                  cancelAddingAttr={cancelAddingAttr}
                  startLinkDrag={startLinkDrag}
                  classes={classes}
                  enums={enums}
                  onDeleteClass={deleteClass} // Pass deleteClass to ClassBox
                />
              );
            })}

            {[...enums].map((en) => {
              const key = `enum:${en.name}`;
              const pos = positions[key] || { x: 40, y: 40 };
              const newEnum = newEnumInputs[en.name] || { value: '', adding: false };
              return (
                <EnumBox
                  key={en.name}
                  en={en}
                  pos={pos}
                  boxRefs={boxRefs}
                  startDrag={startDrag}
                  editingName={editingName}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  onStartEdit={() => {
                    ensureEnumBuffer(en.name);
                    setEditingName(en.name);
                    setEditValue(en.name);
                  }}
                  onCommitEdit={() => commitEdit(en.name, 'enum')}
                  onCancelEdit={() => cancelEdit(en.name, 'enum')}
                  newEnum={newEnum}
                  onUpdateValue={(idx, val) => {
                    if (idx === 'new') updateNewEnumInput(en.name, val);
                    else updateEnumValue(en.name, idx, val);
                  }}
                  onDeleteValue={(idx) => deleteEnumValue(en.name, idx)}
                  onCommitAddValue={() => commitAddingEnumValue(en.name)}
                  onCancelAddValue={() => cancelAddingEnumValue(en.name)}
                  classes={classes}
                />
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

            <ChoicePopup
              choice={choice}
              onPickType={(type) => {
                if (!choice) return;
                const baseParts = [
                  { class: choice.from, multiplicity: '1', role: choice.from },
                  { class: choice.to, multiplicity: '*', role: choice.to },
                ];
                if (type === 'association' || type === 'aggregation' || type === 'composition') {
                  setAssocModal({ type, parts: baseParts, name: '' });
                } else if (type === 'n-ary' || type === 'associationclass') {
                  // For n-ary, prefill an extra empty participant so the user can add the third
                  // role more easily. AssociationClass shares similar UI (attributes).
                  const extra = { class: '', multiplicity: '', role: '' };
                  setAssocModal({ type, parts: [...baseParts, extra], name: '', attributes: [] });
                }
                setChoice(null);
              }}
              onGeneralization={() => {
                if (!choice) return;
                addGeneralization(choice.from, choice.to);
                setChoice(null);
              }}
              onCancel={() => setChoice(null)}
            />

            {/* Association modal */}
            <AssociationModal
              assoc={assocModal}
              classes={classes}
              onChange={(next) => setAssocModal(next)}
              onClose={() => setAssocModal(null)}
              onSave={(a) => {
                // normalize and pass full assoc object to hook
                addAssociation(a);
                setAssocModal(null);
              }}
            />
            {/* Constraint modal (single textarea) */}
            {constraintDraft && (
              <ConstraintModal
                draft={constraintDraft}
                onChange={(v) => setConstraintDraft((d) => ({ ...(d || {}), expression: v }))}
                onCancel={() => setConstraintDraft(null)}
                onCreate={createConstraint}
              />
            )}

            {/* Operation modal removed; operations managed in ModelTree pane */}

            {/* Constraint list (side panel) */}
            <ConstraintList constraints={constraints} onDelete={deleteConstraint} />
            <ConstraintBox constraints={constraints} positions={positionsRef.current || {}} />
            {/* model tree moved to left panel */}
          </div>
        </div>

        {exportModalVisible && <ExportModal fileContent={exportedText} onClose={() => setExportModalVisible(false)} />}
      </div>
    </UmlEditorContext.Provider>
  );
}
