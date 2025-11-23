import { useState } from 'react';
import userAPI from '../../services/userAPI';

export default function useSerialize() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const serializeClass = async (data) => {
    console.log(JSON.stringify(data));

    setLoading(true);
    setError(null);
    try {
      const res = await userAPI.serializeClass(data);
      return res;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const serializeAssociation = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await userAPI.serializeAssociation(data);
      return res;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const serializeOperation = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await userAPI.serializeOperation(data);
      return res;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { serializeClass, serializeAssociation, serializeOperation, loading, error };
}
