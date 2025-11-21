import React from 'react';

export default function AttributeTypeSelect({ value = '', onChange, classes = [], enums = [] }) {
  const handleChange = (e) => onChange && onChange(e.target.value);

  return (
    <select className="uml-type-select" value={value} onChange={handleChange}>
      <optgroup label="Primitives">
        <option value="">String</option>
        <option value="Integer">Integer</option>
        <option value="Real">Real</option>
        <option value="Boolean">Boolean</option>
      </optgroup>
      {Array.isArray(classes) && classes.length > 0 && (
        <optgroup label="Classes">
          {classes.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </optgroup>
      )}
      {Array.isArray(enums) && enums.length > 0 && (
        <optgroup label="Enums">
          {enums.map((en) => (
            <option key={`enum:${en.name}`} value={`enum:${en.name}`}>
              {en.name}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}
