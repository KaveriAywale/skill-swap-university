import axios from 'axios';

export const TOKEN_KEY = 'ssu_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Normalise backend error payloads and network errors into a readable message. */
export function extractError(err, fallback = 'Something went wrong') {
  const details = err?.response?.data?.details;
  if (details?.length) {
    return details.map((d) => d.message).join('. ');
  }
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.message === 'Network Error') return 'Cannot reach the server. Is the backend running?';
  if (err?.code === 'ECONNABORTED') return 'The request timed out.';
  return fallback;
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && !err.config?.url?.includes('/login')) {
      // Token expired/invalid -> bounce to login.
      const hadToken = Boolean(getToken());
      setToken(null);
      if (hadToken && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(err);
  }
);

export default api;