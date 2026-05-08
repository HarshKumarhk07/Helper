import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { onAuthEvent } from '../api/axios.js';

const AuthContext = createContext(null);

const ACCESS_KEY = 'velora_access_token';
const REFRESH_KEY = 'velora_refresh_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const persistTokens = (accessToken, refreshToken) => {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  };

  const clearTokens = () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  };

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persistTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (payload) => {
    const { data } = await api.post('/auth/signup', payload);
    persistTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  // Apply a server-provided session payload (e.g., after OTP verify).
  // Persists tokens, sets the user, and returns the user.
  const applySession = useCallback((data) => {
    if (!data?.accessToken || !data?.user) return null;
    persistTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    clearTokens();
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_KEY);
    if (!token) {
      setBootstrapping(false);
      return;
    }
    api
      .get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => clearTokens())
      .finally(() => setBootstrapping(false));
  }, []);

  // React to auth events emitted by the axios interceptor (refresh / forced logout)
  useEffect(() => {
    const off = onAuthEvent(({ type, payload }) => {
      if (type === 'logout') {
        setUser(null);
      } else if (type === 'refreshed' && payload?.user) {
        setUser(payload.user);
      }
    });
    return off;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, bootstrapping, login, signup, logout, applySession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
