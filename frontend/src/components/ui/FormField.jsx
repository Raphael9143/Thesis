import React, { useEffect, useRef } from 'react';

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
  autoResize = false,
  options = [],
  className = '',
  inputRef = undefined,
  inputProps = {},
}) {
  const id = name || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className="form-label">
          <span>{label}</span>
          {required && (
            <span aria-hidden="true" className="required-star">
              *
            </span>
          )}
        </label>
      )}
      {textarea ? (
        <Textarea
          id={id}
          name={name}
          rows={rows}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          required={required}
          inputRef={inputRef}
          autoResize={autoResize}
          inputProps={inputProps}
        />
      ) : options && options.length > 0 ? (
        <select
          id={id}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          disabled={readOnly}
          required={required}
          ref={inputRef}
          {...inputProps}
        >
          {options.map((opt, idx) => (
            <option key={idx} value={typeof opt === 'string' ? opt : opt.value}>
              {typeof opt === 'string' ? opt : opt.label}
            </option>
          ))}
        </select>
      ) : (
        (() => {
          const common = {
            id,
            name,
            type,
            placeholder,
            readOnly,
            required,
            ref: inputRef,
            ...inputProps,
          };

          // file inputs must be uncontrolled (no value prop)
          if (type === 'file') {
            return <input {...common} onChange={onChange} />;
          }

          return <input {...common} value={value ?? ''} onChange={onChange} />;
        })()
      )}
    </div>
  );
}

function Textarea({
  id,
  name,
  rows,
  value,
  onChange,
  placeholder,
  readOnly,
  required,
  inputRef,
  autoResize,
  inputProps,
}) {
  const internalRef = useRef(null);
  const refToUse = inputRef || internalRef;

  useEffect(() => {
    if (autoResize && refToUse.current) {
      const el = refToUse.current;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 600) + 'px';
    }
  }, [value, autoResize, refToUse]);

  return (
    <textarea
      id={id}
      name={name}
      rows={rows}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      required={required}
      ref={refToUse}
      {...inputProps}
      className={`textarea-field ${inputProps?.className || ''}`.trim()}
    />
  );
}
