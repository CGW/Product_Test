import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setAuthToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('oracle_token');
    if (token) {
      setAuthToken(token);
      api.get('/auth/me')
        .then(data => setUser(data.user))
        .catch(() => {
          localStorage.removeItem('oracle_token');
          setAuthToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credential, tenantSlug) => {
    const data = await api.post('/auth/google', { credential, tenantSlug });
    localStorage.setItem('oracle_token', data.token);
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('oracle_token');
    setAuthToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const data = await api.patch('/auth/me', updates);
    setUser(data.user);
    return data.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
