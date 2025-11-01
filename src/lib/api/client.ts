import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
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

/**
 * Create an Axios instance with secure defaults
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: API_CONFIG.headers,
    withCredentials: true, // Include cookies in requests
  });

  // Request interceptor for authentication and CSRF
  client.interceptors.request.use(
    async (config) => {
      // Add CSRF token to headers
      config.headers = addCSRFHeader(config.headers);
      
      // Add auth token if available
      if (authServiceInstance) {
        const tokens = authServiceInstance.getStoredTokens();
        if (tokens && tokens.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
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
          case 401:
            // Token expired - try to refresh
            if (!originalRequest._retry && authServiceInstance) {
              originalRequest._retry = true;
              
              try {
                await authServiceInstance.refreshToken();
                
                // Retry the original request with new token
                const tokens = authServiceInstance.getStoredTokens();
                if (tokens && tokens.accessToken) {
                  originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
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
          
          case 403:
            // Forbidden - CSRF token might be invalid or insufficient permissions
            console.error('Access forbidden:', error.response.data);
            break;
          
          case 429:
            // Rate limit exceeded
            const retryAfter = error.response.headers['retry-after'];
            console.error(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
            break;
            
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
export async function apiRequest<T>(
  config: AxiosRequestConfig
): Promise<T> {
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
  baseURL: "/api",          // <— single origin via rewrite
  withCredentials: true,    // <— REQUIRED for cookies to stick
});