import React, { useState } from 'react';
import '../../../../assets/styles/components/ui/UMLEditor.css';
import TreeSection from './TreeSection';
import TreeLeaf from './TreeLeaf';
import useSerialize from '../../../../hooks/useSerialize';
import useDeserialize from '../../../../hooks/useDeserialize';

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
  const [editing, setEditing] = useState(false);
  const {
    serializeClass,
    serializeAssociation,
    serializeOperation,
    serializeConstraint,
    serializeEnum,
    loading: serializing,
  } = useSerialize();
  const {
    deserializeClass,
    deserializeAssociation,
    deserializeOperation,
    deserializeConstraint,
    deserializeEnum,
    loading: deserializing,
  } = useDeserialize();

  const toggleOpen = (key) => setOpenKeys((o) => ({ ...o, [key]: !o[key] }));

  // Build lists preserving original indices so updates can target the correct entry
  const invariantList = constraints.map((c, i) => ({ c, idx: i })).filter((x) => x.c && x.c.type === 'invariant');
  const prepostList = constraints
    .map((c, i) => ({ c, idx: i }))
    .filter((x) => x.c && (x.c.type === 'precondition' || x.c.type === 'postcondition'));

  const handleSelect = (key, payload) => {
    setSelected({ key, payload });
    setEditing(false);
    setDetailText('');
    setReadOnlyText('');
    // Show human-friendly USE text when possible (serialize JSON -> USE)
    const trySerialize = async () => {
      if (!payload) return;
      try {
        if (key.startsWith('class:')) {
          const res = await serializeClass(payload);
          const text = res?.data?.data || res?.data || res;
          setReadOnlyText(typeof text === 'string' ? text : text.useText || JSON.stringify(text, null, 2));
        } else if (key.startsWith('assoc:')) {
          const res = await serializeAssociation(payload);
          const text = res?.data?.data || res?.data || res;
          setReadOnlyText(typeof text === 'string' ? text : text.useText || JSON.stringify(text, null, 2));
        } else if (key.startsWith('inv:') || key.startsWith('cond:')) {
          // constraint -> USE
          const res = await serializeConstraint(payload);
          const text = res?.data?.data || res?.data || res;
          setReadOnlyText(typeof text === 'string' ? text : text.useText || JSON.stringify(text, null, 2));
        } else if (key.startsWith('enum:')) {
          // enum -> USE
          const res = await serializeEnum(payload);
          const text = res?.data?.data || res?.data || res;
          setReadOnlyText(typeof text === 'string' ? text : text.useText || JSON.stringify(text, null, 2));
        } else if (key.startsWith('op:') || key.startsWith('qop:')) {
          const res = await serializeOperation(payload);
          const text = res?.data?.data || res?.data || res;
          setReadOnlyText(typeof text === 'string' ? text : text.useText || JSON.stringify(text, null, 2));
        } else {
          // default to showing notes or JSON
          setReadOnlyText(payload && payload._notes ? payload._notes : JSON.stringify(payload, null, 2));
        }
      } catch {
        setReadOnlyText(payload && payload._notes ? payload._notes : JSON.stringify(payload, null, 2));
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
        if (payload) onUpdateNode && onUpdateNode(selected.key, payload);
      } else if (selected.key.startsWith('enum:')) {
        const res = await deserializeEnum({ text: detailText });
        const payload = res?.data?.data || res?.data || res;
        if (payload) onUpdateNode && onUpdateNode(selected.key, payload);
      } else if (selected.key.startsWith('op:') || selected.key.startsWith('qop:')) {
        // pass class context as available in payload when deserializing operation
        const cls = selected.payload && selected.payload.class;
        const body = { text: detailText, class: cls };
        const res = await deserializeOperation(body);
        const payload = res?.data?.data || res?.data || res;
        if (payload) onUpdateNode && onUpdateNode(selected.key, payload);
      } else {
        // fallback: save text as notes
        onUpdateNode && onUpdateNode(selected.key, detailText);
      }
      setEditing(false);
    } catch (e) {
      // show raw text in detailText if deserialize failed
      console.error('Deserialize failed', e);
      // still call onUpdateNode with raw text to preserve behavior
      onUpdateNode && onUpdateNode(selected.key, detailText);
      setEditing(false);
    }
  };

  const handleCancel = () => {
    if (!selected) return;
    // exit edit mode and restore read-only text
    setEditing(false);
    setDetailText('');
  };

  return (
    <div className="uml-model-tree">
      <div className="uml-model-tree-root">
        <div className="uml-tree-item root">
          <span className="uml-tree-label" onClick={() => toggleOpen('root')} role="button" tabIndex={0}>
            <i className={`fa-regular ${openKeys['root'] ? 'fa-folder-open' : 'fa-folder-closed'} uml-tree-toggle`} />
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
              <TreeLeaf key={c.name} label={c.name} onClick={() => handleSelect(`class:${c.name}`, c)} indent={12} />
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
          >
            {classes
              .flatMap((c) => (c.operations || []).map((op, i) => ({ c: c.name, op, i })))
              .map((entry, idx) => (
                <TreeLeaf
                  key={`${entry.c}:${idx}`}
                  label={`${entry.c}.${typeof entry.op === 'string' ? entry.op : entry.op.name || 'op'}`}
                  onClick={() => handleSelect(`op:${entry.c}:${idx}`, { class: entry.c, op: entry.op })}
                  indent={12}
                />
              ))}
          </TreeSection>

          <TreeSection
            title="Query Operations"
            isOpen={!!openKeys['qops']}
            onToggle={() => toggleOpen('qops')}
            count={classes.flatMap((c) => c.query_operations || []).length}
          >
            {classes
              .flatMap((c) => (c.query_operations || []).map((op, i) => ({ c: c.name, op, i })))
              .map((entry, idx) => (
                <TreeLeaf
                  key={`qop:${entry.c}:${idx}`}
                  label={`${entry.c}.${entry.op?.name || entry.op || 'qop'}`}
                  onClick={() => handleSelect(`qop:${entry.c}:${idx}`, { class: entry.c, op: entry.op })}
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
              <TreeLeaf key={e.name} label={e.name} onClick={() => handleSelect(`enum:${e.name}`, e)} indent={12} />
            ))}
          </TreeSection>
        </div>
      </div>

      <div className="uml-model-tree-detail">
        {selected ? (
          <div>
            {!editing ? (
              <div>
                <pre className="uml-model-tree-detail-text" style={{ whiteSpace: 'pre-wrap' }}>
                  {serializing || deserializing ? 'Loading...' : readOnlyText}
                </pre>
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => setEditing(true)}>Edit</button>
                </div>
              </div>
            ) : (
              <div>
                <textarea
                  className="uml-model-tree-detail-text"
                  rows={10}
                  value={detailText || readOnlyText}
                  onChange={(e) => setDetailText(e.target.value)}
                />
                <div className="uml-model-tree-detail-actions">
                  <button onClick={handleCancel}>Cancel</button>
                  <button onClick={handleSave} disabled={deserializing}>
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="uml-model-tree-empty">Select a node to view/edit details</div>
        )}
      </div>
    </div>
  );
}
