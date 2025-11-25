/**
 * Authentication-related Type Definitions
 * 
 * Strict TypeScript types for authentication state and user data.
 */

import type { User, AuthTokens } from '@/lib/types';

/**
 * Extended user display information
 */
export interface UserDisplayInfo {
    readonly displayName: string;
    readonly initials: string;
    readonly email: string;
    readonly hasAvatar: boolean;
}

/**
 * Navigation state for routing
 */
export interface NavigationState {
    readonly from?: string;
    readonly to: string;
    readonly returnUrl?: string;
    readonly isProtected: boolean;
}

/**
 * Authentication route guard result
 */
export interface RouteGuardResult {
    readonly allowed: boolean;
    readonly redirectTo?: string;
    readonly reason?: 'unauthenticated' | 'unauthorized' | 'expired';
}

/**
 * User profile with computed properties
 */
export interface UserProfile extends User {
    readonly fullDisplayName: string;
    readonly initials: string;
}

/**
 * Type guard to check if user is authenticated
 */
export function isAuthenticatedUser(
    user: User | null | undefined
): user is User {
    return user !== null && user !== undefined && typeof user.email === 'string';
}

/**
 * Type guard for valid auth tokens
 */
export function hasValidTokens(
    tokens: AuthTokens | null | undefined
): tokens is AuthTokens {
    return (
        tokens !== null &&
        tokens !== undefined &&
        typeof tokens.accessToken === 'string' &&
        tokens.accessToken.length > 0
    );
}
