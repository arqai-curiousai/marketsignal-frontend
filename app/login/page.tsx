'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LoginForm } from '@/components/auth/LoginForm';
import { LoginCanvas } from '@/components/auth/LoginCanvas';
import { Shield, Activity, Brain, Zap } from 'lucide-react';
import { BRAND } from '@/lib/brand';

/* ── Easing ── */
const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_CIRC: [number, number, number, number] = [0.77, 0, 0.175, 1];

/* ── Drifting star dots ── */
const STARS = [
    { left: '6%', top: '12%', delay: 0, dur: 7 },
    { left: '90%', top: '20%', delay: 0.6, dur: 6 },
    { left: '15%', top: '80%', delay: 1.0, dur: 8 },
    { left: '78%', top: '85%', delay: 0.3, dur: 5 },
    { left: '45%', top: '6%', delay: 1.2, dur: 7 },
    { left: '94%', top: '55%', delay: 0.8, dur: 6 },
    { left: '3%', top: '50%', delay: 1.5, dur: 8 },
    { left: '60%', top: '92%', delay: 0.2, dur: 5 },
];

/* ── Feature bullets ── */
const FEATURES = [
    { icon: Shield, text: 'Passwordless OTP authentication' },
    { icon: Activity, text: 'Real-time market analytics' },
    { icon: Brain, text: 'Dual AI Agent intelligence' },
    { icon: Zap, text: '42 forex pairs, 230+ equities' },
];

export default function LoginPage(): React.ReactElement {
    return (
        <div className="grain-overlay relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
            {/* Layer 1: Network constellation canvas */}
            <div className="absolute inset-0">
                <LoginCanvas />
            </div>

            {/* Layer 2: Aurora blobs — slow drifting gradient spheres */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    className="absolute top-[-15%] right-[-10%] w-[65%] h-[65%] bg-brand-blue/[0.04] blur-[220px] rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, x: [0, 25, 0], y: [0, -18, 0] }}
                    transition={{
                        opacity: { delay: 0.3, duration: 1.5 },
                        x: { duration: 25, repeat: Infinity, ease: 'easeInOut' },
                        y: { duration: 25, repeat: Infinity, ease: 'easeInOut' },
                    }}
                />
                <motion.div
                    className="absolute bottom-[-15%] left-[-10%] w-[55%] h-[55%] bg-brand-emerald/[0.03] blur-[200px] rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, x: [0, -20, 0], y: [0, 22, 0] }}
                    transition={{
                        opacity: { delay: 0.3, duration: 1.5 },
                        x: { duration: 30, repeat: Infinity, ease: 'easeInOut' },
                        y: { duration: 30, repeat: Infinity, ease: 'easeInOut' },
                    }}
                />
                <motion.div
                    className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-brand-violet/[0.025] blur-[180px] rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, x: [0, 12, 0], y: [0, -10, 0] }}
                    transition={{
                        opacity: { delay: 0.3, duration: 1.5 },
                        x: { duration: 22, repeat: Infinity, ease: 'easeInOut' },
                        y: { duration: 22, repeat: Infinity, ease: 'easeInOut' },
                    }}
                />
            </div>

            {/* Layer 3: Horizon line */}
            <div className="absolute inset-x-0 top-[58%] h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />

            {/* Layer 4: Drifting star dots */}
            {STARS.map((star, i) => (
                <motion.div
                    key={i}
                    aria-hidden="true"
                    className="absolute w-[2px] h-[2px] rounded-full bg-white/20"
                    style={{ left: star.left, top: star.top }}
                    animate={{
                        x: [0, 6 * (i % 2 === 0 ? 1 : -1), -3, 0],
                        y: [0, -10, -5, 0],
                        opacity: [0.08, 0.35, 0.15, 0.08],
                    }}
                    transition={{
                        duration: star.dur,
                        delay: star.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}

            {/* Content — split layout */}
            <div className="relative z-10 w-full max-w-[1300px] mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-[55%_45%] gap-8 lg:gap-12 items-center min-h-[80vh]">
                {/* LEFT: Branding + Hero Copy */}
                <div className="text-center lg:text-left">
                    {/* Badge — clip-reveal at 600ms */}
                    <motion.span
                        initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0 }}
                        animate={{ clipPath: 'inset(0 0% 0 0)', opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.8, ease: EASE_CIRC }}
                        className="inline-block text-xs font-semibold uppercase tracking-[0.3em] text-brand-blue rounded-full px-5 py-2 mb-8 gradient-border-animated"
                    >
                        Secure Access
                    </motion.span>

                    {/* Bold headline — blur-in at 800ms */}
                    <motion.h1 className="font-display headline-xl text-white mb-2">
                        <motion.span
                            className="font-bold block text-[2.25rem] sm:text-[3rem] md:text-[3.5rem] lg:text-[4.25rem]"
                            style={{ textShadow: '0 0 40px rgba(96,165,250,0.08)' }}
                            initial={{ opacity: 0, filter: 'blur(20px)', y: 30 }}
                            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                            transition={{ delay: 0.8, duration: 1.2, ease: EASE_OUT_EXPO }}
                        >
                            Welcome to
                        </motion.span>

                        {/* Serif headline — blur-in at 1000ms */}
                        <motion.span
                            className="font-serif italic block gradient-text-hero text-[2.5rem] sm:text-[3.5rem] md:text-[4rem] lg:text-[5rem] headline-xl"
                            style={{ textShadow: '0 0 60px rgba(96,165,250,0.1), 0 0 120px rgba(96,165,250,0.05)' }}
                            initial={{ opacity: 0, filter: 'blur(20px)', y: 30 }}
                            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                            transition={{ delay: 1.0, duration: 1.2, ease: EASE_OUT_EXPO }}
                        >
                            {BRAND.name}
                        </motion.span>
                    </motion.h1>

                    {/* Subheadline — fade-in at 1400ms */}
                    <motion.p
                        className="text-base md:text-lg text-white/50 max-w-md mx-auto lg:mx-0 leading-relaxed mt-5 mb-8"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.4, duration: 0.8, ease: EASE_OUT_EXPO }}
                    >
                        AI-powered forex analytics, multi-exchange equity research, and
                        institutional-grade pattern intelligence. Sign in to continue.
                    </motion.p>

                    {/* Feature items — staggered from 1800ms */}
                    <motion.div
                        className="space-y-3 mb-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.8, duration: 0.8 }}
                    >
                        {FEATURES.map((feat, i) => (
                            <motion.div
                                key={feat.text}
                                className="flex items-center gap-3 text-white/45 justify-center lg:justify-start"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.8 + i * 0.1, duration: 0.6, ease: EASE_OUT_EXPO }}
                            >
                                <div className="w-8 h-8 rounded-lg border border-brand-blue/[0.15] bg-brand-blue/[0.06] flex items-center justify-center flex-shrink-0">
                                    <feat.icon className="h-3.5 w-3.5 text-brand-blue/70" />
                                </div>
                                <span className="text-sm">{feat.text}</span>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Social proof — fades at 2400ms */}
                    <motion.p
                        className="text-[11px] text-white/25 uppercase tracking-[0.2em]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.4, duration: 1 }}
                    >
                        Free to start &middot; No credit card required
                    </motion.p>
                </div>

                {/* RIGHT: Login Form — scale-reveal at 600ms */}
                <motion.div
                    className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto"
                    initial={{ opacity: 0, scale: 0.92, filter: 'blur(12px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ delay: 0.6, duration: 1.2, ease: EASE_OUT_EXPO }}
                >
                    <LoginForm />
                </motion.div>
            </div>

            {/* Footer */}
            <motion.footer
                className="absolute bottom-0 inset-x-0 p-6 text-center text-[11px] text-white/20 uppercase tracking-widest z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.8, duration: 1 }}
            >
                &copy; {new Date().getFullYear()} {BRAND.fullName}
            </motion.footer>
        </div>
    );
}
