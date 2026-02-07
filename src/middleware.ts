import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add routes that require authentication
const protectedRoutes = [
    '/stocks',
    '/assistant',
    '/research',
    '/settings',
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the requested path is a protected route
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname.startsWith(route)
    );

    if (isProtectedRoute) {
        // Check for authentication cookie
        // The name 'access_token' matches what's set by the backend/auth flow
        const token = request.cookies.get('access_token');

        if (!token) {
            // Redirect to login page if no token found
            const loginUrl = new URL('/login', request.url);
            // Optional: Add return URL to redirect back after login
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
