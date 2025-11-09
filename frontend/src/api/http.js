import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:4000',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  // if token exists, check expiry and attach header
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp <= now) {
        // token expired: clear and dispatch a global event to show modal in the app
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        const returnTo = window.location.pathname + window.location.search;
        try {
          window.dispatchEvent(new CustomEvent('sessionExpired', { detail: { returnTo } }));
        } catch (e) {
          // fallback to direct redirect if dispatch fails
          window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
        }
        // don't attach expired token
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // malformed token — remove and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }
  return config;
});

// Response interceptor: if server returns 401/403, redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error && error.response && (error.response.status === 401 || error.response.status === 403)) {
      // clear local storage and dispatch sessionExpired so the app can show a modal
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const returnTo = window.location.pathname + window.location.search;
      try {
        window.dispatchEvent(new CustomEvent('sessionExpired', { detail: { returnTo } }));
      } catch (e) {
        window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
      }
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// Default export for legacy imports (some files import `api` as the default)
export default api;