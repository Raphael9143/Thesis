import React from 'react';

export default function AttributeTypeSelect({ value, onChange, classes = [], enums = [], className = 'uml-attr-type' }) {
  const primitiveTypes = ['String', 'Integer', 'Real', 'Boolean'];

  return (
    <select className={className} value={value || 'String'} onChange={(e) => onChange(e.target.value)} style={{ maxWidth: '100%' }}>
      {primitiveTypes.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
      {classes.map((cl) => (
        <option key={cl.name} value={cl.name}>
          {cl.name}
        </option>
      ))}
      {enums.map((en) => (
        <option key={en.name} value={en.name}>
          {en.name}
        </option>
      ))}
    </select>
  );
}
