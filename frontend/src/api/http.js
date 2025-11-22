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
        // Only treat these errors as "session expired" when the request was authenticated
        // (i.e. carried an Authorization header). This prevents showing the session-expired
        // modal for public endpoints such as the login route which legitimately return 401/403
        // with user-facing messages.
        const reqHadAuthHeader = !!(error.config && error.config.headers && error.config.headers.Authorization);
        if (reqHadAuthHeader) {
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
        // otherwise, let the caller handle the error (e.g. login page shows message)
        return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// Default export for legacy imports (some files import `api` as the default)
export default api;