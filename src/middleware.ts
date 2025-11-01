import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/verify-otp',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/terms',
  '/privacy',
  '/demo',
  '/',
];

// Define protected routes that require authentication
const protectedRoutes = [
  // '/',
  '/chat',
  '/profile',
  '/settings',
  '/history',
];

// Helper function to check if a route is public
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route));
}

// Helper function to check if a route is protected
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
}

// Helper function to check if user is authenticated
function isAuthenticated(request: NextRequest): boolean {
  // Check for access token in cookies or localStorage (via headers)
  const authToken = request.cookies.get('auth_access_token')?.value;
  const authHeader = request.headers.get('authorization');
  
  return !!(authToken || authHeader?.startsWith('Bearer '));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Skip for files with extensions
  ) {
    return NextResponse.next();
  }

  // Check authentication status
  const authenticated = isAuthenticated(request);
  
  // Handle protected routes
  if (isProtectedRoute(pathname) && !authenticated) {
    // Redirect to login with the intended destination
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Handle authenticated users accessing auth pages
  if (authenticated && isPublicRoute(pathname)) {
    // Redirect authenticated users away from auth pages
    if (pathname === '/login' || pathname === '/register') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Security headers for all responses
  const response = NextResponse.next();

  // CSRF protection
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self' http://localhost:8000 https:; " +
    "frame-ancestors 'none';"
  );
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 