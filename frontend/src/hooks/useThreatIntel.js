import { useState, useCallback } from 'react';
import api from '../api/axios';

export const useThreatIntel = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lookupIP = useCallback(async (ip) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/threat-intel/lookup/${ip}`);
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to lookup IP');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkBlockStatus = useCallback(async (ip) => {
    try {
      const { data } = await api.get(`/threat-intel/lookup/${ip}`);
      return data.data;
    } catch {
      return null;
    }
  }, []);

  const addToBlocklist = useCallback(async (ip, reason) => {
    setLoading(true);
    try {
      await api.post('/threat-intel/blocklist', { ip, reason });
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add to blocklist');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFromBlocklist = useCallback(async (ip) => {
    setLoading(true);
    try {
      await api.delete(`/threat-intel/blocklist/${ip}`);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove from blocklist');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBlocklist = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/threat-intel/blocklist');
      return data.data;
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    lookupIP,
    checkBlockStatus,
    addToBlocklist,
    removeFromBlocklist,
    getBlocklist,
  };
};