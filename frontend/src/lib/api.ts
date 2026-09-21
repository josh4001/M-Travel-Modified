import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1',
  timeout: 3000,
});

// Attach the access token (if present) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mt_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On a 401, try refreshing once before giving up and forcing a re-login.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('mt_refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
          localStorage.setItem('mt_access_token', data.accessToken);
          localStorage.setItem('mt_refresh_token', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.removeItem('mt_access_token');
          localStorage.removeItem('mt_refresh_token');
        }
      }
    }
    return Promise.reject(error);
  },
);
