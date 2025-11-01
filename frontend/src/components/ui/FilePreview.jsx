import React, { useEffect, useState } from 'react';
import mammoth from 'mammoth';
import '../../assets/styles/ui.css';

// url: absolute URL to the file
// filename: optional filename to derive extension when mimetype is missing
export default function FilePreview({ url, filename, mimetype }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [html, setHtml] = useState(null);
  const [text, setText] = useState(null);

  function extFromName(name) {
    if (!name) return '';
    const m = name.split('.');
    return m.length > 1 ? m[m.length - 1].toLowerCase() : '';
  }

  useEffect(() => {
    let mounted = true;
    setError(null);
    setHtml(null);
    setText(null);

    const ext = extFromName(filename || url);
    const mime = (mimetype || '').toLowerCase();

    // Preview strategies:
    // - images: <img>
    // - pdf: <iframe src>
    // - docx: fetch arrayBuffer -> mammoth -> render HTML
    // - doc (binary): fallback to Google viewer iframe
    // - .use or unknown text: fetch text and show in <pre>

    async function doPreview() {
      if (!url) return;
      try {
        setLoading(true);
        // docx
        if (ext === 'docx' || mime.includes('wordprocessingml')) {
          const res = await fetch(url);
          if (!mounted) return;
          if (!res.ok) throw new Error(`Failed to fetch ${res.status}`);
          const ab = await res.arrayBuffer();
          const r = await mammoth.convertToHtml({ arrayBuffer: ab });
          if (!mounted) return;
          setHtml(r.value || '<div>Empty document</div>');
          return;
        }

        // text-like .use
        if (ext === 'use' || mime.startsWith('text/')) {
          const res = await fetch(url);
          if (!mounted) return;
          if (!res.ok) throw new Error(`Failed to fetch ${res.status}`);
          const t = await res.text();
          if (!mounted) return;
          setText(t);
          return;
        }

        // for other cases we don't need to prefetch (images, pdf, doc fallback)
      } catch (err) {
        if (!mounted) return;
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    doPreview();
    return () => { mounted = false; };
  }, [url, filename, mimetype]);

  if (!url) return <div>No file URL</div>;
  const ext = extFromName(filename || url);
  const mime = (mimetype || '').toLowerCase();

  // Images
  if (mime.startsWith('image/') || ext.match(/^(png|jpe?g|gif|bmp|webp)$/i)) {
    return <img src={url} alt={filename || 'image'} style={{ maxWidth: '100%' }} />;
  }

  // PDF
  if (mime === 'application/pdf' || ext === 'pdf') {
    return (
      <div style={{ height: 700 }}>
        <iframe src={url} title={filename || 'pdf'} style={{ width: '100%', height: '100%', border: 0 }} />
      </div>
    );
  }

  // docx rendered HTML
  if (html !== null) {
    return <div className="docx-preview" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  // doc (binary) fallback -> Google viewer
  if (ext === 'doc' || mime.includes('msword')) {
    try {
      const enc = encodeURIComponent(url);
      const g = `https://docs.google.com/gview?url=${enc}&embedded=true`;
      return (
        <div style={{ height: 700 }}>
          <iframe src={g} title={filename || 'doc'} style={{ width: '100%', height: '100%', border: 0 }} />
        </div>
      );
    } catch (err) {
      return <a href={url} target="_blank" rel="noreferrer" className="btn btn-primary">Open file</a>;
    }
  }

  // Text / .use
  if (text !== null) {
    return (
      <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 600, overflow: 'auto', background: '#f7f7f7', padding: 12 }}>{text}</pre>
    );
  }

  // fallback: download link + attempt inline via iframe for other mimetypes
  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <a href={url} target="_blank" rel="noreferrer" className="btn btn-primary">Open / Download</a>
      </div>
      {/* try iframe for files the browser may render */}
      <div style={{ height: 500 }}>
        <iframe src={url} title={filename || 'file'} style={{ width: '100%', height: '100%', border: 0 }} />
      </div>
    </div>
  );
}
