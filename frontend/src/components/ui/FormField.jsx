import React from 'react';

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  readOnly = false,
  required = false,
  textarea = false,
  rows = 3,
  options = [],
  className = '',
}) {
  const id = name || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className="form-label">
          <span>{label}</span>
          {required && (
            <span
              aria-hidden="true"
              className="required-star"
              style={{ color: '#e53935', marginLeft: 6, fontWeight: 600 }}
            >
              *
            </span>
          )}
        </label>
      )}
      {textarea ? (
        <textarea
          id={id}
          name={name}
          rows={rows}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          required={required}
        />
      ) : options && options.length > 0 ? (
        <select
          id={id}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          disabled={readOnly}
          required={required}
        >
          {options.map((opt, idx) => (
            <option key={idx} value={typeof opt === 'string' ? opt : opt.value}>
              {typeof opt === 'string' ? opt : opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          required={required}
        />
      )}
    </div>
  );
}
