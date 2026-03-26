import Cookies from 'js-cookie';

/**
 * CSRF Protection utilities
 * Implements Double Submit Cookie pattern
 */

const CSRF_TOKEN_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Generate a cryptographically secure random token
 */
function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Set CSRF token in cookie
 */
function setCSRFToken(): string {
  const token = generateCSRFToken();

  Cookies.set(CSRF_TOKEN_NAME, token, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: 1, // 1 day (js-cookie uses days)
  });

  return token;
}

/**
 * Get CSRF token from cookie
 */
function getCSRFToken(): string | undefined {
  return Cookies.get(CSRF_TOKEN_NAME);
}

/**
 * Add CSRF token to request headers
 */
export function addCSRFHeader(headers: HeadersInit = {}): HeadersInit {
  let token = getCSRFToken();

  // Auto-initialize CSRF token if not yet set (first POST request)
  if (!token) {
    token = setCSRFToken();
  }

  return {
    ...headers,
    [CSRF_HEADER_NAME]: token,
  };
}

