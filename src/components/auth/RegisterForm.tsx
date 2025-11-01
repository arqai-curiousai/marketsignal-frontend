'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Scale, ArrowRight, RefreshCw, KeyRound } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils/cn';

// Validation schema
const otpVerificationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otpCode: z.string().min(6, 'OTP code must be 6 digits').max(6, 'OTP code must be 6 digits').regex(/^\d{6}$/, 'OTP code must contain only digits'),
});

type OTPVerificationData = z.infer<typeof otpVerificationSchema>;

interface OTPVerificationFormProps {
  className?: string;
  onSuccess?: () => void;
}

export function OTPVerificationForm({ className, onSuccess }: OTPVerificationFormProps) {
  const [formData, setFormData] = useState<OTPVerificationData>({
    email: '',
    otpCode: '',
  });
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof OTPVerificationData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);

  const { verifyOTP, requestOTP, error: authError, clearError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get email from URL params
  useEffect(() => {
    const email = searchParams.get('email');
    if (email) {
      setFormData(prev => ({ ...prev, email }));
    }
  }, [searchParams]);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Handle form input changes
  const handleInputChange = (field: keyof OTPVerificationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Clear auth error when user starts typing
    if (authError) {
      clearError();
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    try {
      otpVerificationSchema.parse(formData);
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof OTPVerificationData, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            errors[err.path[0] as keyof OTPVerificationData] = err.message;
          }
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await verifyOTP({
        email: formData.email,
        otpCode: formData.otpCode,
      });
      
      onSuccess?.();
    } catch (error) {
      console.error('OTP verification failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (!canResend || !formData.email) return;

    setIsResending(true);
    
    try {
      await requestOTP({ email: formData.email });
      setCanResend(false);
      setResendTimer(60);
      clearError();
    } catch (error) {
      console.error('Failed to resend OTP:', error);
    } finally {
      setIsResending(false);
    }
  };

  // Handle back to email entry
  const handleBackToEmail = () => {
    router.push('/login');
  };

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="flex justify-center mb-4"
          >
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-2xl shadow-purple-500/25">
              <Scale className="h-8 w-8 text-white" />
            </div>
          </motion.div>
          
          <h1 className="text-3xl font-light text-white tracking-tight">
            Verify Your Email
          </h1>
          <p className="text-purple-300/80">
            Enter the 6-digit code sent to {formData.email && (
              <span className="text-purple-200 font-medium">{formData.email}</span>
            )}
          </p>
        </div>

        {/* Auth Error */}
        <AnimatePresence>
          {authError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{authError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OTP Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field (readonly) */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-purple-200">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="bg-purple-950/30 border-purple-700/50 text-purple-200"
              disabled={true}
              readOnly
            />
          </div>

          {/* OTP Code Field */}
          <div className="space-y-2">
            <label htmlFor="otpCode" className="text-sm font-medium text-purple-200">
              Verification Code
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
              <Input
                id="otpCode"
                type="text"
                placeholder="Enter 6-digit code"
                value={formData.otpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  handleInputChange('otpCode', value);
                }}
                className={cn(
                  "pl-10 text-center text-lg font-mono tracking-widest",
                  validationErrors.otpCode && "border-red-500 focus:border-red-500"
                )}
                disabled={isSubmitting}
                autoComplete="one-time-code"
                maxLength={6}
              />
            </div>
            {validationErrors.otpCode && (
              <p className="text-sm text-red-400">{validationErrors.otpCode}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            loading={isSubmitting}
            disabled={isSubmitting || formData.otpCode.length !== 6}
          >
            {isSubmitting ? 'Verifying...' : 'Verify & Sign In'}
            {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </form>

        {/* Resend Section */}
        <div className="text-center pt-4 border-t border-purple-800/30 space-y-3">
          <p className="text-sm text-purple-300/80">
            Didn't receive the code?
          </p>
          
          {canResend ? (
            <Button
              variant="outline"
              onClick={handleResendOTP}
              disabled={isResending}
              loading={isResending}
              className="w-full"
            >
              {isResending ? 'Sending...' : 'Resend Code'}
              {!isResending && <RefreshCw className="ml-2 h-4 w-4" />}
            </Button>
          ) : (
            <p className="text-sm text-purple-400">
              Resend available in {resendTimer}s
            </p>
          )}
          
          <button
            type="button"
            onClick={handleBackToEmail}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            Use a different email address
          </button>
        </div>

        {/* Info Section */}
        <div className="text-center pt-4 border-t border-purple-800/30">
          <p className="text-xs text-purple-300/60">
            The verification code will expire in 10 minutes
          </p>
        </div>
      </motion.div>
    </div>
  );
} 