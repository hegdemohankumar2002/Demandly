/**
 * Central API configuration.
 * Dynamically resolves the backend URL so the app works
 * from both localhost AND network IPs (e.g. mobile testing).
 */

function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: always use localhost
    return 'http://localhost:5000';
  }
  // Client-side: use same hostname the browser is on, but port 5000
  const hostname = window.location.hostname;
  return `http://${hostname}:5000`;
}

export const API_BASE = getApiBaseUrl();
export const API_URL = `${API_BASE}/api`;
