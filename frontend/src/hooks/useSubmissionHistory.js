import { useCallback, useEffect, useRef, useState } from 'react';
import userAPI from '../../services/userAPI';

/**
 * useSubmissionHistory
 * Fetch submissions history for an assignment or exam for current user context.
 * @param {('assignment'|'exam')} type
 * @param {string|number} id
 * @param {{ enabled?: boolean }} options
 * @returns {{ history: any[], loading: boolean, error: string, refetch: () => Promise<void> }}
 */
export default function useSubmissionHistory(type, id, options = {}) {
  const enabled = options.enabled ?? true;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetcher = useCallback(async () => {
    if (!enabled || !type || !id) return;
    setLoading(true);
    setError('');
    try {
      let res;
      // Prefer explicit history endpoints first
      if (type === 'assignment') {
        res = await userAPI.getAssignmentSubmissionHistory(id);
        if (!res?.success) {
          // fallback to generic list endpoints
          res = await userAPI.getSubmissionsByAssignmentId(id);
          if (!res?.success) {
            res = await userAPI.getSubmissionsByAssignment(id);
          }
        }
      } else if (type === 'exam') {
        res = await userAPI.getExamSubmissionHistory(id);
        if (!res?.success) {
          res = await userAPI.getSubmissionsByExamId(id);
          if (!res?.success) {
            res = await userAPI.getSubmissionsByExam(id);
          }
        }
      }
      if (!mountedRef.current) return;
      if (res?.success && Array.isArray(res.data)) {
        // sort by submission_time or created_at desc if present
        const list = [...res.data].sort((a, b) => {
          const ta = new Date(a.submission_time || a.created_at || 0).getTime();
          const tb = new Date(b.submission_time || b.created_at || 0).getTime();
          return tb - ta;
        });
        setHistory(list);
      } else if (res?.success && res.data && Array.isArray(res.data.results)) {
        setHistory(res.data.results);
      } else {
        setHistory([]);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err?.response?.data?.message || err.message || 'Server error');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [enabled, type, id]);

  useEffect(() => {
    fetcher();
  }, [fetcher]);

  return { history, loading, error, refetch: fetcher };
}
