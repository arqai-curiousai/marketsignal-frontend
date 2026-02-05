/**
 * Navigation Service
 * 
 * Centralized navigation logic with authentication checks.
 * Follows Single Responsibility Principle.
 */

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export interface NavigationOptions {
    /** Whether user is authenticated */
    readonly isAuthenticated: boolean;
    /** Target path to navigate to */
    readonly targetPath: string;
    /** Next.js router instance */
    readonly router: AppRouterInstance;
    /** Optional callback on successful navigation */
    readonly onSuccess?: () => void;
    /** Optional callback on redirect to login */
    readonly onRedirect?: () => void;
}

export interface RedirectOptions {
    /** Current URL or search params */
    readonly searchParams?: URLSearchParams | string;
    /** Default redirect path if none specified */
    readonly defaultRedirect?: string;
}

/**
 * Checks authentication and navigates to target or login
 * 
 * @param options - Navigation configuration
 * @returns void
 */
export function checkAuthAndNavigate(options: NavigationOptions): void {
    const { isAuthenticated, targetPath, router, onSuccess, onRedirect } = options;

    if (isAuthenticated) {
        router.push(targetPath);
        onSuccess?.();
    } else {
        navigateToLogin({
            router,
            returnUrl: targetPath,
            onRedirect,
        });
    }
}

/**
 * Navigates to login with return URL
 * 
 * @param params - Login navigation parameters
 */
export function navigateToLogin(params: {
    readonly router: AppRouterInstance;
    readonly returnUrl?: string;
    readonly onRedirect?: () => void;
}): void {
    const { router, returnUrl, onRedirect } = params;

    let loginPath = '/login';

    if (returnUrl && returnUrl !== '/') {
        const encodedReturn = encodeURIComponent(returnUrl);
        loginPath = `/login?redirect=${encodedReturn}`;
    }

    router.push(loginPath);
    onRedirect?.();
}

/**
 * Extracts redirect URL from query parameters
 * 
 * @param options - Redirect extraction options
 * @returns Redirect URL or default
 */
export function getRedirectUrl(options: RedirectOptions = {}): string {
    const { searchParams, defaultRedirect = '/' } = options;

    if (!searchParams) {
        return defaultRedirect;
    }

    let params: URLSearchParams;

    if (typeof searchParams === 'string') {
        params = new URLSearchParams(searchParams);
    } else {
        params = searchParams;
    }

    const redirect = params.get('redirect');

    if (!redirect || typeof redirect !== 'string') {
        return defaultRedirect;
    }

    // Security: Only allow relative URLs
    const trimmed = redirect.trim();

    if (!trimmed.startsWith('/')) {
        return defaultRedirect;
    }

    // Prevent open redirect vulnerabilities
    if (trimmed.startsWith('//')) {
        return defaultRedirect;
    }

    return trimmed;
}

/**
 * Checks if a path requires authentication
 * 
 * @param pathname - Current pathname
 * @returns true if path requires auth
 */
export function requiresAuth(pathname: string): boolean {
    const protectedPaths = [/* '/ca-view', '/folk-view', */ '/dashboard', '/profile'];

    return protectedPaths.some((path) => pathname.startsWith(path));
}
