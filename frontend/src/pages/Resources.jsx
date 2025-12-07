import React, { useEffect, useState } from 'react';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import '../assets/styles/ui.css';
import userAPI from '../../services/userAPI';
import toFullUrl from '../utils/FullURLFile';
import FilePreview from '../components/ui/FilePreview';
import Modal from '../components/ui/Modal';
import { useNotifications } from '../contexts/NotificationContext';
import useTitle from '../hooks/useTitle';

export default function ResourcesPage() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewFilename, setPreviewFilename] = useState(null);
  const [previewFilePath, setPreviewFilePath] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { push } = useNotifications();
  useTitle('Resources');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await userAPI.getUseModels();
        if (!mounted) return;
        if (res?.success && Array.isArray(res.data)) setItems(res.data);
        else setItems([]);
      } catch (err) {
        if (!mounted) return;
        const msg = err?.response?.data?.message || err.message || 'Failed to load resources';
        setError(msg);
        try {
          push({ title: 'Error', body: msg });
        } catch {
          // ignore notification errors
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [push]);

  return (
    <Section>
      <Card>
        {loading && <div>Loading models...</div>}
        {error && <div className="text-error">{error}</div>}
        {!loading && !error && items.length === 0 && <div>No stored models.</div>}
        {!loading && !error && items.length > 0 && (
          <table className="table students-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Model</th>
                <th>Storage at</th>
                <th>Preview</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m, idx) => (
                <tr key={m.id}>
                  <td style={{ width: 48 }}>{idx + 1}</td>
                  <td>{m.name || '-'}</td>
                  <td>{m.created_at ? new Date(m.created_at).toLocaleString() : '-'}</td>
                  <td>
                    {m.file_path ? (
                      <a
                        onClick={() => {
                          setPreviewUrl(toFullUrl(m.file_path));
                          setPreviewFilename(m.file_path);
                          setPreviewFilePath(m.file_path);
                          setPreviewOpen(true);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        Preview
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {m.file_path ? (
                      <a href={toFullUrl(m.file_path)} target="_blank" rel="noreferrer">
                        Download
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {/* Preview now opens in dedicated page /file/preview */}
      </Card>
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="File preview">
        <FilePreview url={previewUrl} filename={previewFilename} filePath={previewFilePath} />
      </Modal>
    </Section>
  );
}
