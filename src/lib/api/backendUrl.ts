// Centralised backend URL for server-side API route handlers.
// All Next.js app/api/auth/*/route.ts files should import from here
// instead of defining their own API_BASE constant.
const _raw = process.env.NEXT_PUBLIC_API_URL;
if (!_raw && typeof window === 'undefined') {
    // Server-side: env var is mandatory — fail fast instead of silently routing to localhost
    throw new Error(
        'NEXT_PUBLIC_API_URL environment variable is required. '
        + 'Set it to your backend URL (e.g. https://backend.example.com/api).'
    );
}
export const BACKEND_URL = (_raw || '/api').replace(/\/+$/, '');
