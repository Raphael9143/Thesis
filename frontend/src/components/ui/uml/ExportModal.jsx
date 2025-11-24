import React, { useState } from 'react';
import '../../../assets/styles/components/ui/ExportModal.css';

// Minimal export modal: only text + icon buttons (copy, close)
// Parent controls rendering (no internal open prop)
export default function ExportModal({ fileContent, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fileContent || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      console.error('Clipboard copy failed', e);
    }
  };

  return (
    <div className="use-export-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="use-export-container" onClick={(e) => e.stopPropagation()}>
        <div className="use-export-actions">
          <span
            className={`icon-btn ${copied ? 'active' : ''}`}
            title="Copy to clipboard"
            onClick={handleCopy}
          >
            <i className="fa fa-copy" />
          </span>
          <span className="icon-btn" title="Close" onClick={onClose}>
            <i className="fa fa-times" />
          </span>
        </div>
        <pre className="use-export-content" aria-label="USE model output">
          {fileContent}
        </pre>
      </div>
    </div>
  );
}
