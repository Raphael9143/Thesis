import React, { useEffect, useState } from 'react';
// open preview in new tab; no navigate needed
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import FilePreview from '../../components/ui/FilePreview';
import userAPI from '../../../services/userAPI';
import toFullUrl from '../../utils/FullURLFile';
import { useNotifications } from '../../contexts/NotificationContext';
import useTitle from '../../hooks/useTitle';
import '../../assets/styles/ui.css';

export default function ResearcherResources() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // open preview in new tab, no need for navigate
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
                          const fp = encodeURIComponent(m.file_path);
                          window.open(`/file/preview?file=${fp}`, '_blank');
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
        {/* Preview now opens in a dedicated page /file/preview */}
      </Card>
    </Section>
  );
}
