'use client';

import React, { useState } from 'react';
import type { FC, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, AlertCircle, ArrowRight, User, Phone, Briefcase, Users, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils/cn';
// important
// ============================================================================
// THEME TOKENS (Saffron / arthsarthi)
// ============================================================================

interface OtpFormThemeTokens {
    readonly badgeBorder: string;
    readonly badgeBg: string;
    readonly badgeText: string;
    readonly badgeIconBg: string;
    readonly badgeIconColor: string;
    readonly headingText: string;
    readonly bodyText: string;
    readonly inputBg: string;
    readonly inputBorder: string;
    readonly inputPlaceholder: string;
    readonly inputFocusBorder: string;
    readonly inputFocusRing: string;
    readonly inputIcon: string;
    readonly toggleText: string;
    readonly buttonGradient: string;
    readonly buttonHoverGradient: string;
    readonly buttonShadow: string;
    readonly errorBorder: string;
    readonly errorBg: string;
    readonly errorIcon: string;
    readonly errorText: string;
    readonly infoBorder: string;
    readonly infoText: string;
    readonly warningBorder: string;
    readonly warningBg: string;
    readonly warningText: string;
}

const getOtpFormTheme = (): OtpFormThemeTokens => ({
    badgeBorder: 'border-orange-400/45',
    badgeBg: 'bg-orange-500/12',
    badgeText: 'text-orange-100',
    badgeIconBg: 'bg-slate-950',
    badgeIconColor: 'text-amber-300',
    headingText: 'text-slate-50',
    bodyText: 'text-slate-400',
    inputBg: 'bg-slate-950/80',
    inputBorder: 'border-slate-700',
    inputPlaceholder: 'placeholder:text-slate-500',
    inputFocusBorder: 'focus:border-orange-400 focus:border-opacity-100',
    inputFocusRing: 'focus:ring-orange-500/45',
    inputIcon: 'text-amber-300',
    toggleText: 'text-orange-300 hover:text-orange-200',
    buttonGradient:
        'bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-300 text-slate-950',
    buttonHoverGradient:
        'hover:from-orange-300 hover:via-amber-200 hover:to-yellow-200',
    buttonShadow: 'shadow-[0_0_18px_rgba(249,115,22,0.45)]',
    errorBorder: 'border-red-500/40',
    errorBg: 'bg-red-500/10',
    errorIcon: 'text-red-400',
    errorText: 'text-red-200',
    infoBorder: 'border-slate-800/70',
    infoText: 'text-slate-500',
    warningBorder: 'border-amber-500/40',
    warningBg: 'bg-amber-500/10',
    warningText: 'text-amber-200',
});

const OTP_THEME = getOtpFormTheme();

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

// Schema for existing users (email only)
const existingUserSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

// Schema for new users (all required fields)
const newUserSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    dateOfBirth: z.string().refine((date) => {
        const dob = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())
            ? age - 1
            : age;
        return actualAge >= 13;
    }, 'You must be at least 13 years old'),
    phone: z.string().optional(),
});

type NewUserData = z.infer<typeof newUserSchema>;
type ExistingUserData = z.infer<typeof existingUserSchema>;

interface OTPRequestFormProps {
    readonly className?: string;
    readonly onSuccess?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const OTPRequestForm: FC<OTPRequestFormProps> = ({
    className,
    onSuccess,
}) => {
    const [formData, setFormData] = useState<NewUserData>({
        email: '',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        phone: '',
    });
    const [userType, setUserType] = useState<'citizen' | 'ca'>('citizen');

    // New state to track if user exists
    const [userExists, setUserExists] = useState<boolean | null>(null);
    const [isCheckingEmail, setIsCheckingEmail] = useState<boolean>(false);
    const [emailChecked, setEmailChecked] = useState<boolean>(false);

    const [validationErrors, setValidationErrors] = useState<
        Partial<Record<keyof NewUserData, string>>
    >({});
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const { requestOTP, error: authError, clearError } = useAuth();
    const router = useRouter();

    const handleInputChange = (field: keyof NewUserData, value: string): void => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        if (validationErrors[field]) {
            setValidationErrors((prev) => ({ ...prev, [field]: '' }));
        }

        if (authError) {
            clearError();
        }

        if (errorMessage) {
            setErrorMessage('');
        }

        // Reset email check status if email changes
        if (field === 'email') {
            setEmailChecked(false);
            setUserExists(null);
        }
    };

    // Check if email exists
    const checkEmailExists = async (): Promise<void> => {
        if (!formData.email) {
            setValidationErrors({ email: 'Please enter your email address' });
            return;
        }

        // Validate email format
        try {
            z.string().email().parse(formData.email);
        } catch {
            setValidationErrors({ email: 'Please enter a valid email address' });
            return;
        }

        setIsCheckingEmail(true);
        setErrorMessage('');

        try {
            const response = await fetch('/api/auth/check-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: formData.email }),
            });

            if (response.ok) {
                const data = await response.json();
                setUserExists(data.user_exists);
                setEmailChecked(true);
            } else {
                setErrorMessage('Failed to verify email. Please try again.');
            }
        } catch (error) {
            console.error('Email check failed:', error);
            setErrorMessage('Network error. Please check your connection.');
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const validateForm = (): boolean => {
        try {
            if (userExists) {
                // Existing user - only email required
                existingUserSchema.parse({ email: formData.email });
            } else {
                // New user - all fields required
                newUserSchema.parse(formData);
            }
            setValidationErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors: Partial<Record<keyof NewUserData, string>> = {};
                error.errors.forEach((err) => {
                    const pathKey = err.path[0];
                    if (pathKey) {
                        errors[pathKey as keyof NewUserData] = err.message;
                    }
                });
                setValidationErrors(errors);
            }
            return false;
        }
    };

    const handleSubmit = async (
        e: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        e.preventDefault();

        // First check email if not checked
        if (!emailChecked) {
            await checkEmailExists();
            return;
        }

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const payload: any = {
                email: formData.email,
            };

            // Only include registration fields for new users
            if (!userExists) {
                payload.first_name = formData.firstName;
                payload.last_name = formData.lastName;
                payload.date_of_birth = formData.dateOfBirth;
                if (formData.phone) {
                    payload.phone = formData.phone;
                }
            }

            const response = await fetch('/api/auth/request-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to send OTP');
            }

            router.push(
                `/verify-otp?email=${encodeURIComponent(formData.email)}&userType=${userType}`,
            );
            onSuccess?.();
        } catch (error: any) {
            console.error('OTP request failed:', error);

            // Parse backend error messages
            if (error?.response?.data?.detail) {
                setErrorMessage(error.response.data.detail);
            } else if (error?.message) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage('Failed to send OTP. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = (): void => {
        setEmailChecked(false);
        setUserExists(null);
        setFormData({
            email: formData.email, // Keep email
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            phone: '',
        });
        setValidationErrors({});
        setErrorMessage('');
    };

    return (
        <div className={cn('mx-auto w-full max-w-md', className)}>
            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
            >
                {/* Auth Error or Custom Error */}
                <AnimatePresence>
                    {(authError || errorMessage) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={cn(
                                'flex items-center gap-3 rounded-xl border p-3.5',
                                OTP_THEME.errorBorder,
                                OTP_THEME.errorBg,
                            )}
                        >
                            <AlertCircle
                                className={cn(
                                    'h-5 w-5 flex-shrink-0',
                                    OTP_THEME.errorIcon,
                                )}
                            />
                            <p
                                className={cn(
                                    'text-xs md:text-sm',
                                    OTP_THEME.errorText,
                                )}
                            >
                                {authError || errorMessage}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* User Status Info */}
                <AnimatePresence>
                    {emailChecked && userExists !== null && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={cn(
                                'flex items-start gap-3 rounded-xl border p-3.5',
                                userExists ? OTP_THEME.infoBorder : OTP_THEME.warningBorder,
                                userExists ? 'bg-slate-900/50' : OTP_THEME.warningBg,
                            )}
                        >
                            <div className="flex-1">
                                <p
                                    className={cn(
                                        'text-xs font-medium md:text-sm',
                                        userExists ? 'text-slate-200' : OTP_THEME.warningText,
                                    )}
                                >
                                    {userExists ? (
                                        <>✓ Welcome back! We'll send an OTP to your email.</>
                                    ) : (
                                        <>📝 New user detected! Please complete your registration details below.</>
                                    )}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-xs text-orange-300 hover:text-orange-200"
                            >
                                Change email
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* User Type Selection - Only show before email is checked */}
                    {!emailChecked && (
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setUserType('citizen')}
                                className={cn(
                                    'relative flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all duration-200',
                                    userType === 'citizen'
                                        ? 'border-orange-400/50 bg-orange-500/10 text-orange-100'
                                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:bg-slate-900',
                                )}
                            >
                                <Users className={cn("h-6 w-6", userType === 'citizen' ? "text-orange-400" : "text-slate-500")} />
                                <span className="text-sm font-medium">Citizen</span>
                                {userType === 'citizen' && (
                                    <motion.div
                                        layoutId="activeType"
                                        className="absolute inset-0 rounded-xl border-2 border-orange-400/50"
                                        transition={{ type: 'spring', duration: 0.5 }}
                                    />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setUserType('ca')}
                                className={cn(
                                    'relative flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all duration-200',
                                    userType === 'ca'
                                        ? 'border-orange-400/50 bg-orange-500/10 text-orange-100'
                                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:bg-slate-900',
                                )}
                            >
                                <Briefcase className={cn("h-6 w-6", userType === 'ca' ? "text-orange-400" : "text-slate-500")} />
                                <span className="text-sm font-medium">CA / Lawyer</span>
                                {userType === 'ca' && (
                                    <motion.div
                                        layoutId="activeType"
                                        className="absolute inset-0 rounded-xl border-2 border-orange-400/50"
                                        transition={{ type: 'spring', duration: 0.5 }}
                                    />
                                )}
                            </button>
                        </div>
                    )}

                    {/* Email Field */}
                    <div className="space-y-2">
                        <label
                            htmlFor="email"
                            className="text-xs font-medium text-slate-200 md:text-sm"
                        >
                            Work email address
                        </label>
                        <div className="relative">
                            <Mail
                                className={cn(
                                    'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                                    OTP_THEME.inputIcon,
                                )}
                            />
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@firm.com"
                                value={formData.email}
                                onChange={(event) =>
                                    handleInputChange('email', event.target.value)
                                }
                                className={cn(
                                    'pl-9 text-slate-100',
                                    OTP_THEME.inputBg,
                                    OTP_THEME.inputBorder,
                                    OTP_THEME.inputPlaceholder,
                                    OTP_THEME.inputFocusBorder,
                                    OTP_THEME.inputFocusRing,
                                    validationErrors.email &&
                                    'border-red-500 focus:border-red-500 focus:ring-red-500/40',
                                )}
                                disabled={isSubmitting || emailChecked}
                                autoComplete="email"
                                onBlur={() => {
                                    if (formData.email && !emailChecked) {
                                        // Auto-check email on blur if not already checked
                                        checkEmailExists();
                                    }
                                }}
                            />
                        </div>
                        {validationErrors.email && (
                            <p className="text-[11px] text-red-300 md:text-xs">
                                {validationErrors.email}
                            </p>
                        )}
                    </div>

                    {/* Registration Fields for New Users */}
                    <AnimatePresence>
                        {emailChecked && !userExists && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {/* First Name */}
                                    <div className="space-y-2">
                                        <label
                                            htmlFor="firstName"
                                            className="text-xs font-medium text-slate-200 md:text-sm"
                                        >
                                            First name <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <User
                                                className={cn(
                                                    'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                                                    OTP_THEME.inputIcon,
                                                )}
                                            />
                                            <Input
                                                id="firstName"
                                                type="text"
                                                placeholder="Rishi"
                                                value={formData.firstName}
                                                onChange={(event) =>
                                                    handleInputChange('firstName', event.target.value)
                                                }
                                                className={cn(
                                                    'pl-9 text-slate-100',
                                                    OTP_THEME.inputBg,
                                                    OTP_THEME.inputBorder,
                                                    OTP_THEME.inputPlaceholder,
                                                    OTP_THEME.inputFocusBorder,
                                                    OTP_THEME.inputFocusRing,
                                                    validationErrors.firstName &&
                                                    'border-red-500 focus:border-red-500 focus:ring-red-500/40',
                                                )}
                                                disabled={isSubmitting}
                                                autoComplete="given-name"
                                            />
                                        </div>
                                        {validationErrors.firstName && (
                                            <p className="text-[11px] text-red-300 md:text-xs">
                                                {validationErrors.firstName}
                                            </p>
                                        )}
                                    </div>

                                    {/* Last Name */}
                                    <div className="space-y-2">
                                        <label
                                            htmlFor="lastName"
                                            className="text-xs font-medium text-slate-200 md:text-sm"
                                        >
                                            Last name <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <User
                                                className={cn(
                                                    'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                                                    OTP_THEME.inputIcon,
                                                )}
                                            />
                                            <Input
                                                id="lastName"
                                                type="text"
                                                placeholder="Vyas"
                                                value={formData.lastName}
                                                onChange={(event) =>
                                                    handleInputChange('lastName', event.target.value)
                                                }
                                                className={cn(
                                                    'pl-9 text-slate-100',
                                                    OTP_THEME.inputBg,
                                                    OTP_THEME.inputBorder,
                                                    OTP_THEME.inputPlaceholder,
                                                    OTP_THEME.inputFocusBorder,
                                                    OTP_THEME.inputFocusRing,
                                                    validationErrors.lastName &&
                                                    'border-red-500 focus:border-red-500 focus:ring-red-500/40',
                                                )}
                                                disabled={isSubmitting}
                                                autoComplete="family-name"
                                            />
                                        </div>
                                        {validationErrors.lastName && (
                                            <p className="text-[11px] text-red-300 md:text-xs">
                                                {validationErrors.lastName}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Date of Birth */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="dateOfBirth"
                                        className="text-xs font-medium text-slate-200 md:text-sm"
                                    >
                                        Date of birth <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar
                                            className={cn(
                                                'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                                                OTP_THEME.inputIcon,
                                            )}
                                        />
                                        <Input
                                            id="dateOfBirth"
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={(event) =>
                                                handleInputChange('dateOfBirth', event.target.value)
                                            }
                                            max={new Date().toISOString().split('T')[0]}
                                            className={cn(
                                                'pl-9 text-slate-100',
                                                OTP_THEME.inputBg,
                                                OTP_THEME.inputBorder,
                                                OTP_THEME.inputPlaceholder,
                                                OTP_THEME.inputFocusBorder,
                                                OTP_THEME.inputFocusRing,
                                                validationErrors.dateOfBirth &&
                                                'border-red-500 focus:border-red-500 focus:ring-red-500/40',
                                            )}
                                            disabled={isSubmitting}
                                            autoComplete="bday"
                                        />
                                    </div>
                                    {validationErrors.dateOfBirth && (
                                        <p className="text-[11px] text-red-300 md:text-xs">
                                            {validationErrors.dateOfBirth}
                                        </p>
                                    )}
                                </div>

                                {/* Phone Number (Optional) */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="phone"
                                        className="text-xs font-medium text-slate-200 md:text-sm"
                                    >
                                        Phone number <span className="text-slate-500">(optional)</span>
                                    </label>
                                    <div className="relative">
                                        <Phone
                                            className={cn(
                                                'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                                                OTP_THEME.inputIcon,
                                            )}
                                        />
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="+91 98765 43210"
                                            value={formData.phone}
                                            onChange={(event) =>
                                                handleInputChange('phone', event.target.value)
                                            }
                                            className={cn(
                                                'pl-9 text-slate-100',
                                                OTP_THEME.inputBg,
                                                OTP_THEME.inputBorder,
                                                OTP_THEME.inputPlaceholder,
                                                OTP_THEME.inputFocusBorder,
                                                OTP_THEME.inputFocusRing,
                                            )}
                                            disabled={isSubmitting}
                                            autoComplete="tel"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className={cn(
                            'w-full font-semibold',
                            OTP_THEME.buttonGradient,
                            OTP_THEME.buttonHoverGradient,
                            OTP_THEME.buttonShadow,
                        )}
                        loading={isSubmitting || isCheckingEmail}
                        disabled={isSubmitting || isCheckingEmail}
                    >
                        {isCheckingEmail ? (
                            'Checking email...'
                        ) : isSubmitting ? (
                            'Sending code…'
                        ) : !emailChecked ? (
                            'Continue'
                        ) : (
                            'Send verification code'
                        )}
                        {!isSubmitting && !isCheckingEmail && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                </form>

                {/* Info Section */}
                <div
                    className={cn(
                        'border-t pt-4 text-left',
                        OTP_THEME.infoBorder,
                    )}
                >
                    <p
                        className={cn(
                            'text-[11px] md:text-xs',
                            OTP_THEME.infoText,
                        )}
                    >
                        You&apos;ll receive a 6-digit verification code at your email. Using
                        arthasarthi implies you are authorised to access your organisation&apos;s
                        governed workspace.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
