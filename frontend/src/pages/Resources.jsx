import React, { useEffect, useState } from 'react';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import '../assets/styles/ui.css';
import userAPI from '../../services/userAPI';
import toFullUrl from '../utils/FullURLFile';
import Modal from '../components/ui/Modal';
import FilePreview from '../components/ui/FilePreview';
import { useNotifications } from '../contexts/NotificationContext';

export default function ResourcesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPath, setPreviewPath] = useState('');
  const { push } = useNotifications();

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
        <h4 style={{ marginTop: 0 }}>Resources</h4>
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
                  <td>{m.createdAt ? new Date(m.createdAt).toLocaleString() : '-'}</td>
                  <td>
                    {m.filePath ? (
                      <a
                        onClick={() => {
                          setPreviewPath(String(m.filePath));
                          setPreviewOpen(true);
                        }}
                      >
                        Preview
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {m.filePath ? (
                      <a href={toFullUrl(m.filePath)} target="_blank" rel="noreferrer">
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
        <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Model Preview">
          {previewPath ? (
            <FilePreview url={toFullUrl(previewPath)} filename={previewPath} filePath={previewPath} />
          ) : (
            <div>No file</div>
          )}
        </Modal>
      </Card>
    </Section>
  );
}
