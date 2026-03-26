import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Decode the JWT payload and check if the token has expired.
 * Edge Runtime lacks Node.js crypto, so we only decode — no signature verification.
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    const decoded = JSON.parse(atob(payload));
    if (!decoded.exp) return true;
    // Add 30 second forward buffer so we catch tokens about to expire
    return decoded.exp * 1000 < Date.now() + 30000;
  } catch {
    return true;
  }
}

// Add routes that require authentication
const protectedRoutes = [
    '/stocks',
    '/signals',
    '/forex',
    '/playground',
    '/assistant',
    '/research',
    '/settings',
];

export function middleware(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;

    // Normalize trailing slashes for consistent route matching
    const normalizedPath = pathname.replace(/\/+$/, '') || '/';

    // Check if the requested path is a protected route
    const isProtectedRoute = protectedRoutes.some(route =>
        normalizedPath.startsWith(route)
    );

    if (isProtectedRoute) {
        // Check for authentication cookie
        // The name 'access_token' matches what's set by the backend/auth flow
        const token = request.cookies.get('access_token');

        if (!token || isTokenExpired(token.value)) {
            // Redirect to login page if no token or token is expired
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('from', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder content
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
