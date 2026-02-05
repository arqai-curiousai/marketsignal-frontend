/**
 * Type-safe API client for backend communication.
 * 
 * Implements:
 * - Generic fetch wrapper with error handling
 * - Request/response type safety
 * - Automatic JSON parsing
 * - Authentication header injection
 */

import { IApiError } from '@/types/stock';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

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

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${API_BASE_URL}${endpoint}`);

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
 * Core fetch wrapper with error handling and type safety
 */
async function request<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<ApiResult<T>> {
    const { method = 'GET', body, headers = {}, params } = options;

    const url = buildUrl(endpoint, params);

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers,
    };

    // Add API key if configured
    if (API_KEY) {
        requestHeaders['X-API-Key'] = API_KEY;
    }

    try {
        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
        });

        // Handle non-OK responses
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
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
        // Network or parsing error
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
    /**
     * GET request
     */
    get<T>(
        endpoint: string,
        params?: Record<string, string | number | boolean | undefined>
    ): Promise<ApiResult<T>> {
        return request<T>(endpoint, { method: 'GET', params });
    },

    /**
     * POST request
     */
    post<T>(endpoint: string, body?: unknown): Promise<ApiResult<T>> {
        return request<T>(endpoint, { method: 'POST', body });
    },

    /**
     * PUT request
     */
    put<T>(endpoint: string, body?: unknown): Promise<ApiResult<T>> {
        return request<T>(endpoint, { method: 'PUT', body });
    },

    /**
     * DELETE request
     */
    delete<T>(endpoint: string): Promise<ApiResult<T>> {
        return request<T>(endpoint, { method: 'DELETE' });
    },
};

export default apiClient;
