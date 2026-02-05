'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LoginForm } from '@/components/auth/LoginForm';
import { Activity } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage(): React.ReactElement {
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            {/* Simple header */}
            <header className="p-6">
                <Link href="/" className="flex items-center space-x-3 w-fit">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-emerald via-brand-blue to-brand-violet p-1.5">
                        <Activity className="h-full w-full text-white" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-xl font-bold tracking-tight gradient-text">अर्थसारथी</span>
                        <span className="text-[10px] text-muted-foreground tracking-wide">powered by arQai</span>
                    </div>
                </Link>
            </header>

            {/* Main content */}
            <main className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="relative w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
                    {/* Background effects */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <motion.div
                            className="absolute -left-24 top-[-6rem] h-72 w-72 rounded-full bg-brand-emerald/20 blur-3xl"
                            animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.05, 0.9] }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <motion.div
                            className="absolute right-[-4rem] top-1/3 h-80 w-80 rounded-full bg-brand-blue/15 blur-3xl"
                            animate={{ opacity: [0.2, 0.6, 0.2], x: [0, -18, 0] }}
                            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <motion.div
                            className="absolute bottom-[-6rem] left-1/4 h-80 w-80 rounded-full bg-brand-violet/10 blur-3xl"
                            animate={{ opacity: [0.15, 0.4, 0.15], x: [0, 16, 0] }}
                            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    </div>

                    {/* Left column: branding */}
                    <motion.div
                        className="relative z-10 flex-1 text-center lg:text-left space-y-6"
                        initial={{ opacity: 0, x: -24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center gap-2 rounded-full border border-brand-emerald/40 bg-brand-emerald/10 px-4 py-1.5 text-sm font-medium text-brand-emerald">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-emerald animate-pulse" />
                            Secure OTP Login
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-bold text-slate-50 leading-tight">
                            Welcome to{' '}
                            <span className="bg-gradient-to-r from-brand-emerald via-brand-blue to-brand-violet bg-clip-text text-transparent">
                                अर्थसारथी
                            </span>
                        </h1>
                        <p className="text-lg text-slate-300 max-w-md mx-auto lg:mx-0">
                            AI-powered investment research and signals platform. Get real-time market insights and data-driven recommendations.
                        </p>
                        <div className="space-y-3">
                            <FeatureItem text="OTP-only, passwordless access" />
                            <FeatureItem text="Real-time market signals and alerts" />
                            <FeatureItem text="AI-powered research assistant" />
                        </div>
                    </motion.div>

                    {/* Right column: login form */}
                    <motion.div
                        className="relative z-10 w-full max-w-md"
                        initial={{ opacity: 0, x: 24, scale: 0.96 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <LoginForm />
                    </motion.div>
                </div>
            </main>

            {/* Footer */}
            <footer className="p-6 text-center text-sm text-slate-500">
                © 2024 ArthSarthi by arQai. All rights reserved.
            </footer>
        </div>
    );
}

function FeatureItem({ text }: { readonly text: string }): React.ReactElement {
    return (
        <div className="flex items-center gap-2 text-slate-400">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-blue" />
            <span className="text-sm">{text}</span>
        </div>
    );
}
