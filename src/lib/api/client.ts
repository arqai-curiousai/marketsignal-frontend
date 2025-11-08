import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  AxiosRequestHeaders,
} from "axios";
import { API_CONFIG } from "./config";
import { addCSRFHeader } from "../security/csrf";
import { ApiError } from "../types";

// Forward declaration to avoid circular dependency
let authServiceInstance: any = null;

/**
 * Set the auth service instance for token management
 * (used mainly for refresh logic / logout redirects)
 */
export function setAuthServiceInstance(instance: any) {
  authServiceInstance = instance;
}

/* ------------------------------------------------------------------ */
/* Header utilities                                                    */
/* ------------------------------------------------------------------ */

type PlainHeaders = Record<string, string>;

function headersInitToPlain(
  h?: HeadersInit | AxiosRequestHeaders | null
): PlainHeaders {
  const out: PlainHeaders = {};
  if (!h) return out;

  // Native Headers
  if (typeof (globalThis as any).Headers !== "undefined" && h instanceof Headers) {
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
  const maybeAxiosHeaders = h as any;
  if (maybeAxiosHeaders && typeof maybeAxiosHeaders.toJSON === "function") {
    const json = maybeAxiosHeaders.toJSON() as Record<string, string>;
    return { ...json };
  }

  // Plain object-like
  return { ...(h as Record<string, string>) };
}

function ensureAxiosHeaders(
  headers: HeadersInit | AxiosRequestHeaders | undefined | null
): AxiosRequestHeaders {
  const plain = headersInitToPlain(headers);
  return plain as AxiosRequestHeaders;
}

function applyCsrf(
  headers: AxiosRequestHeaders | undefined
): AxiosRequestHeaders {
  const before = headersInitToPlain(headers) as HeadersInit;
  const after = addCSRFHeader(before);
  return headersInitToPlain(after) as AxiosRequestHeaders;
}

/* ------------------------------------------------------------------ */
/* Create API client                                                   */
/* ------------------------------------------------------------------ */

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    // CRITICAL: hit Next.js /api so rewrites route to FastAPI
    baseURL: "/api",
    // If you still want to use API_CONFIG.timeout or headers, you can:
    timeout: API_CONFIG.timeout,
    headers: ensureAxiosHeaders(API_CONFIG.headers as any),
    // Needed so cookies (access_token, refresh_token) are sent/received
    withCredentials: true,
  });

  // Request interceptor: CSRF + normalization
  client.interceptors.request.use(
    async (config) => {
      config.headers = ensureAxiosHeaders(config.headers);

      // Add CSRF token header (your existing helper)
      config.headers = applyCsrf(config.headers);

      // IMPORTANT: do NOT inject Authorization manually anymore.
      // Auth now relies on HttpOnly cookies (access_token/refresh_token),
      // which the browser sends automatically with withCredentials: true.

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor: error handling + refresh on 401
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config as any;

      if (error.response) {
        const status = error.response.status;

        // if (status === 401) {
        //   // Try token refresh if available
        //   if (!originalRequest?._retry && authServiceInstance?.refreshToken) {
        //     originalRequest._retry = true;

        //     try {
        //       // This should call /auth/refresh,
        //       // which uses the refresh_token cookie and sets a new access_token cookie
        //       await authServiceInstance.refreshToken();

        //       // Retry the original request; cookies now contain a fresh access token
        //       return client(originalRequest);
        //     } catch (refreshError) {
        //       if (typeof window !== "undefined") {
        //         window.location.href = "/login?message=session-expired";
        //       }
        //       return Promise.reject(refreshError);
        //     }
        //   } else {
        //     // No refresh available or already retried
        //     if (typeof window !== "undefined") {
        //       window.location.href = "/login?message=session-expired";
        //     }
        //   }
        // } 

        if (status === 401) {
          const isBrowser = typeof window !== "undefined";
          const currentPath = isBrowser ? window.location.pathname : "";
        
          // All routes where user MUST be logged in
          const PROTECTED_PREFIXES = ['/chatbot']; // add more later if needed
          const isProtectedRoute = PROTECTED_PREFIXES.some((p) =>
            currentPath.startsWith(p)
          );
        
          // If we are NOT on a protected route (e.g. "/")
          if (!isProtectedRoute) {
            // Just clear tokens and stay on the same page
            authServiceInstance?.logout?.();
            return Promise.reject(error);
          }
        
          // If we ARE on a protected route, keep your existing refresh+redirect logic:
          if (!originalRequest?._retry && authServiceInstance?.refreshToken) {
            try {
              await authServiceInstance.refreshToken();
              originalRequest._retry = true;
              return client(originalRequest);
            } catch (refreshError) {
              if (isBrowser) {
                window.location.href = "/login?message=session-expired";
              }
              return Promise.reject(refreshError);
            }
          } else {
            if (isBrowser) {
              window.location.href = "/login?message=session-expired";
            }
            return Promise.reject(error);
          }
        }
        
        
        else if (status === 403) {
          console.error("Access forbidden:", error.response.data);
        } else if (status === 429) {
          const retryAfter = (error.response.headers as any)?.["retry-after"];
          console.error(
            `Rate limit exceeded. Retry after ${retryAfter ?? "some"} seconds`
          );
        } else if (status === 422) {
          console.error("Validation error:", error.response.data);
        } else if (status >= 500) {
          console.error("Server error:", error.response.data);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

/* ------------------------------------------------------------------ */
/* Public exports                                                      */
/* ------------------------------------------------------------------ */

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
