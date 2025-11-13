import { useEffect, useState } from 'react';
import mammoth from 'mammoth';
import '../../assets/styles/ui.css';
import { useNotifications } from '../../contexts/NotificationContext';
import axiosClient from '../../../services/axiosClient';
import UMLPreview from './UMLPreview';
import '../../assets/styles/components/ui/FilePreview.css';

// url: absolute URL to the file
// filename: optional filename to derive extension when mimetype is missing
// filePath: optional backend-relative path used by the parse API (e.g. 'uploads/...')
export default function FilePreview({ url, filename, mimetype, filePath }) {
  const { push } = useNotifications();

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

    async function doPreview() {
      if (!url) return;
      try {
        setLoading(true);
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

        if (ext === 'use' || mime.startsWith('text/')) {
          const res = await fetch(url);
          if (!mounted) return;
          if (!res.ok) throw new Error(`Failed to fetch ${res.status}`);
          const t = await res.text();
          if (!mounted) return;
          setText(t);
          return;
        }
      } catch (err) {
        if (!mounted) return;
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    doPreview();
    return () => {
      mounted = false;
    };
  }, [url, filename, mimetype, filePath]);

  // UML preview state
  const [showUml, setShowUml] = useState(false);
  const [umlModel, setUmlModel] = useState(null);
  const [umlCli, setUmlCli] = useState(null);
  const [umlLoading, setUmlLoading] = useState(false);

  if (!url) return <div>No file URL</div>;
  const ext = extFromName(filename || url);
  const mime = (mimetype || '').toLowerCase();

  const showPreviewButton = ext === 'use' || (filename || '').toLowerCase().endsWith('.use');

  const handlePreview = async () => {
    if (!showPreviewButton) return;
    try {
      setUmlLoading(true);
      const path = filePath || filename || url;
      const res = await axiosClient.post('/use/parse', { path });
      if (!res || res.success === false) {
        const msg =
          res?.message ||
          (Array.isArray(res?.details) && res.details.join('\n')) ||
          res?.cli?.stdout ||
          'Invalid .use file. Please fix syntax or model errors.';
        push({ title: 'USE parse', body: msg });
        setUmlLoading(false);
        return;
      }
      if (!res.model) {
        const msg =
          res?.message ||
          (Array.isArray(res?.details) && res.details.join('\n')) ||
          'Parse succeeded but no model returned.';
        push({ title: 'USE parse', body: msg });
        setUmlLoading(false);
        return;
      }
      setUmlModel(res.model);
      setUmlCli(res.cli?.stdout || res.cli?.stderr || null);
      setShowUml(true);
    } catch (err) {
      console.log(err);
      push({ title: 'Error', body: `Failed to parse model: ${err?.response?.data?.message || String(err)}` });
    } finally {
      setUmlLoading(false);
    }
  };

  let previewContent = null;
  if (mime.startsWith('image/') || ext.match(/^(png|jpe?g|gif|bmp|webp)$/i)) {
    previewContent = <img src={url} alt={filename || 'image'} style={{ maxWidth: '100%' }} />;
  }

  if (mime === 'application/pdf' || ext === 'pdf') {
    previewContent = (
      <div style={{ height: 700 }}>
        <iframe src={url} title={filename || 'pdf'} style={{ width: '100%', height: '100%', border: 0 }} />
      </div>
    );
  }

  if (html !== null) {
    previewContent = <div className="docx-preview" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  if (ext === 'doc' || mime.includes('msword')) {
    try {
      const enc = encodeURIComponent(url);
      const g = `https://docs.google.com/gview?url=${enc}&embedded=true`;
      previewContent = (
        <div style={{ height: 700 }}>
          <iframe src={g} title={filename || 'doc'} style={{ width: '100%', height: '100%', border: 0 }} />
        </div>
      );
    } catch (err) {
      console.warn('Failed to create Google Docs viewer URL', err);
      previewContent = (
        <a href={url} target="_blank" rel="noreferrer" className="btn btn-primary">
          Open file
        </a>
      );
    }
  }

  if (text !== null) {
    previewContent = (
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          maxHeight: 600,
          overflow: 'auto',
          background: '#f7f7f7',
          padding: 12,
        }}
      >
        {text}
      </pre>
    );
  }

  if (loading) {
    previewContent = <div>Loading preview...</div>;
  }

  if (error) {
    push({ title: 'Error', body: `Failed to load file preview: ${error}` });
  }

  if (!previewContent) {
    previewContent = (
      <div style={{ height: 500 }}>
        <iframe src={url} title={filename || 'file'} style={{ width: '100%', height: '100%', border: 0 }} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        {showPreviewButton && (
          <button
            className="btn btn-outline btn-sm"
            onClick={handlePreview}
            disabled={umlLoading}
            title="Preview UML model"
          >
            {umlLoading ? 'Parsing...' : 'UML Preview'}
          </button>
        )}
      </div>
      {previewContent}
      {showUml && umlModel && <UMLPreview model={umlModel} cli={umlCli} onClose={() => setShowUml(false)} />}
    </div>
  );
}
