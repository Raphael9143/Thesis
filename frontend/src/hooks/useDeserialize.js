import { useState } from 'react';
import userAPI from '../../services/userAPI';

export default function useDeserialize() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deserializeClass = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await userAPI.deserializeClass(data);
      return res;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const deserializeAssociation = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await userAPI.deserializeAssociation(data);
      return res;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const deserializeOperation = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await userAPI.deserializeOperation(data);
      return res;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const deserializeConstraint = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await userAPI.deserializeConstraint(data);
      return res;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { deserializeClass, deserializeAssociation, deserializeOperation, deserializeConstraint, loading, error };
}
