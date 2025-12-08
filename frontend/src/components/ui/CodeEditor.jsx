import React, { useEffect, useState, useRef } from 'react';
import '../../assets/styles/pages/Submit.css';

export default function CodeEditor({
  value = '',
  onChange,
  placeholder = '// Enter code here\n',
  disabled = false,
  rows = 12,
  className = '',
  maxHeight = '640px',
}) {
  const [lineCount, setLineCount] = useState(1);
  const numbersRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const lines = (value || '').split('\n').length;
    setLineCount(lines);
  }, [value]);

  const syncScroll = (e) => {
    if (!numbersRef.current) return;
    numbersRef.current.scrollTop = e.target.scrollTop;
  };

  const handleTabKey = (e) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const el = textareaRef.current;
    if (!el) return;
    const indent = '  ';
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentValue = value || '';

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
        onChange?.({ target: { value: newVal } });
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
        onChange?.({ target: { value: newVal } });
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
      onChange?.({ target: { value: newVal } });
      requestAnimationFrame(() => {
        const pos = start + indent.length;
        el.selectionStart = pos;
        el.selectionEnd = pos;
      });
    }
  };

  return (
    <div className={`code-editor-wrapper ${className}`.trim()}>
      <div
        className={`code-editor-container${maxHeight ? ' limited-height' : ''}`}
        style={
          maxHeight
            ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }
            : {}
        }
      >
        <div className="line-numbers" ref={numbersRef} aria-hidden="true">
          {Array.from({ length: lineCount }).map((_, idx) => (
            <div key={idx} className="line-number">
              {idx + 1}
            </div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className="code-editor"
          value={value}
          onChange={onChange}
          onScroll={syncScroll}
          onKeyDown={handleTabKey}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
