/**
 * Centralised backend URL for server-side API route handlers.
 *
 * All Next.js `app/api/auth/*/route.ts` files should import from here
 * instead of defining their own `API_BASE` constant.
 */
export const BACKEND_URL =
    (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');
