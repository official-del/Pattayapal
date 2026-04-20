/**
 * Centralized configuration for the Pattayapal Portfolio application.
 */

const isProd = import.meta.env.PROD;

export const CONFIG = {
  // Use VITE_ prefix for env variables in Vite
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  API_URL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api`,
  SOCKET_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
};

export default CONFIG;
