import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  AxiosRequestHeaders,
} from 'axios';
import { API_CONFIG } from './config';
import { addCSRFHeader } from '../security/csrf';
import { ApiError } from '../types';

// Forward declaration to avoid circular dependency
let authServiceInstance: any = null;

/**
 * Set the auth service instance for token management
 * This is called from the auth service to avoid circular dependencies
 */
export function setAuthServiceInstance(instance: any) {
  authServiceInstance = instance;
}

/* ------------------------------------------------------------------ */
/* Header Utilities: convert between Fetch headers and Axios headers   */
/* ------------------------------------------------------------------ */

type PlainHeaders = Record<string, string>;

// Convert HeadersInit (string[][] | Record | Headers) -> plain object
function headersInitToPlain(h?: HeadersInit | AxiosRequestHeaders | null): PlainHeaders {
  const out: PlainHeaders = {};
  if (!h) return out;

  // Native Headers
  if (typeof (globalThis as any).Headers !== 'undefined' && h instanceof Headers) {
    h.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }

  // Array of tuples
  if (Array.isArray(h)) {
    for (const [k, v] of h) {
      out[k] = String(v);
    }
    return out;
  }

  // AxiosHeaders (axios v1) or plain object
  // AxiosHeaders has .toJSON()
  const maybeAxiosHeaders = h as any;
  if (maybeAxiosHeaders && typeof maybeAxiosHeaders.toJSON === 'function') {
    const json = maybeAxiosHeaders.toJSON() as Record<string, string>;
    return { ...json };
  }

  // Plain object-like
  return { ...(h as Record<string, string>) };
}

// Apply a header key/value to config.headers regardless of underlying type
function setHeader(
  headers: AxiosRequestHeaders | any | undefined,
  key: string,
  value: string | undefined
) {
  if (!value) return;
  if (!headers) return;

  // AxiosHeaders instance
  if (typeof (headers as any).set === 'function') {
    (headers as any).set(key, value);
    return;
  }

  // Plain object
  (headers as Record<string, any>)[key] = value;
}

// Ensure config.headers is a mutable structure Axios accepts
function ensureAxiosHeaders(
  headers: HeadersInit | AxiosRequestHeaders | undefined | null
): AxiosRequestHeaders {
  const plain = headersInitToPlain(headers);
  // AxiosRequestHeaders is just a string index signature; the plain object satisfies it
  return plain as AxiosRequestHeaders;
}

// Run addCSRFHeader (which expects HeadersInit) and convert back to Axios headers
function applyCsrf(headers: AxiosRequestHeaders | undefined): AxiosRequestHeaders {
  const before = headersInitToPlain(headers) as HeadersInit;
  const after = addCSRFHeader(before); // may return HeadersInit (Headers/array/object)
  return headersInitToPlain(after) as AxiosRequestHeaders;
}

/* ------------------------------------------------------------------ */
/* Create client                                                      */
/* ------------------------------------------------------------------ */

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: ensureAxiosHeaders(API_CONFIG.headers as any),
    withCredentials: true, // Include cookies in requests
  });

  // Request interceptor for authentication and CSRF
  client.interceptors.request.use(
    async (config) => {
      // Normalize headers to a plain Axios-friendly object
      config.headers = ensureAxiosHeaders(config.headers);

      // Add CSRF token to headers (via your existing helper)
      config.headers = applyCsrf(config.headers);

      // Add auth token if available
      if (authServiceInstance) {
        const tokens = authServiceInstance.getStoredTokens?.();
        if (tokens?.accessToken) {
          setHeader(config.headers, 'Authorization', `Bearer ${tokens.accessToken}`);
        }
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling and token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config as any;

      if (error.response) {
        // Handle specific status codes
        switch (error.response.status) {
          case 401: {
            // Token expired - try to refresh
            if (!originalRequest?._retry && authServiceInstance) {
              originalRequest._retry = true;

              try {
                await authServiceInstance.refreshToken?.();

                // Retry the original request with new token
                const tokens = authServiceInstance.getStoredTokens?.();
                if (tokens?.accessToken) {
                  // Normalize headers on the retried request as well
                  originalRequest.headers = ensureAxiosHeaders(originalRequest.headers);
                  setHeader(originalRequest.headers, 'Authorization', `Bearer ${tokens.accessToken}`);
                  return client(originalRequest);
                }
              } catch (refreshError) {
                // Token refresh failed, redirect to login
                if (typeof window !== 'undefined') {
                  window.location.href = '/login?message=session-expired';
                }
                return Promise.reject(refreshError);
              }
            } else {
              // No auth service or retry already attempted, redirect to login
              if (typeof window !== 'undefined') {
                window.location.href = '/login?message=session-expired';
              }
            }
            break;
          }

          case 403:
            // Forbidden - CSRF token might be invalid or insufficient permissions
            console.error('Access forbidden:', error.response.data);
            break;

          case 429: {
            // Rate limit exceeded
            const retryAfter = (error.response.headers as any)?.['retry-after'];
            console.error(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
            break;
          }

          case 422:
            // Validation error
            console.error('Validation error:', error.response.data);
            break;

          default:
            if (error.response.status >= 500) {
              console.error('Server error:', error.response.data);
            }
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * API client instance
 */
export const apiClient = createApiClient();

/**
 * Type-safe API request wrapper
 */
export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.request<T>(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      throw error.response.data;
    }
    throw error;
  }
}

export const api = axios.create({
  baseURL: '/api', // <— single origin via rewrite
  withCredentials: true, // <— REQUIRED for cookies to stick
});
