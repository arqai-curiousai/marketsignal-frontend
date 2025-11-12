/**
 * API Configuration
 * Centralized configuration for all API calls
 */

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://backend.arthasarthi.arqai.tech/api/v1',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  
  endpoints: {
    chat: '/chat',
    sessions: '/sessions',
    sources: '/sources',
    auth: {
      'request-otp': '/auth/request-otp',
      'verify-otp': '/auth/verify-otp',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      profile: '/auth/profile',
      '2fa': {
        setup: '/auth/2fa/setup',
        verify: '/auth/2fa/verify',
        disable: '/auth/2fa/disable',
      },
      sessions: '/auth/sessions',
    },
    legal: {
      search: '/legal/search',
      cases: '/legal/cases',
      statutes: '/legal/statutes',
      policies: '/legal/policies',
    },
  },
  
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Authentication specific configuration
  auth: {
    tokenRefreshThreshold: 300, // Refresh token 5 minutes before expiry
    maxRetryAttempts: 3,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
  },
}; 