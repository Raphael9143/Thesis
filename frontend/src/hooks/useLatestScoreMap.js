import { useCallback, useEffect, useRef, useState } from 'react';
import userAPI from '../../services/userAPI';

/**
 * useLatestScoreMap
 * Batch fetch latest scores for a list of assignments or exams for the current student.
 *
 * @param {('assignment'|'exam')} type
 * @param {Array<string|number>} ids
 * @param {{ enabled?: boolean, skip?: boolean }} options
 * @returns {{
 *   scoresMap: Record<string|number, number>,
 *   loading: boolean,
 *   error: string,
 *   refetch: () => Promise<void>
 * }}
 */
export default function useLatestScoreMap(type, ids, options = {}) {
  const enabled = options.enabled ?? true;
  const skip = options.skip ?? false;
  const [scoresMap, setScoresMap] = useState({});
  const [infoMap, setInfoMap] = useState({});
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
              res = await userAPI.getAssignmentLatestScore(singleId);
            } else if (type === 'exam') {
              res = await userAPI.getExamLatestScore(singleId);
            }
            if (res?.success) {
              const d = res.data || {};
              const hasSubmission = !!d.has_submission;
              const score = typeof d.score === 'number' ? d.score : null;
              return { id: singleId, info: { hasSubmission, score } };
            }
            return { id: singleId, info: { hasSubmission: false, score: null } };
          } catch {
            return { id: singleId, info: { hasSubmission: false, score: null } };
          }
        })
      );
      if (!mountedRef.current) return;
      const sMap = {};
      const iMap = {};
      results.forEach((r) => {
        if (!r) return;
        iMap[r.id] = r.info;
        if (r.info && r.info.hasSubmission && typeof r.info.score === 'number') {
          sMap[r.id] = r.info.score;
        }
      });
      setInfoMap(iMap);
      setScoresMap(sMap);
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

  return { infoMap, scoresMap, loading, error, refetch: fetcher };
}
