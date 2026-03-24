'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Loader2, Mail, KeyRound, ArrowLeft } from 'lucide-react';


export function LoginForm(): React.ReactElement {
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

    const handleEmailSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        if (!state.email || !state.email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        setState(prev => ({ ...prev, isLoading: true }));

        try {
            // Step 1: Check if user exists
            const checkResponse = await fetch('/api/auth/check-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: state.email.trim().toLowerCase() }),
            });

            if (!checkResponse.ok) {
                throw new Error('Failed to verify email');
            }

            const checkData = await checkResponse.json();

            if (checkData.userExists) {
                // User exists, request OTP immediately
                await requestOtp(state.email);
            } else {
                // User does not exist, move to registration step
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
        // Request OTP with registration details
        await requestOtp(state.email, state.firstName, state.lastName);
    };

    const requestOtp = async (email: string, firstName?: string, lastName?: string) => {
        try {
            const response = await fetch('/api/auth/request-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    first_name: firstName,
                    last_name: lastName
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send OTP');
            }

            toast.success('OTP sent to your email');
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
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: state.email.trim().toLowerCase(),
                    otp_code: state.otp
                }),
            });

            if (!response.ok) {
                throw new Error('Invalid OTP');
            }

            // No localStorage storage directly - rely on HttpOnly cookies

            toast.success('Login successful!');
            // Redirect to dashboard
            window.location.href = '/forex';
        } catch {
            toast.error('Invalid OTP. Please try again.');
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleBackToEmail = (): void => {
        setState(prev => ({ ...prev, step: 'email', otp: '' }));
    };

    const handleBackToRegister = (): void => {
        // If we go back from OTP during registration, we might want to go back to register or email
        // Simplest is back to email to restart flow or register if we want to change names
        // Let's go back to email to be safe and restart the check
        setState(prev => ({ ...prev, step: 'email', otp: '' }));
    };

    return (
        <Card className="w-full max-w-md border-slate-800/80 bg-slate-950/85 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold text-slate-50">
                    {state.step === 'email' ? 'Sign in to Market Signal' :
                        state.step === 'register' ? 'Complete Profile' : 'Enter OTP'}
                </CardTitle>
                <CardDescription className="text-slate-400">
                    {state.step === 'email'
                        ? 'We\'ll send you a one-time passcode to verify your identity.'
                        : state.step === 'register'
                            ? 'Please provide your details to create an account.'
                            : `Enter the 6-digit code sent to ${state.email}`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {state.step === 'email' && (
                    <motion.form
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onSubmit={handleEmailSubmit}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-200">Email address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={state.email}
                                    onChange={(e) => setState(prev => ({ ...prev, email: e.target.value }))}
                                    className="pl-10 bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
                                    disabled={state.isLoading}
                                    required
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-brand-blue to-brand-violet hover:opacity-90"
                            disabled={state.isLoading}
                        >
                            {state.isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Checking...
                                </>
                            ) : (
                                'Continue'
                            )}
                        </Button>
                    </motion.form>
                )}

                {state.step === 'register' && (
                    <motion.form
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onSubmit={handleRegisterSubmit}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-slate-200">First Name</Label>
                                <Input
                                    id="firstName"
                                    placeholder="John"
                                    value={state.firstName}
                                    onChange={(e) => setState(prev => ({ ...prev, firstName: e.target.value }))}
                                    className="bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
                                    disabled={state.isLoading}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-slate-200">Last Name</Label>
                                <Input
                                    id="lastName"
                                    placeholder="Doe"
                                    value={state.lastName}
                                    onChange={(e) => setState(prev => ({ ...prev, lastName: e.target.value }))}
                                    className="bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
                                    disabled={state.isLoading}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBackToRegister}
                                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                                disabled={state.isLoading}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-brand-blue to-brand-violet hover:opacity-90"
                                disabled={state.isLoading}
                            >
                                {state.isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending OTP...
                                    </>
                                ) : (
                                    'Register & Continue'
                                )}
                            </Button>
                        </div>
                    </motion.form>
                )}

                {state.step === 'otp' && (
                    <motion.form
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onSubmit={handleOTPSubmit}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <Label className="text-slate-200">One-time passcode</Label>
                            <div className="flex justify-center">
                                <InputOTP
                                    maxLength={6}
                                    value={state.otp}
                                    onChange={(value) => setState(prev => ({ ...prev, otp: value }))}
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} className="bg-slate-900/50 border-slate-700" />
                                        <InputOTPSlot index={1} className="bg-slate-900/50 border-slate-700" />
                                        <InputOTPSlot index={2} className="bg-slate-900/50 border-slate-700" />
                                        <InputOTPSlot index={3} className="bg-slate-900/50 border-slate-700" />
                                        <InputOTPSlot index={4} className="bg-slate-900/50 border-slate-700" />
                                        <InputOTPSlot index={5} className="bg-slate-900/50 border-slate-700" />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBackToEmail}
                                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                                disabled={state.isLoading}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-brand-blue to-brand-violet hover:opacity-90"
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
                                        Verify
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.form>
                )}
                <p className="mt-4 text-xs text-slate-500 text-center">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </CardContent>
        </Card>
    );
}
