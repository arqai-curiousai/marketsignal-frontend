'use client';

import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CommandPalette } from './CommandPalette';
import { useAuth } from '@/context/AuthContext';

interface ShellProps {
    children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
    const { error, clearError } = useAuth();

    return (
        <div className="relative flex min-h-screen flex-col bg-brand-slate">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-brand-emerald/5 blur-[120px]" />
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-brand-blue/5 blur-[120px]" />
                <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-brand-violet/5 blur-[120px]" />
            </div>

            {/* Skip navigation link (accessibility) */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-brand-blue focus:px-4 focus:py-2 focus:text-white focus:outline-none"
            >
                Skip to main content
            </a>

            <CommandPalette />
            <Header />

            {/* Auth error banner */}
            {error && (
                <div
                    role="alert"
                    className="relative z-50 bg-red-900/50 border-b border-red-800 px-4 py-2 text-sm text-red-200 flex items-center justify-between"
                >
                    <span>Authentication error: {error}</span>
                    <button
                        onClick={clearError}
                        className="text-red-300 hover:text-red-100 ml-4 shrink-0"
                        aria-label="Dismiss error"
                    >
                        &#x2715;
                    </button>
                </div>
            )}

            <main id="main-content" className="relative z-10 flex-1">
                {children}
            </main>
            <Footer />
        </div>
    );
}
