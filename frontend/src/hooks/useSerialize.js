import { useState } from 'react';
import userAPI from '../../services/userAPI';

export default function useSerialize() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const serializeClass = async (data) => {
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

  const serializeConstraint = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await userAPI.serializeConstraint(data);
      return res;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const serializeEnum = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await userAPI.serializeEnum(data);
      return res;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    serializeClass,
    serializeAssociation,
    serializeOperation,
    serializeConstraint,
    serializeEnum,
    loading,
    error,
  };
}
