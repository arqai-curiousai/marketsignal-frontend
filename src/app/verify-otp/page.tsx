'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, RefreshCw, ArrowRight, AlertCircle } from 'lucide-react';
import { authService } from '@/services/auth.service';
import type { OTPStatusResponse } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type OTPArray = [string, string, string, string, string, string];

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const masked =
    name.length <= 2 ? name[0] + '*' : name[0] + '*'.repeat(Math.max(1, name.length - 2)) + name.slice(-1);
  return `${masked}@${domain}`;
}

export default function VerifyOTPPage() {
  // Wrap the *client* reader of search params in Suspense to satisfy Next's CSR bailout rule
  return (
    <Suspense fallback={null}>
      <VerifyOTPClient />
    </Suspense>
  );
}

function VerifyOTPClient() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || '';

  const [otp, setOtp] = useState<OTPArray>(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState<number>(0);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!email) router.replace('/login');
  }, [email, router]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const code = useMemo(() => otp.join(''), [otp]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // single digit only
    const next = [...otp] as OTPArray;
    next[index] = value;
    setOtp(next);
    setError(null);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    const target = e.target as HTMLInputElement;
    const index = Number(target.dataset.index);
    if (e.key === 'Backspace' && !target.value && index > 0) {
      inputsRef.current[index - 1]?.focus();
      setOtp((curr) => {
        const n = [...curr] as OTPArray;
        n[index - 1] = '';
        return n;
      });
    }
    if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      await authService.verifyOTP({ email, otpCode: code }); // tokens stored in service
      router.replace('/chatbot'); // go to your home/dashboard
    } catch (err: any) {
      setError(err?.message || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (!email) return;
    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      const res: OTPStatusResponse = await authService.requestOTP({ email });
      setInfo(res.message || 'A new code has been sent');
      setResendIn(typeof res.canResendIn === 'number' ? res.canResendIn : 30);
      inputsRef.current[0]?.focus();
    } catch (err: any) {
      setError(err?.message || 'Could not resend code');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0a0118] via-indigo-950 to-[#100320] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-md mx-auto p-6"
      >
        <div className="backdrop-blur-xl bg-purple-950/30 border border-purple-700/50 rounded-2xl p-8 shadow-2xl shadow-purple-500/10">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="h-6 w-6 text-purple-300" />
            <h1 className="text-xl font-semibold text-white">Verify your email</h1>
          </div>

          <p className="text-sm text-purple-200/80 mb-6 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            We sent a 6-digit code to <span className="font-medium text-white">{maskEmail(email)}</span>
          </p>

          <form onSubmit={onSubmit}>
            <div className="grid grid-cols-6 gap-2 sm:gap-3 mb-4">
              {otp.map((val, i) => (
                <Input
                  id={`otp-${i}`}
                  key={i}
                  ref={(el: HTMLInputElement | null): void => {
                    inputsRef.current[i] = el;
                  }}
                  data-index={i}
                  value={val}
                  onChange={(e) => handleChange(i, e.target.value.replace(/\D/g, '').slice(-1))}
                  onKeyDown={handleKeyDown}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  aria-label={`Digit ${i + 1}`}
                  className="text-center text-lg tracking-widest"
                  variant="outline"
                />
              ))}
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-400 text-sm mb-3">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {info && <p className="text-sm text-emerald-300/90 mb-3">{info}</p>}

            <Button type="submit" disabled={submitting || code.length !== 6} className="w-full justify-center">
              {submitting ? 'Verifying…' : 'Verify & Continue'}
              {!submitting && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <button
              onClick={onResend}
              disabled={submitting || resendIn > 0}
              className="inline-flex items-center gap-2 text-purple-200/90 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              aria-disabled={submitting || resendIn > 0}
            >
              <RefreshCw className="h-4 w-4" />
              {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
            </button>

            <button onClick={() => router.push('/login')} className="text-purple-200/80 hover:text-white">
              Use a different email
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
