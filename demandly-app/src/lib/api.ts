/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Central API configuration.
 * Uses NEXT_PUBLIC_API_URL env var at build time, with dynamic fallback
 * for local network/mobile testing when env var is not set.
 */

function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (typeof window === 'undefined') {
    // Server-side: use env var or default to localhost
    return envUrl || 'http://localhost:5000';
  }
  // Client-side: use env var or dynamic hostname fallback
  return envUrl || `http://${window.location.hostname}:5000`;
}

export const API_BASE = getApiBaseUrl();
export const API_URL = `${API_BASE}/api/v1`;

// Global client-side fetch interceptor to append headers to backend API calls
if (typeof window !== 'undefined' && !(window as any).__fetchIntercepted) {
  (window as any).__fetchIntercepted = true;
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else if (input && typeof input === 'object' && 'url' in input) {
      url = (input as any).url;
    }

    const isApiRequest = url.includes('/api/v1') || url.includes(API_URL);

    if (isApiRequest) {
      const newInit = { ...init };
      const headers = new Headers(newInit.headers);

      // Inject Master API Key
      const apiKey = process.env.NEXT_PUBLIC_MASTER_API_KEY;
      if (!apiKey) {
        console.warn('Warning: NEXT_PUBLIC_MASTER_API_KEY is not defined in environment variables.');
      }
      headers.set('x-api-key', apiKey || '');

      // Inject Auth Token if present in local storage
      const token = localStorage.getItem('demandly_token');
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      newInit.headers = headers;

      let response: Response;
      if (input instanceof Request) {
        const newRequest = new Request(input, { headers });
        response = await originalFetch(newRequest, init);
      } else {
        response = await originalFetch(input, newInit);
      }

      if (response.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/google')) {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('demandly_token');
          if (token) {
            localStorage.removeItem('demandly_user');
            localStorage.removeItem('demandly_token');
            window.location.href = '/login?expired=true';
          }
        }
      }

      return response;
    }

    return originalFetch(input, init);
  };
}