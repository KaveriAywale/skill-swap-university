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
  const data = err?.response?.data;

  // A dev proxy, a static host or an SPA fallback can answer `/api/*` with HTML
  // or plain text instead of JSON. That is the classic "the backend isn't
  // running" situation — surface it clearly instead of a generic failure.
  if (typeof data === 'string') {
    if (/<!doctype html|<html[\s>]/i.test(data)) {
      return 'The API is not reachable here. Start the backend with "npm run dev" (from the project root) and try again.';
    }
    return 'Cannot reach the server. Is the backend running on port 5000?';
  }

  const details = data?.details;
  if (details?.length) {
    return details.map((d) => d.message).join('. ');
  }
  if (data?.message) return data.message;
  if (err?.message === 'Network Error') return 'Cannot reach the server. Is the backend running?';
  if (err?.code === 'ECONNABORTED') return 'The request timed out.';

  const status = err?.response?.status;
  if (status === 502 || status === 503 || status === 504) {
    return 'The server is starting up or unreachable. Please try again in a moment.';
  }
  if (status >= 500) return 'The server ran into a problem. Please try again in a moment.';

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