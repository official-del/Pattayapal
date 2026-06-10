/**
 * Centralized configuration for the Pattayapal Portfolio application.
 */

const trimTrailingSlash = (value) => String(value || '').trim().replace(/\/+$/, '');

const getApiBaseUrl = () => {
  const apiBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL);
  const legacyApiUrl = trimTrailingSlash(import.meta.env.VITE_API_URL);

  if (apiBaseUrl) return apiBaseUrl;
  if (legacyApiUrl) return legacyApiUrl.replace(/\/api$/, '');
  if (import.meta.env.PROD) return window.location.origin;
  return 'http://localhost:5000';
};

const apiBaseUrl = getApiBaseUrl();
const socketBaseUrl = trimTrailingSlash(import.meta.env.VITE_SOCKET_URL) || apiBaseUrl;

export const CONFIG = {
  API_BASE_URL: apiBaseUrl,
  API_URL: `${apiBaseUrl}/api`,
  SOCKET_URL: socketBaseUrl,
  IS_PRODUCTION: import.meta.env.PROD,
};

export default CONFIG;
