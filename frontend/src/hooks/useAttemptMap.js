import { useCallback, useEffect, useRef, useState } from 'react';
import userAPI from '../../services/userAPI';

/**
 * useAttemptMap
 * Batch fetch remaining attempts for a list of assignments or exams.
 *
 * @param {('assignment'|'exam')} type
 * @param {Array<string|number>} ids
 * @param {{ enabled?: boolean, skip?: boolean }} options
 * @returns {{
 *   attemptsMap: Record<string|number, number>,
 *   loading: boolean,
 *   error: string,
 *   refetch: () => Promise<void>
 * }}
 */
export default function useAttemptMap(type, ids, options = {}) {
  const enabled = options.enabled ?? true;
  const skip = options.skip ?? false;
  const [attemptsMap, setAttemptsMap] = useState({});
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
    if (!enabled || skip || !type || !Array.isArray(ids) || ids.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const results = await Promise.all(
        ids.map(async (singleId) => {
          try {
            let res;
            if (type === 'assignment') {
              res = await userAPI.getAssignmentRemainingAttempts(singleId);
            } else if (type === 'exam') {
              res = await userAPI.getExamRemainingAttempts(singleId);
            }
            return { id: singleId, rem: res?.success ? res.data?.remaining_attempts : undefined };
          } catch {
            return { id: singleId, rem: undefined };
          }
        })
      );
      if (!mountedRef.current) return;
      const map = {};
      results.forEach((r) => {
        if (r && typeof r.rem !== 'undefined') map[r.id] = r.rem;
      });
      setAttemptsMap(map);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err?.response?.data?.message || err.message || 'Server error');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [enabled, skip, type, ids]);

  useEffect(() => {
    fetcher();
  }, [fetcher]);

  return { attemptsMap, loading, error, refetch: fetcher };
}
