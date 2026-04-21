/**
 * Centralized configuration for the Pattayapal Portfolio application.
 */

const isProd = import.meta.env.PROD;

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (import.meta.env.PROD) return window.location.origin;
  return 'http://localhost:5000';
};

const baseUrl = getBaseUrl();

export const CONFIG = {
  API_BASE_URL: baseUrl,
  API_URL: `${baseUrl}/api`,
  SOCKET_URL: baseUrl,
};

export default CONFIG;
