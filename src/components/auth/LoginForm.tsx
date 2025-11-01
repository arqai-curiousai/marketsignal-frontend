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
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof OTPRequestData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { requestOTP, error: authError, clearError } = useAuth();
  const router = useRouter();

  // Handle form input changes
  const handleInputChange = (field: keyof OTPRequestData, value: string) => {
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
      otpRequestSchema.parse(formData);
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof OTPRequestData, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            errors[err.path[0] as keyof OTPRequestData] = err.message;
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
      await requestOTP({
        email: formData.email,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        phone: formData.phone || undefined,
      });
      
      // Navigate to verification page
      router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
      onSuccess?.();
    } catch (error) {
      console.error('OTP request failed:', error);
    } finally {
      setIsSubmitting(false);
    }
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
            Sign In
          </h1>
          <p className="text-purple-300/80">
            Enter your email to receive a verification code
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

        {/* OTP Request Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-purple-200">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={cn(
                  "pl-10",
                  validationErrors.email && "border-red-500 focus:border-red-500"
                )}
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>
            {validationErrors.email && (
              <p className="text-sm text-red-400">{validationErrors.email}</p>
            )}
          </div>

          {/* Optional Fields Toggle */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              {showOptionalFields ? 'Hide' : 'Show'} optional fields for new users
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium text-purple-200">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="pl-10"
                        disabled={isSubmitting}
                        autoComplete="given-name"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium text-purple-200">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="pl-10"
                        disabled={isSubmitting}
                        autoComplete="family-name"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-purple-200">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="pl-10"
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
            className="w-full"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending Code...' : 'Send Verification Code'}
            {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </form>

        {/* Info Section */}
        <div className="text-center pt-4 border-t border-purple-800/30">
          <p className="text-sm text-purple-300/80">
            We'll send a 6-digit verification code to your email
          </p>
        </div>
      </motion.div>
    </div>
  );
} 