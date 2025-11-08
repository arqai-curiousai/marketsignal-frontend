'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, AlertCircle, Scale, ArrowRight, User, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils/cn';

// Validation schema
const otpRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
});

type OTPRequestData = z.infer<typeof otpRequestSchema>;

interface OTPRequestFormProps {
  className?: string;
  onSuccess?: () => void;
}

export function OTPRequestForm({ className, onSuccess }: OTPRequestFormProps) {
  const [formData, setFormData] = useState<OTPRequestData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof OTPRequestData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { requestOTP, error: authError, clearError } = useAuth();
  const router = useRouter();

  const handleInputChange = (field: keyof OTPRequestData, value: string) => {
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
          if (err.path[0]) {
            errors[err.path[0] as keyof OTPRequestData] = err.message;
          }
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

      router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
      onSuccess?.();
    } catch (error) {
      console.error('OTP request failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="space-y-3 text-left">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="mb-2 inline-flex items-center gap-3 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950">
              <Scale className="h-4 w-4 text-emerald-300" />
            </div>
            <span className="text-[11px] font-medium text-emerald-100">
              Secure OTP login for legal teams
            </span>
          </motion.div>

          <h1 className="text-xl font-semibold text-slate-50 md:text-2xl">
            Login with your work email
          </h1>
          <p className="text-xs text-slate-400 md:text-sm">
            We&apos;ll send a one-time verification code to confirm your identity and
            device. No passwords to remember, no reset links.
          </p>
        </div>

        {/* Auth Error */}
        <AnimatePresence>
          {authError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-3.5"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
              <p className="text-xs text-red-200 md:text-sm">{authError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-xs font-medium text-slate-200 md:text-sm"
            >
              Work email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300" />
              <Input
                id="email"
                type="email"
                placeholder="you@firm.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={cn(
                  'pl-9 bg-slate-950/80 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-500/40',
                  validationErrors.email &&
                    'border-red-500 focus:border-red-500 focus:ring-red-500/40'
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
              className="text-xs font-medium text-emerald-300 hover:text-emerald-200 md:text-sm"
            >
              {showOptionalFields ? 'Hide' : 'Show'} optional details for new users
            </button>
          </div>

          {/* Optional Fields */}
          <AnimatePresence>
            {showOptionalFields && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
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
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Ankur"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange('firstName', e.target.value)
                        }
                        className="pl-9 bg-slate-950/80 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-500/40"
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
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300" />
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Rajauria"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange('lastName', e.target.value)
                        }
                        className="pl-9 bg-slate-950/80 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-500/40"
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
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="For onboarding and support"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange('phone', e.target.value)
                      }
                      className="pl-9 bg-slate-950/80 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-500/40"
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
            className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending code…' : 'Send verification code'}
            {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </form>

        {/* Info Section */}
        <div className="border-t border-slate-800/60 pt-4 text-left">
          <p className="text-[11px] text-slate-500 md:text-xs">
            You&apos;ll receive a 6-digit verification code at your email. Using the
            co-pilot implies you are authorised to access your organisation&apos;s
            workspace.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
