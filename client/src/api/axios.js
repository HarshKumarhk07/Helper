import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const ACCESS_KEY = 'velora_access_token';
const REFRESH_KEY = 'velora_refresh_token';

export const api = axios.create({
  baseURL,
  withCredentials: false,
});

// A bare axios instance for the refresh call so it bypasses our interceptors
// and can't recursively trigger another refresh.
const refreshClient = axios.create({ baseURL });

// Centralized auth-event broadcaster so AuthContext can react.
const authListeners = new Set();
export const onAuthEvent = (fn) => {
  authListeners.add(fn);
  return () => authListeners.delete(fn);
};
const emitAuthEvent = (type, payload) => {
  authListeners.forEach((fn) => {
    try {
      fn({ type, payload });
    } catch {
      /* ignore listener errors */
    }
  });
};

const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

const setAccessToken = (token) => {
  if (token) localStorage.setItem(ACCESS_KEY, token);
};

const setRefreshToken = (token) => {
  if (token) localStorage.setItem(REFRESH_KEY, token);
};

let refreshInFlight = null;
let queue = [];

const flushQueue = (error, token) => {
  queue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  queue = [];
};

const performRefresh = async () => {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) {
    throw new Error('no_refresh_token');
  }
  const { data } = await refreshClient.post('/auth/refresh', { refreshToken });
  if (!data?.accessToken) throw new Error('refresh_failed');
  setAccessToken(data.accessToken);
  if (data.refreshToken) setRefreshToken(data.refreshToken);
  emitAuthEvent('refreshed', { accessToken: data.accessToken, user: data.user });
  return data.accessToken;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err?.config;
    const status = err?.response?.status;
    const url = original?.url || '';
    const isAuthCall =
      url.includes('/auth/login') ||
      url.includes('/auth/signup') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password');

    if (status !== 401 || !original || original._retry || isAuthCall) {
      if (status === 401 && !isAuthCall) {
        // Final fallback: if a 401 arrived from a non-auth route and we couldn't
        // (or already did) refresh, clear tokens.
        if (!localStorage.getItem(REFRESH_KEY)) {
          clearTokens();
          emitAuthEvent('logout', { reason: '401' });
        }
      }
      return Promise.reject(err);
    }

    original._retry = true;

    if (!refreshInFlight) {
      refreshInFlight = performRefresh()
        .then((token) => {
          flushQueue(null, token);
          return token;
        })
        .catch((e) => {
          flushQueue(e, null);
          clearTokens();
          emitAuthEvent('logout', { reason: 'refresh_failed' });
          throw e;
        })
        .finally(() => {
          refreshInFlight = null;
        });
    }

    try {
      const token = await new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
        // Trigger refresh chain
        refreshInFlight.catch(() => {});
      });
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (refreshErr) {
      return Promise.reject(refreshErr);
    }
  }
);

export default api;
