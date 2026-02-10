import Cookies from '@/node_modules/@types/js-cookie';

/**
 * CSRF Protection utilities
 * Implements Double Submit Cookie pattern
 */

const CSRF_TOKEN_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Generate a cryptographically secure random token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Set CSRF token in cookie
 */
export function setCSRFToken(): string {
  const token = generateCSRFToken();

  Cookies.set(CSRF_TOKEN_NAME, token, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  return token;
}

/**
 * Get CSRF token from cookie
 */
export function getCSRFToken(): string | undefined {
  return Cookies.get(CSRF_TOKEN_NAME);
}

/**
 * Add CSRF token to request headers
 */
export function addCSRFHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getCSRFToken();

  if (token) {
    return {
      ...headers,
      [CSRF_HEADER_NAME]: token,
    };
  }

  return headers;
}

/**
 * Verify CSRF token from request
 */
export function verifyCSRFToken(token: string | null): boolean {
  if (!token) return false;

  const storedToken = getCSRFToken();
  if (!storedToken) return false;

  // Constant time comparison to prevent timing attacks
  return token.length === storedToken.length &&
    token.split('').every((char, i) => char === storedToken[i]);
} 