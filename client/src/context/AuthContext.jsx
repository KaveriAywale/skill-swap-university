import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import api, { getToken, setToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [backendOnline, setBackendOnline] = useState(true);

  const checkBackend = useCallback(async () => {
    try {
      const res = await api.get('/health');
      const ok = res?.data && typeof res.data === 'object' && res.data.success === true;
      setBackendOnline(ok);
      return ok;
    } catch {
      setBackendOnline(false);
      return false;
    }
  }, []);

  useEffect(() => {
    checkBackend();
  }, [checkBackend]);

  const fetchCatalog = useCallback(async () => {
    try {
      const [cats, skillsRes] = await Promise.all([
        api.get('/skills/categories'),
        api.get('/skills'),
      ]);
      setCategories(cats.data.data);
      setSkills(skillsRes.data.data);
    } catch {
      // Catalog is auxiliary; UI degrades gracefully if it fails.
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (email, password) => {
      const res = await api.post('/auth/login', { email, password });
      const data = res.data?.data;
      if (!data?.token || !data?.user) {
        setBackendOnline(false);
        throw new Error('The server did not respond as expected. Is the backend running on port 5000?');
      }
      setBackendOnline(true);
      setToken(data.token);
      setUser(data.user);
      await fetchCatalog();
      return data.user;
    },
    [fetchCatalog]
  );

  const register = useCallback(
    async (payload) => {
      const res = await api.post('/auth/register', payload);
      const data = res.data?.data;
      if (!data?.token || !data?.user) {
        setBackendOnline(false);
        throw new Error('The server did not respond as expected. Is the backend running on port 5000?');
      }
      setBackendOnline(true);
      setToken(data.token);
      setUser(data.user);
      await fetchCatalog();
      return data.user;
    },
    [fetchCatalog]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    window.location.assign('/');
  }, []);

  const refresh = useCallback(async () => {
    const res = await api.get('/auth/me');
    setUser(res.data.data);
    return res.data.data;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      skills,
      categories,
      isAuthenticated: Boolean(user),
      backendOnline,
      checkBackend,
      login,
      register,
      logout,
      refresh,
      setUser,
    }),
    [user, loading, skills, categories, backendOnline, checkBackend, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}