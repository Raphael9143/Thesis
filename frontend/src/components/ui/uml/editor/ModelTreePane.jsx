import React, { useState } from 'react';
import '../../../../assets/styles/components/ui/UMLEditor.css';
import TreeSection from './TreeSection';
import TreeLeaf from './TreeLeaf';
import Modal from '../../../ui/Modal';
import useSerialize from '../../../../hooks/useSerialize';
import useDeserialize from '../../../../hooks/useDeserialize';
import { useRef } from 'react';

export default function ModelTreePane({
  modelName = 'Model',
  classes = [],
  associations = [],
  constraints = [],
  enumerations = [],
  onSelect,
  onUpdateNode,
}) {
  const [openKeys, setOpenKeys] = useState({});
  const [selected, setSelected] = useState(null);
  const [detailText, setDetailText] = useState('');
  const [readOnlyText, setReadOnlyText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const serializeTokenRef = useRef(0);
  const textareaRef = useRef(null);
  const {
    serializeClass,
    serializeAssociation,
    serializeOperation,
    serializeQueryOperation,
    serializeConstraint,
    serializeEnum,
    loading: serializing,
  } = useSerialize();
  const {
    deserializeClass,
    deserializeAssociation,
    deserializeOperation,
    deserializeQueryOperation,
    deserializeConstraint,
    deserializeEnum,
    loading: deserializing,
  } = useDeserialize();

  const toggleOpen = (key) => setOpenKeys((o) => ({ ...o, [key]: !o[key] }));

  // add-mode state: { type: 'inv'|'cond'|'op'|'qop', className: string|null }
  const [addMode, setAddMode] = useState(null);

  // Build lists preserving original indices so updates can target the correct entry
  const invariantList = constraints
    .map((c, i) => ({ c, idx: i }))
    .filter((x) => x.c && x.c.type === 'invariant');
  const prepostList = constraints
    .map((c, i) => ({ c, idx: i }))
    .filter((x) => x.c && (x.c.type === 'precondition' || x.c.type === 'postcondition'));

  const handleSelect = (key, payload) => {
    setSelected({ key, payload });
    setDetailText('');
    setReadOnlyText('');
    // Show human-friendly USE text when possible (serialize JSON -> USE)
    const trySerialize = async () => {
      // capture token to ignore stale responses if selection changes or save occurs
      const myToken = ++serializeTokenRef.current;
      if (!payload) return;
      try {
        if (key.startsWith('class:')) {
          const res = await serializeClass(payload);
          if (serializeTokenRef.current !== myToken) return; // stale
          const text = res?.data?.data || res?.data || res;
          setReadOnlyText(
            typeof text === 'string' ? text : text.useText || JSON.stringify(text, null, 2)
          );
        } else if (key.startsWith('assoc:')) {
          const res = await serializeAssociation(payload);
          const text = res?.data?.data || res?.data || res;
          setReadOnlyText(
            typeof text === 'string' ? text : text.useText || JSON.stringify(text, null, 2)
          );
        } else if (key.startsWith('inv:') || key.startsWith('cond:')) {
          // constraint -> USE
          const res = await serializeConstraint(payload);
          const text = res?.data?.data || res?.data || res;
          setReadOnlyText(
            typeof text === 'string' ? text : text.useText || JSON.stringify(text, null, 2)
          );
        } else if (key.startsWith('enum:')) {
          // enum -> USE
          const res = await serializeEnum(payload);
          const text = res?.data?.data || res?.data || res;
          setReadOnlyText(
            typeof text === 'string' ? text : text.useText || JSON.stringify(text, null, 2)
          );
        } else if (key.startsWith('op:') || key.startsWith('qop:')) {
          // use query-specific serializer when showing a query op
          const res = key.startsWith('qop:')
            ? await serializeQueryOperation(payload)
            : await serializeOperation(payload);
          if (serializeTokenRef.current !== myToken) return; // stale
          const text = res?.data?.data || res?.data || res;
          setReadOnlyText(
            typeof text === 'string' ? text : text.useText || JSON.stringify(text, null, 2)
          );
        } else {
          // default to showing notes or JSON
          if (serializeTokenRef.current !== myToken) return; // stale
          setReadOnlyText(
            payload && payload._notes ? payload._notes : JSON.stringify(payload, null, 2)
          );
        }
      } catch {
        if (serializeTokenRef.current !== myToken) return; // stale
        setReadOnlyText(
          payload && payload._notes ? payload._notes : JSON.stringify(payload, null, 2)
        );
      }
    };
    trySerialize();
    onSelect && onSelect({ key, payload });
  };

  const handleSave = async () => {
    if (!selected) return;
    // if editing USE text, deserialize back to JSON and pass object to onUpdateNode
    try {
      if (selected.key.startsWith('class:')) {
        const res = await deserializeClass({ text: detailText });
        const payload = res?.data?.data || res?.data || res;
        if (payload) onUpdateNode && onUpdateNode(selected.key, payload);
      } else if (selected.key.startsWith('assoc:')) {
        const res = await deserializeAssociation({ text: detailText });
        const payload = res?.data?.data || res?.data || res;
        if (payload) onUpdateNode && onUpdateNode(selected.key, payload);
      } else if (selected.key.startsWith('inv:') || selected.key.startsWith('cond:')) {
        // deserialize constraint text -> JSON shape expected by backend
        const res = await deserializeConstraint({ text: detailText });
        const payload = res?.data?.data || res?.data || res;
        if (payload) {
          // If backend returned an array of constraint objects, ensure each has a type
          const ensureType = (item) => {
            if (!item) return item;
            if (selected.key.startsWith('inv:') && (!item.type || item.type === '')) {
              item.type = 'invariant';
            }
            if (selected.key.startsWith('cond:') && (!item.type || item.type === '')) {
              item.type = 'precondition';
            }
            return item;
          };

          let normalized = payload;
          if (Array.isArray(payload)) {
            normalized = payload.map(ensureType);
          } else {
            normalized = ensureType(payload);
          }
          onUpdateNode && onUpdateNode(selected.key, normalized);
        }
      } else if (selected.key.startsWith('enum:')) {
        const res = await deserializeEnum({ text: detailText });
        const payload = res?.data?.data || res?.data || res;
        if (payload) onUpdateNode && onUpdateNode(selected.key, payload);
      } else if (selected.key.startsWith('op:') || selected.key.startsWith('qop:')) {
        // pass class context as available in payload when deserializing operation
        // For operation create/edit, if we're in addMode use the chosen class from addMode
        const cls =
          addMode &&
          addMode.type &&
          (addMode.className || (selected.payload && selected.payload.class));
        const body = { text: detailText, class: cls };
        const res = selected.key.startsWith('qop:')
          ? await deserializeQueryOperation(body)
          : await deserializeOperation(body);
        const payload = res?.data?.data || res?.data || res;
        if (payload) {
          // Some backends return an envelope like { success:true, class: 'Bank', ops: [...] }
          // Unwrap that so we pass the actual operation objects/array to the editor.
          let effective = payload;
          if (
            payload &&
            typeof payload === 'object' &&
            (payload.ops || payload.operations || payload.query_operations)
          ) {
            effective = payload.ops || payload.operations || payload.query_operations || [];
            // ensure each op carries the owner class so the editor can infer target class
            if (Array.isArray(effective) && payload.class) {
              effective = effective.map((it) => ({ ...(it || {}), class: payload.class }));
            }
          }

          // Normalize payloads: backend may return USE text (string), an array
          // of strings, or a JSON object/array. Convert string forms into
          // operation objects so the editor can append them correctly.
          const parseOpFromString = (txt) => {
            if (!txt || typeof txt !== 'string') return null;
            // look for simple operation declarations like: name(params)
            const lines = txt
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean);
            const ops = [];
            const opRegex = /([A-Za-z_][\w]*)\s*\([^)]*\)/;
            for (const line of lines) {
              const m = line.match(opRegex);
              if (m) ops.push({ name: m[1], raw: line });
            }
            if (ops.length === 1) return ops[0];
            if (ops.length > 1) return ops;
            // fallback: return a single op with the first non-empty line as name
            return { name: (lines[0] || '').slice(0, 50), raw: txt };
          };

          let normalized = effective;
          if (Array.isArray(effective)) {
            // map string items to op objects
            normalized = effective.map((p) => (typeof p === 'string' ? parseOpFromString(p) : p));
          } else if (typeof effective === 'string') {
            normalized = parseOpFromString(effective);
          }

          onUpdateNode && onUpdateNode(selected.key, normalized);
        }
      } else {
        // fallback: save text as notes
        onUpdateNode && onUpdateNode(selected.key, detailText);
      }
      // update displayed text immediately so user sees their change
      setReadOnlyText(detailText);
      // bump token to cancel any in-flight serialize responses
      serializeTokenRef.current++;
      setModalOpen(false);
    } catch (e) {
      // show raw text in detailText if deserialize failed
      console.error('Deserialize failed', e);
      // still call onUpdateNode with raw text to preserve behavior
      if (onUpdateNode) {
        if (selected.key.startsWith('inv:')) {
          onUpdateNode(selected.key, { raw: detailText, type: 'invariant' });
        } else if (selected.key.startsWith('cond:')) {
          onUpdateNode(selected.key, { raw: detailText, type: 'precondition' });
        } else {
          onUpdateNode(selected.key, detailText);
        }
      }
      // keep modal closed; leave editing state managed by modal
    }
  };

  const handleTabKey = (e) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const el = textareaRef.current;
    if (!el) return;
    const indent = '  '; // 2 spaces
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentValue = detailText || '';

    if (start !== end) {
      // Multi-line selection
      const before = currentValue.substring(0, start);
      const selected = currentValue.substring(start, end);
      const after = currentValue.substring(end);
      const lines = selected.split('\n');

      if (e.shiftKey) {
        // Outdent
        const outdented = lines.map((line) => {
          if (line.startsWith(indent)) return line.slice(indent.length);
          if (line.startsWith('\t')) return line.slice(1);
          return line;
        });
        const joined = outdented.join('\n');
        const newVal = before + joined + after;
        const newStart = start;
        const newEnd = start + joined.length;
        setDetailText(newVal);
        requestAnimationFrame(() => {
          el.selectionStart = newStart;
          el.selectionEnd = newEnd;
        });
      } else {
        // Indent
        const indented = lines.map((line) => indent + line).join('\n');
        const newVal = before + indented + after;
        const newStart = start;
        const newEnd = start + indented.length;
        setDetailText(newVal);
        requestAnimationFrame(() => {
          el.selectionStart = newStart;
          el.selectionEnd = newEnd;
        });
      }
    } else {
      // Single caret insert
      const before = currentValue.substring(0, start);
      const after = currentValue.substring(end);
      const newVal = before + indent + after;
      setDetailText(newVal);
      requestAnimationFrame(() => {
        const pos = start + indent.length;
        el.selectionStart = pos;
        el.selectionEnd = pos;
      });
    }
  };

  // modal cancel handled inline by closing modal

  return (
    <div className="uml-model-tree">
      <div className="uml-model-tree-root">
        <div className="uml-tree-item root">
          <span
            className="uml-tree-label"
            onClick={() => toggleOpen('root')}
            role="button"
            tabIndex={0}
          >
            <i
              className={`fa-regular ${openKeys['root'] ? 'fa-folder-open' : 'fa-folder-closed'} uml-tree-toggle`}
            />
            <span className="uml-tree-text">{modelName}</span>
          </span>
        </div>

        <div className={`uml-tree-children ${openKeys['root'] ? 'open' : 'collapsed'}`}>
          <TreeSection
            title="Classes"
            isOpen={!!openKeys['classes']}
            onToggle={() => toggleOpen('classes')}
            count={classes.length}
          >
            {classes.map((c) => (
              <TreeLeaf
                key={c.name}
                label={c.name}
                onClick={() => handleSelect(`class:${c.name}`, c)}
                indent={12}
              />
            ))}
          </TreeSection>

          <TreeSection
            title="Associations"
            isOpen={!!openKeys['assocs']}
            onToggle={() => toggleOpen('assocs')}
            count={associations.length}
          >
            {associations.map((a, i) => (
              <TreeLeaf
                key={a.name || i}
                label={a.name || `assoc${i}`}
                onClick={() => handleSelect(`assoc:${i}`, a)}
                indent={12}
              />
            ))}
          </TreeSection>

          <TreeSection
            title="Invariants"
            isOpen={!!openKeys['invariants']}
            onToggle={() => toggleOpen('invariants')}
            count={constraints.filter((c) => c.type === 'invariant').length}
            onAdd={() => {
              // prepare to add a new invariant with a helpful draft template
              setSelected({ key: 'inv:new', payload: null });
              setDetailText(
                `context ClassName inv InvariantName:\n    <OCL constraint expression>`
              );
              setAddMode({ type: 'inv', className: null });
              setModalOpen(true);
            }}
          >
            {invariantList.map((entry) => (
              <TreeLeaf
                key={`inv:${entry.idx}`}
                label={entry.c?.name || entry.c?.type || String(entry.idx)}
                onClick={() => handleSelect(`inv:${entry.idx}`, entry.c)}
                indent={12}
              />
            ))}
          </TreeSection>

          <TreeSection
            title="Pre/Post Conditions"
            isOpen={!!openKeys['prepost']}
            onToggle={() => toggleOpen('prepost')}
            count={prepostList.length}
            onAdd={() => {
              // pre/post conditions draft (defaults to a precondition template)
              setSelected({ key: 'cond:new', payload: null });
              setDetailText(
                `context ClassName pre PreconditionName:\n    <OCL constraint expression>`
              );
              setAddMode({ type: 'cond', className: null });
              setModalOpen(true);
            }}
          >
            {prepostList.map((entry) => (
              <TreeLeaf
                key={`cond:${entry.idx}`}
                label={entry.c?.name || entry.c?.id || 'condition'}
                onClick={() => handleSelect(`cond:${entry.idx}`, entry.c)}
                indent={12}
              />
            ))}
          </TreeSection>

          <TreeSection
            title="Operations"
            isOpen={!!openKeys['ops']}
            onToggle={() => toggleOpen('ops')}
            count={classes.flatMap((c) => c.operations || []).length}
            onAdd={() => {
              // start add operation flow - provide a simple operation draft
              setSelected({ key: 'op:add', payload: null });
              setDetailText(
                `class ClassName\n  operations\n    operationName(param1: Type): ReturnType\n    -- implementation or OCL expression\nend`
              );
              setAddMode({ type: 'op' });
              setModalOpen(true);
            }}
          >
            {classes
              .flatMap((c) => (c.operations || []).map((op, i) => ({ c: c.name, op, i })))
              .map((entry, idx) => (
                <TreeLeaf
                  key={`${entry.c}:${idx}`}
                  label={`${entry.c}.${typeof entry.op === 'string' ? entry.op : entry.op.name || 'op'}`}
                  onClick={() =>
                    handleSelect(`op:${entry.c}:${idx}`, { class: entry.c, op: entry.op })
                  }
                  indent={12}
                />
              ))}
          </TreeSection>

          <TreeSection
            title="Query Operations"
            isOpen={!!openKeys['qops']}
            onToggle={() => toggleOpen('qops')}
            count={classes.flatMap((c) => c.query_operations || []).length}
            onAdd={() => {
              // query operation draft
              setSelected({ key: 'qop:add', payload: null });
              setDetailText(
                `class ClassName\n  operations\n    operationName(param1: Type): ReturnType =\n      -- implementation or OCL expression\nend`
              );
              setAddMode({ type: 'qop' });
              setModalOpen(true);
            }}
          >
            {classes
              .flatMap((c) => (c.query_operations || []).map((op, i) => ({ c: c.name, op, i })))
              .map((entry, idx) => (
                <TreeLeaf
                  key={`qop:${entry.c}:${idx}`}
                  label={`${entry.c}.${entry.op?.name || entry.op || 'qop'}`}
                  onClick={() =>
                    handleSelect(`qop:${entry.c}:${idx}`, { class: entry.c, op: entry.op })
                  }
                  indent={12}
                />
              ))}
          </TreeSection>

          <TreeSection
            title="Enumerations"
            isOpen={!!openKeys['enums']}
            onToggle={() => toggleOpen('enums')}
            count={enumerations.length}
          >
            {enumerations.map((e) => (
              <TreeLeaf
                key={e.name}
                label={e.name}
                onClick={() => handleSelect(`enum:${e.name}`, e)}
                indent={12}
              />
            ))}
          </TreeSection>
        </div>
      </div>

      <div className="uml-model-tree-detail">
        {selected ? (
          <div>
            <div style={{ position: 'relative' }}>
              <pre className="uml-model-tree-detail-text" style={{ whiteSpace: 'pre-wrap' }}>
                {serializing || deserializing ? 'Loading...' : readOnlyText}
              </pre>
              <span
                className="uml-tree-edit-btn"
                style={{ position: 'absolute', top: 6, right: 6 }}
                aria-label="Edit"
                onClick={() => {
                  setDetailText(readOnlyText || '');
                  setModalOpen(true);
                  setAddMode(null);
                }}
              >
                <i
                  className="fa-solid fa-pen"
                  onClick={() => {
                    setDetailText(readOnlyText || '');
                    setModalOpen(true);
                    setAddMode(null);
                  }}
                />
              </span>
            </div>
          </div>
        ) : (
          <div className="uml-model-tree-empty">Select a node to view/edit details</div>
        )}

        <Modal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setAddMode(null);
          }}
          title={addMode ? 'Add' : 'Edit'}
        >
          {/* No class selector for add op/qop — backend deserializer detects the owner class */}
          <textarea
            ref={textareaRef}
            className="uml-model-tree-detail-text edit"
            rows={12}
            value={addMode ? detailText : detailText || readOnlyText}
            onChange={(e) => setDetailText(e.target.value)}
            onKeyDown={handleTabKey}
            style={{ width: '100%' }}
          />
          <div className="uml-model-tree-detail-actions">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                setModalOpen(false);
                setAddMode(null);
              }}
            >
              <i className="fa fa-times" />
              <span>Cancel</span>
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={async () => {
                // Do not inject class into the selected key; deserializer infers class
                await handleSave();
                setAddMode(null);
              }}
              disabled={deserializing}
            >
              <i className="fa fa-save" />
              <span>Save</span>
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
