'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthState } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/apiClient';

interface AuthContextType extends AuthState {
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
    });
    const router = useRouter();

    const checkAuth = useCallback(async () => {
        try {
            const result = await apiClient.get<AuthState['user']>('/api/auth/profile');

            if (result.success) {
                setState(prev => ({
                    ...prev,
                    user: result.data,
                    isAuthenticated: true,
                    isLoading: false,
                }));
            } else {
                setState(prev => ({
                    ...prev,
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                }));
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setState(prev => ({
                ...prev,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: 'Failed to verify authentication status',
            }));
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const logout = useCallback(async () => {
        try {
            await apiClient.post('/api/auth/logout');
            setState(prev => ({
                ...prev,
                user: null,
                isAuthenticated: false,
            }));
            toast.success('Logged out successfully');
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            toast.error('Failed to logout');
        }
    }, [router]);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    const value = useMemo(
        () => ({ ...state, logout, checkAuth, clearError }),
        [state, logout, checkAuth, clearError],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
