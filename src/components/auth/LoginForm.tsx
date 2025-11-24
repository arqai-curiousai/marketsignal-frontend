'use client';

import React, { useState } from 'react';
import type { FC, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, AlertCircle, ArrowRight, User, Phone, Briefcase, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// THEME TOKENS (Saffron / arthasarthi)
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
});

const OTP_THEME = getOtpFormTheme();

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const otpRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
});

type OTPRequestData = z.infer<typeof otpRequestSchema>;

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
  const [formData, setFormData] = useState<OTPRequestData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [userType, setUserType] = useState<'citizen' | 'ca'>('citizen');

  const [showOptionalFields, setShowOptionalFields] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof OTPRequestData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { requestOTP, error: authError, clearError } = useAuth();
  const router = useRouter();

  const handleInputChange = (field: keyof OTPRequestData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: '' }));
    }

    if (authError) {
      clearError();
    }
  };

  const validateForm = (): boolean => {
    try {
      otpRequestSchema.parse(formData);
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof OTPRequestData, string>> = {};
        error.errors.forEach((err) => {
          const pathKey = err.path[0];
          if (pathKey) {
            errors[pathKey as keyof OTPRequestData] = err.message;
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

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await requestOTP({
        email: formData.email,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        phone: formData.phone || undefined,
      });

      router.push(
        `/verify-otp?email=${encodeURIComponent(formData.email)}&userType=${userType}`,
      );
      onSuccess?.();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('OTP request failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn('mx-auto w-full max-w-md', className)}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="space-y-3 text-left">


          <h1
            className={cn(
              'text-xl font-semibold md:text-2xl',
              OTP_THEME.headingText,
            )}
          >
            Login with your work email
          </h1>
          <p
            className={cn(
              'text-xs md:text-sm',
              OTP_THEME.bodyText,
            )}
          >
            We&apos;ll send a one-time verification code to confirm your identity
            and device. No passwords to remember, no reset links.
          </p>
        </div>

        {/* Auth Error */}
        <AnimatePresence>
          {authError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                'flex items-center gap-3 rounded-xl p-3.5',
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
                {authError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Type Selection */}
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
              <span className="text-sm font-medium">Chartered Accountant</span>
              {userType === 'ca' && (
                <motion.div
                  layoutId="activeType"
                  className="absolute inset-0 rounded-xl border-2 border-orange-400/50"
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}
            </button>
          </div>
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
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>
            {validationErrors.email && (
              <p className="text-[11px] text-red-300 md:text-xs">
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Optional Fields Toggle */}
          <div className="text-left">
            <button
              type="button"
              onClick={() => setShowOptionalFields((prev) => !prev)}
              className={cn(
                'text-xs font-medium md:text-sm',
                OTP_THEME.toggleText,
              )}
            >
              {showOptionalFields ? 'Hide' : 'Show'} optional details for new
              users
            </button>
          </div>

          {/* Optional Fields */}
          <AnimatePresence initial={false}>
            {showOptionalFields && (
              <motion.div
                key="optional-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="firstName"
                      className="text-xs font-medium text-slate-200 md:text-sm"
                    >
                      First name
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
                        placeholder="Ankur"
                        value={formData.firstName ?? ''}
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
                        )}
                        disabled={isSubmitting}
                        autoComplete="given-name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="lastName"
                      className="text-xs font-medium text-slate-200 md:text-sm"
                    >
                      Last name
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
                        placeholder="Rajauria"
                        value={formData.lastName ?? ''}
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
                        )}
                        disabled={isSubmitting}
                        autoComplete="family-name"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="phone"
                    className="text-xs font-medium text-slate-200 md:text-sm"
                  >
                    Phone number (optional)
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
                      placeholder="For onboarding and support"
                      value={formData.phone ?? ''}
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
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending code…' : 'Send verification code'}
            {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
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
