import React, { useState } from 'react';
import '../../../../assets/styles/components/ui/UMLEditor.css';
import TreeSection from './TreeSection';
import TreeLeaf from './TreeLeaf';

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

  const toggleOpen = (key) => setOpenKeys((o) => ({ ...o, [key]: !o[key] }));

  const handleSelect = (key, payload) => {
    setSelected({ key, payload });
    setDetailText(payload && payload._notes ? payload._notes : JSON.stringify(payload, null, 2));
    onSelect && onSelect({ key, payload });
  };

  const handleSave = () => {
    if (!selected) return;
    onUpdateNode && onUpdateNode(selected.key, detailText);
  };

  const handleCancel = () => {
    if (!selected) return;
    setDetailText(
      selected.payload && selected.payload._notes ? selected.payload._notes : JSON.stringify(selected.payload, null, 2)
    );
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
            count={constraints.length}
          >
            {constraints.map((c) => (
              <TreeLeaf
                key={c.id}
                label={c.name || c.type || c.id}
                onClick={() => handleSelect(`inv:${c.id}`, c)}
                indent={12}
              />
            ))}
          </TreeSection>

          <TreeSection
            title="Pre/Post Conditions"
            isOpen={!!openKeys['prepost']}
            onToggle={() => toggleOpen('prepost')}
          >
            <div className="uml-tree-item leaf">(addable)</div>
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
            <div className="uml-model-tree-detail-header">{selected.key}</div>
            <textarea
              className="uml-model-tree-detail-text"
              rows={10}
              value={detailText}
              onChange={(e) => setDetailText(e.target.value)}
            />
            <div className="uml-model-tree-detail-actions">
              <button onClick={handleCancel}>Cancel</button>
              <button onClick={handleSave}>Save</button>
            </div>
          </div>
        ) : (
          <div className="uml-model-tree-empty">Select a node to view/edit details</div>
        )}
      </div>
    </div>
  );
}
