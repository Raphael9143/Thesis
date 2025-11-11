import { useCallback, useEffect, useRef, useState } from 'react';
import userAPI from '../../services/userAPI';

/**
 * useAttempt
 * Fetch remaining attempts for an assignment or exam.
 *
 * @param {('assignment'|'exam')} type
 * @param {string|number} id
 * @param {{ enabled?: boolean }} options
 * @returns {{ attempts: any, loading: boolean, error: string, refetch: () => Promise<void> }}
 */
export default function useAttempt(type, id, options = {}) {
  const enabled = options.enabled ?? true;
  const [attempts, setAttempts] = useState(null);
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
      if (type === 'assignment') {
        res = await userAPI.getAssignmentRemainingAttempts(id);
      } else if (type === 'exam') {
        res = await userAPI.getExamRemainingAttempts(id);
      }
      if (!mountedRef.current) return;
      if (res?.success) {
        setAttempts(res.data);
      } else {
        setError(res?.message || 'Failed to fetch attempts');
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

  return { attempts, loading, error, refetch: fetcher };
}
