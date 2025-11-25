/**
 * User Utility Functions
 * 
 * Provides safe, reusable functions for user data manipulation.
 * Follows DRY principle and provides null-safe operations.
 */

import type { User } from '@/lib/types';

/**
 * Generates user initials from full name
 * 
 * @param name - Full name of the user
 * @returns Two-letter initials (uppercase)
 * 
 * @example
 * getUserInitials('John Doe') // Returns 'JD'
 * getUserInitials('Alice') // Returns 'AL'
 * getUserInitials('') // Returns 'U'
 */
export function getUserInitials(name: string): string {
    if (!name || typeof name !== 'string') {
        return 'U';
    }

    const trimmed = name.trim();

    if (!trimmed) {
        return 'U';
    }

    const words = trimmed.split(/\s+/);

    if (words.length === 1) {
        // Single word: take first two letters
        return trimmed.substring(0, 2).toUpperCase();
    }

    // Multiple words: take first letter of first and last word
    const firstInitial = words[0]?.[0] ?? '';
    const lastInitial = words[words.length - 1]?.[0] ?? '';

    return `${firstInitial}${lastInitial}`.toUpperCase();
}

/**
 * Safely extracts display name from user object
 * 
 * @param user - User object or null
 * @returns Display name or fallback
 * 
 * @example
 * getUserDisplayName({ name: 'John Doe', email: 'john@example.com' }) // Returns 'John Doe'
 * getUserDisplayName(null) // Returns 'Guest User'
 */
export function getUserDisplayName(user: User | null | undefined): string {
    if (!user) {
        return 'Guest User';
    }

    if (user.name && typeof user.name === 'string' && user.name.trim()) {
        return user.name.trim();
    }

    // Fallback to email if name is not available
    if (user.email && typeof user.email === 'string') {
        return user.email.split('@')[0] ?? 'Guest User';
    }

    return 'Guest User';
}

/**
 * Formats user email for display
 * Ensures safe string output
 * 
 * @param email - Email address
 * @returns Formatted email or fallback
 * 
 * @example
 * formatUserEmail('user@example.com') // Returns 'user@example.com'
 * formatUserEmail('') // Returns 'No email'
 */
export function formatUserEmail(email: string | null | undefined): string {
    if (!email || typeof email !== 'string' || !email.trim()) {
        return 'No email';
    }

    return email.trim().toLowerCase();
}

/**
 * Generates a display-friendly full name with title
 * 
 * @param user - User object
 * @param title - Optional professional title (e.g., 'CA', 'Dr.')
 * @returns Formatted name with title
 * 
 * @example
 * getFormattedUserName({ name: 'Rajesh Kumar' }, 'CA') // Returns 'CA Rajesh Kumar'
 */
export function getFormattedUserName(
    user: User | null | undefined,
    title?: string
): string {
    const displayName = getUserDisplayName(user);

    if (!title || displayName === 'Guest User') {
        return displayName;
    }

    return `${title} ${displayName}`;
}
