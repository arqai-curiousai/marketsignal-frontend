// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';

// // Define public routes that don't require authentication
// const publicRoutes = [
//   '/verify-otp',
//   '/login',
//   '/register',
//   '/forgot-password',
//   '/reset-password',
//   '/terms',
//   '/privacy',
//   '/demo',
//   '/',
// ];

// // Define protected routes that require authentication
// const protectedRoutes = [
//   // '/',
//   '/chat',
//   '/profile',
//   '/settings',
//   '/history',
// ];

// // Helper function to check if a route is public
// function isPublicRoute(pathname: string): boolean {
//   return publicRoutes.some(route => pathname.startsWith(route));
// }

// // Helper function to check if a route is protected
// function isProtectedRoute(pathname: string): boolean {
//   return protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
// }

// // Helper function to check if user is authenticated
// function isAuthenticated(request: NextRequest): boolean {
//   // Check for access token in cookies or localStorage (via headers)
//   const authToken = request.cookies.get('auth_access_token')?.value;
//   const authHeader = request.headers.get('authorization');
  
//   return !!(authToken || authHeader?.startsWith('Bearer '));
// }

// export function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   // Skip middleware for static files and API routes
//   if (
//     pathname.startsWith('/_next') ||
//     pathname.startsWith('/api') ||
//     pathname.startsWith('/static') ||
//     pathname.includes('.') // Skip for files with extensions
//   ) {
//     return NextResponse.next();
//   }

//   // Check authentication status
//   const authenticated = isAuthenticated(request);
  
//   // Handle protected routes
//   if (isProtectedRoute(pathname) && !authenticated) {
//     // Redirect to login with the intended destination
//     const loginUrl = new URL('/login', request.url);
//     loginUrl.searchParams.set('redirect', pathname);
//     return NextResponse.redirect(loginUrl);
//   }

//   // Handle authenticated users accessing auth pages
//   if (authenticated && isPublicRoute(pathname)) {
//     // Redirect authenticated users away from auth pages
//     if (pathname === '/login' || pathname === '/register') {
//       return NextResponse.redirect(new URL('/', request.url));
//     }
//   }

//   // Security headers for all responses
//   const response = NextResponse.next();

//   // CSRF protection
//   response.headers.set('X-Frame-Options', 'DENY');
//   response.headers.set('X-Content-Type-Options', 'nosniff');
//   response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
//   response.headers.set('X-XSS-Protection', '1; mode=block');

//   // Content Security Policy
//   response.headers.set(
//     'Content-Security-Policy',
//     "default-src 'self'; " +
//     "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
//     "style-src 'self' 'unsafe-inline'; " +
//     "img-src 'self' data: https:; " +
//     "font-src 'self'; " +
//     "connect-src 'self' http://localhost:8000 https:; " +
//     "frame-ancestors 'none';"
//   );
  
//   return response;
// }

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - api (API routes)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      */
//     '/((?!api|_next/static|_next/image|favicon.ico).*)',
//   ],
// }; 

// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

function csvToArray(input?: string, fallback: string[] = []): string[] {
  if (!input) return fallback;
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const NODE_ENV = process.env.NODE_ENV ?? 'production';
const IS_PROD = NODE_ENV === 'production';

// Public runtime (exposed at build time)
const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN || 'https://backend.legalaid.arqai.tech';
const WS_ORIGIN = process.env.NEXT_PUBLIC_WS_ORIGIN || API_ORIGIN.replace(/^http/, 'ws');

// Optional canonical host (e.g. app.legalaid.com). If set, we'll redirect to it in prod.
const CANONICAL_HOST = process.env.NEXT_PUBLIC_CANONICAL_HOST; // e.g. "legalaid.com"

// Extra connect-src entries if you use analytics, Sentry, etc.
const EXTRA_CONNECT = csvToArray(process.env.NEXT_PUBLIC_CSP_EXTRA_CONNECT); // comma-separated

function buildCSP(): string {
  // Keep CSP permissive enough for Next.js dev; tighten in prod.
  const connectSrc = ["'self'", API_ORIGIN, 'https:', 'wss:', WS_ORIGIN, ...EXTRA_CONNECT];

  const base: string[] = [
    "default-src 'self'",
    // Next.js + (optionally) analytics/sentry often need 'unsafe-inline' in real-world apps.
    // If you fully nonce your scripts, remove 'unsafe-inline' and 'unsafe-eval'.
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(' ')}`,
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'self'",
  ];

  return base.join('; ');
}

export function middleware(req: NextRequest) {
  // Enforce HTTPS & optional canonical host in production
  if (IS_PROD) {
    const url = new URL(req.url);

    // 1) Force HTTPS
    const isHttps =
      url.protocol === 'https:' ||
      req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() === 'https';
    if (!isHttps) {
      url.protocol = 'https:';
      return NextResponse.redirect(url, 308);
    }

    // 2) Canonical host redirect (optional)
    if (CANONICAL_HOST && url.hostname !== CANONICAL_HOST) {
      url.hostname = CANONICAL_HOST;
      return NextResponse.redirect(url, 308);
    }
  }

  const res = NextResponse.next();

  // Security headers
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Permissions-Policy', [
    'camera=()',
    'geolocation=()',
    'microphone=()',
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'battery=()',
    'clipboard-read=()',
    'clipboard-write=()',
    'display-capture=()',
    'document-domain=()',
    'encrypted-media=()',
    'fullscreen=(self)',
    'gamepad=()',
    'gyroscope=()',
    'hid=()',
    'idle-detection=()',
    'magnetometer=()',
    'midi=()',
    'payment=()',
    'picture-in-picture=(self)',
    'publickey-credentials-get=(self)',
    'screen-wake-lock=()',
    'serial=()',
    'sync-xhr=()',
    'usb=()',
    'xr-spatial-tracking=()',
  ].join(', '));

  // Strict-Transport-Security only in production (prevents local dev pain)
  if (IS_PROD) {
    // includeSubDomains if you're sure all subdomains are HTTPS
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  // Content Security Policy
  const csp = buildCSP();
  // If you prefer Report-Only during rollout, change to: Content-Security-Policy-Report-Only
  res.headers.set('Content-Security-Policy', csp);

  return res;
}

// Match all app routes and assets (skip Next.js internals if you prefer)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
