'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthState } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AuthContextType extends AuthState {
    login: (user: User) => void;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
    });
    const router = useRouter();

    const checkAuth = async () => {
        try {
            // We check /api/auth/profile or a similar endpoint to validate the session cookie
            const response = await fetch('/api/auth/profile');

            if (response.ok) {
                const data = await response.json();
                // Assuming the profile endpoint returns the user object
                setState(prev => ({
                    ...prev,
                    user: data,
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
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = (user: User) => {
        setState(prev => ({
            ...prev,
            user,
            isAuthenticated: true,
            error: null,
        }));
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setState(prev => ({
                ...prev,
                user: null,
                tokens: null,
                isAuthenticated: false,
            }));
            toast.success('Logged out successfully');
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            toast.error('Failed to logout');
        }
    };

    return (
        <AuthContext.Provider value={{ ...state, login, logout, checkAuth }}>
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
