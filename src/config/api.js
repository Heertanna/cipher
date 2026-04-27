/**
 * Central API base URL for all frontend HTTP calls.
 * Set VITE_API_URL in .env (local) or CI/hosting env (production).
 * VITE_API_BASE_URL is still read for backward compatibility with older deploy configs.
 */
export const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://cipher-production-e52f.up.railway.app";
