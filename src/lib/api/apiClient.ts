/**
 * Type-safe API client for backend communication.
 *
 * All requests use relative URLs so they go through the Next.js server,
 * which proxies them to the backend via rewrites (next.config.js).
 * This keeps the API key server-side only — never exposed to the browser.
 *
 * Includes CSRF protection (Double Submit Cookie) and automatic
 * 401 → token refresh → retry logic.
 */

import { IApiError } from '@/types/stock';
import { addCSRFHeader } from '../security/csrf';

/**
 * API response wrapper for type-safe error handling
 */
export type ApiResult<T> =
    | { success: true; data: T }
    | { success: false; error: IApiError };

/**
 * Request options interface
 */
interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: unknown;
    headers?: Record<string, string>;
    params?: Record<string, string | number | boolean | undefined>;
}

/** Retry configuration */
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

/** Protected route prefixes — a 401 on these triggers refresh */
const PROTECTED_PREFIXES = [
    '/chatbot', '/stocks', '/signals', '/playground',
    '/assistant', '/research', '/settings',
];

/** Shared promise so concurrent 401s all await the same refresh */
let refreshPromise: Promise<boolean> | null = null;

/**
 * Build URL with query parameters (relative paths for browser security)
 */
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const base = typeof window !== 'undefined'
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
    const url = new URL(endpoint, base);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        });
    }

    return url.toString();
}

/**
 * Attempt to refresh the access token via the backend refresh endpoint.
 * If a refresh is already in flight, all callers share the same promise.
 */
async function tryRefreshToken(): Promise<boolean> {
    if (refreshPromise) return refreshPromise;
    refreshPromise = doRefresh().finally(() => {
        refreshPromise = null;
    });
    return refreshPromise;
}

async function doRefresh(): Promise<boolean> {
    try {
        const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
        });
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Core fetch wrapper with error handling, CSRF, retry, and type safety
 */
async function request<T>(
    endpoint: string,
    options: RequestOptions = {},
    _retryCount: number = 0,
): Promise<ApiResult<T>> {
    const { method = 'GET', body, headers = {}, params } = options;

    const url = buildUrl(endpoint, params);

    // Apply CSRF header
    const csrfHeaders = addCSRFHeader(headers) as Record<string, string>;

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...csrfHeaders,
    };

    try {
        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
            credentials: 'include',
        });

        // Handle 401 — attempt token refresh on protected routes
        if (response.status === 401 && typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const isProtected = PROTECTED_PREFIXES.some((p) => currentPath.startsWith(p));

            if (isProtected && _retryCount === 0) {
                const refreshed = await tryRefreshToken();
                if (refreshed) {
                    // Retry the original request once
                    return request<T>(endpoint, options, 1);
                }
                window.location.href = '/login?message=session-expired';
            }

            return {
                success: false,
                error: {
                    status: 401,
                    message: 'Unauthorized',
                    detail: 'Session expired',
                },
            };
        }

        // Handle non-OK responses
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // Retry on 5xx (transient server errors)
            if (response.status >= 500 && _retryCount < MAX_RETRIES) {
                await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (_retryCount + 1)));
                return request<T>(endpoint, options, _retryCount + 1);
            }

            return {
                success: false,
                error: {
                    status: response.status,
                    message: response.statusText,
                    detail: errorData.detail || errorData.message,
                },
            };
        }

        // Parse JSON response
        const data = await response.json();
        return { success: true, data: data as T };

    } catch (error) {
        // Network errors — retry once
        if (_retryCount < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (_retryCount + 1)));
            return request<T>(endpoint, options, _retryCount + 1);
        }

        return {
            success: false,
            error: {
                status: 0,
                message: 'Network error',
                detail: error instanceof Error ? error.message : 'Unknown error',
            },
        };
    }
}

/**
 * API Client singleton with typed methods
 */
export const apiClient = {
    get<T>(
        endpoint: string,
        params?: Record<string, string | number | boolean | undefined>
    ): Promise<ApiResult<T>> {
        return request<T>(endpoint, { method: 'GET', params });
    },

    post<T>(endpoint: string, body?: unknown): Promise<ApiResult<T>> {
        return request<T>(endpoint, { method: 'POST', body });
    },

    put<T>(endpoint: string, body?: unknown): Promise<ApiResult<T>> {
        return request<T>(endpoint, { method: 'PUT', body });
    },

    delete<T>(endpoint: string): Promise<ApiResult<T>> {
        return request<T>(endpoint, { method: 'DELETE' });
    },
};

export default apiClient;
