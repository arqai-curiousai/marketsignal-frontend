'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Loader2, Mail, KeyRound, ArrowLeft, ArrowRight, UserPlus } from 'lucide-react';
import { apiClient } from '@/lib/api/apiClient';

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ── Step indicator ── */
function StepIndicator({ step }: { readonly step: 'email' | 'register' | 'otp' }) {
    const steps = [
        { key: 'email', label: 'Email' },
        { key: 'register', label: 'Profile' },
        { key: 'otp', label: 'Verify' },
    ];
    const activeIdx = step === 'email' ? 0 : step === 'register' ? 1 : 2;

    return (
        <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((s, i) => {
                // Skip register step indicator if we go directly email→otp
                const isActive = i === activeIdx;
                const isPast = i < activeIdx;
                return (
                    <React.Fragment key={s.key}>
                        {i > 0 && (
                            <div
                                className={`h-px w-6 transition-colors duration-500 ${
                                    isPast ? 'bg-brand-blue/50' : 'bg-white/[0.06]'
                                }`}
                            />
                        )}
                        <div className="flex items-center gap-1.5">
                            <div
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                                    isActive
                                        ? 'bg-brand-blue shadow-[0_0_8px_rgba(96,165,250,0.6)]'
                                        : isPast
                                          ? 'bg-brand-blue/50'
                                          : 'bg-white/10'
                                }`}
                            />
                            <span
                                className={`text-[10px] uppercase tracking-[0.15em] transition-colors duration-500 ${
                                    isActive ? 'text-white/60' : 'text-white/20'
                                }`}
                            >
                                {s.label}
                            </span>
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );
}

/* ── Slide variants ── */
const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0, filter: 'blur(4px)' }),
    center: { x: 0, opacity: 1, filter: 'blur(0px)' },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0, filter: 'blur(4px)' }),
};

export function LoginForm(): React.ReactElement {
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('from');

    const [state, setState] = useState<{
        email: string;
        firstName: string;
        lastName: string;
        otp: string;
        step: 'email' | 'register' | 'otp';
        isLoading: boolean;
        userExists: boolean;
    }>({
        email: '',
        firstName: '',
        lastName: '',
        otp: '',
        step: 'email',
        isLoading: false,
        userExists: false,
    });

    // Track direction for slide animation
    const [direction, setDirection] = useState(1);

    const handleEmailSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        const email = state.email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || email.length > 254 || !emailRegex.test(email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const result = await apiClient.post<{ userExists: boolean }>('/api/auth/check-email', {
                email: state.email.trim().toLowerCase(),
            });

            if (!result.success) {
                throw new Error('Failed to verify email');
            }

            if (result.data.userExists) {
                await requestOtp(state.email);
            } else {
                setDirection(1);
                setState(prev => ({
                    ...prev,
                    step: 'register',
                    isLoading: false,
                    userExists: false
                }));
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to verify email. Please try again.');
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        if (!state.firstName || !state.lastName) {
            toast.error('Please enter your full name');
            return;
        }

        setState(prev => ({ ...prev, isLoading: true }));
        await requestOtp(state.email, state.firstName, state.lastName);
    };

    const requestOtp = async (email: string, firstName?: string, lastName?: string) => {
        try {
            const result = await apiClient.post('/api/auth/request-otp', {
                email: email.trim().toLowerCase(),
                first_name: firstName,
                last_name: lastName,
            });

            if (!result.success) {
                throw new Error('Failed to send OTP');
            }

            toast.success('OTP sent to your email');
            setDirection(1);
            setState(prev => ({ ...prev, step: 'otp', isLoading: false }));
        } catch {
            toast.error('Failed to send OTP. Please try again.');
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleOTPSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        if (state.otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const result = await apiClient.post('/api/auth/verify-otp', {
                email: state.email.trim().toLowerCase(),
                otp_code: state.otp,
            });

            if (!result.success) {
                throw new Error('Invalid OTP');
            }

            toast.success('Login successful!');
            const destination = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/signals';
            window.location.href = destination;
        } catch {
            toast.error('Invalid OTP. Please try again.');
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleBack = (): void => {
        setDirection(-1);
        setState(prev => ({ ...prev, step: 'email', otp: '' }));
    };

    const stepTitle =
        state.step === 'email'
            ? 'Sign In'
            : state.step === 'register'
              ? 'Create Account'
              : 'Verify Identity';

    const stepDescription =
        state.step === 'email'
            ? 'Enter your email to receive a one-time passcode.'
            : state.step === 'register'
              ? 'Tell us your name to set up your account.'
              : `Enter the 6-digit code sent to ${state.email}`;

    return (
        <div className="login-glass-card rounded-2xl p-px">
            <div className="rounded-2xl bg-white/[0.02] backdrop-blur-xl p-8 md:p-10">
                {/* Header */}
                <div className="mb-8">
                    <StepIndicator step={state.step} />

                    <motion.h2
                        key={stepTitle}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                        className="text-2xl font-bold text-white text-center"
                        style={{ textShadow: '0 0 30px rgba(96,165,250,0.06)' }}
                    >
                        {stepTitle}
                    </motion.h2>
                    <motion.p
                        key={stepDescription}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="text-sm text-white/40 text-center mt-2"
                    >
                        {stepDescription}
                    </motion.p>
                </div>

                {/* Forms with animated transitions */}
                <AnimatePresence mode="wait" custom={direction}>
                    {state.step === 'email' && (
                        <motion.form
                            key="email"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                            onSubmit={handleEmailSubmit}
                            className="space-y-5"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[11px] text-white/40 uppercase tracking-[0.15em]">
                                    Email address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={state.email}
                                        onChange={(e) => setState(prev => ({ ...prev, email: e.target.value }))}
                                        className="pl-11 h-12 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 rounded-xl focus:border-brand-blue/40 focus:ring-brand-blue/20 transition-all"
                                        disabled={state.isLoading}
                                        required
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-12 bg-brand-blue text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(96,165,250,0.2)] hover:shadow-[0_0_40px_rgba(96,165,250,0.3)] hover:opacity-90 transition-all btn-shimmer"
                                disabled={state.isLoading}
                            >
                                {state.isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Checking...
                                    </>
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </motion.form>
                    )}

                    {state.step === 'register' && (
                        <motion.form
                            key="register"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                            onSubmit={handleRegisterSubmit}
                            className="space-y-5"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-[11px] text-white/40 uppercase tracking-[0.15em]">
                                        First Name
                                    </Label>
                                    <Input
                                        id="firstName"
                                        placeholder="John"
                                        value={state.firstName}
                                        onChange={(e) => setState(prev => ({ ...prev, firstName: e.target.value }))}
                                        className="h-12 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 rounded-xl focus:border-brand-blue/40 focus:ring-brand-blue/20 transition-all"
                                        disabled={state.isLoading}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-[11px] text-white/40 uppercase tracking-[0.15em]">
                                        Last Name
                                    </Label>
                                    <Input
                                        id="lastName"
                                        placeholder="Doe"
                                        value={state.lastName}
                                        onChange={(e) => setState(prev => ({ ...prev, lastName: e.target.value }))}
                                        className="h-12 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 rounded-xl focus:border-brand-blue/40 focus:ring-brand-blue/20 transition-all"
                                        disabled={state.isLoading}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                    className="flex-1 h-12 border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/[0.05] hover:border-white/[0.12] hover:text-white/70 rounded-xl transition-all"
                                    disabled={state.isLoading}
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 h-12 bg-brand-blue text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(96,165,250,0.2)] hover:shadow-[0_0_40px_rgba(96,165,250,0.3)] hover:opacity-90 transition-all btn-shimmer"
                                    disabled={state.isLoading}
                                >
                                    {state.isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Continue
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.form>
                    )}

                    {state.step === 'otp' && (
                        <motion.form
                            key="otp"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                            onSubmit={handleOTPSubmit}
                            className="space-y-5"
                        >
                            <div className="space-y-3">
                                <Label className="text-[11px] text-white/40 uppercase tracking-[0.15em] block text-center" htmlFor="otp-input">
                                    One-time passcode
                                </Label>
                                <div className="flex justify-center">
                                    <InputOTP
                                        id="otp-input"
                                        maxLength={6}
                                        value={state.otp}
                                        onChange={(value) => setState(prev => ({ ...prev, otp: value }))}
                                    >
                                        <InputOTPGroup>
                                            {[0, 1, 2, 3, 4, 5].map((idx) => (
                                                <InputOTPSlot
                                                    key={idx}
                                                    index={idx}
                                                    className="w-11 h-13 bg-white/[0.03] border-white/[0.08] text-white text-lg rounded-lg focus:border-brand-blue/50 focus:ring-brand-blue/20"
                                                />
                                            ))}
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                    className="flex-1 h-12 border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/[0.05] hover:border-white/[0.12] hover:text-white/70 rounded-xl transition-all"
                                    disabled={state.isLoading}
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 h-12 bg-brand-blue text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(96,165,250,0.2)] hover:shadow-[0_0_40px_rgba(96,165,250,0.3)] hover:opacity-90 transition-all btn-shimmer"
                                    disabled={state.isLoading || state.otp.length !== 6}
                                >
                                    {state.isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <KeyRound className="mr-2 h-4 w-4" />
                                            Verify &amp; Enter
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>

                {/* Footer */}
                <motion.p
                    className="mt-6 text-[10px] text-white/20 text-center uppercase tracking-[0.15em]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                >
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </motion.p>
            </div>
        </div>
    );
}
