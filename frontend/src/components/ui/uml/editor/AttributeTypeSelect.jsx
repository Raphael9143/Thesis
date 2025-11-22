import React, { useEffect } from 'react';

export default function AttributeTypeSelect({ value = '', onChange, classes = [], enums = [] }) {
  useEffect(() => {
    if ((value === '' || value == null) && typeof onChange === 'function') {
      onChange('String');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => onChange && onChange(e.target.value);

  return (
    <select className="uml-type-select" value={value || 'String'} onChange={handleChange}>
      <optgroup label="Primitives">
        <option value="String">String</option>
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
