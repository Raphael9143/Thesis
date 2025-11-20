import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FilePreview from '../../components/ui/FilePreview';
import toFullUrl from '../../utils/FullURLFile';

export default function FilePreviewPage() {
  const { state, search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const qfile = params.get('file');

  let url = state?.url;
  let filename = state?.filename;
  let filePath = state?.filePath;

  if (!url && !filename && !filePath && qfile) {
    filePath = decodeURIComponent(qfile);
    url = toFullUrl(filePath);
    filename = filePath;
  }

  if (!url && !filename && !filePath) {
    return (
      <div style={{ padding: 24 }}>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          Back
        </button>
        <div style={{ marginTop: 12 }}>No file specified for preview.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>File Preview</h3>
        <div>
          <button className="btn" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <FilePreview url={url} filename={filename} filePath={filePath} />
      </div>
    </div>
  );
}
