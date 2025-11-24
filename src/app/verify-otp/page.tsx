'use client';

import React, {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  FC,
  FormEventHandler,
  KeyboardEventHandler,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Mail,
  RefreshCw,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { OTPStatusResponse } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils/cn';

type OTPArray = [string, string, string, string, string, string];

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const visibleStart = name[0] ?? '';
  const visibleEnd = name.length > 1 ? name.slice(-1) : '';
  const starsCount = Math.max(1, Math.max(0, name.length - 2));
  const masked = `${visibleStart}${'*'.repeat(starsCount)}${visibleEnd}`;
  return `${masked}@${domain}`;
}

/* ------------------------------------------------------------------ */
/* Theme tokens                                                       */
/* ------------------------------------------------------------------ */

interface VerifyOtpThemeTokens {
  readonly pageBackground: string;
  readonly glowTop: string;
  readonly glowBottom: string;
  readonly radialOverlay: string;
  readonly cardBorder: string;
  readonly cardBackground: string;
  readonly cardShadow: string;
  readonly titleText: string;
  readonly subtitleText: string;
  readonly accentIcon: string;
  readonly accentMailIcon: string;
  readonly emailHighlight: string;
  readonly inputBase: string;
  readonly inputBorder: string;
  readonly inputFocusBorder: string;
  readonly inputFocusRing: string;
  readonly inputText: string;
  readonly inputPlaceholder: string;
  readonly buttonGradient: string;
  readonly buttonHoverGradient: string;
  readonly buttonShadow: string;
  readonly buttonDisabled: string;
  readonly errorText: string;
  readonly errorIcon: string;
  readonly infoText: string;
  readonly resendLink: string;
  readonly resendDisabled: string;
  readonly secondaryLink: string;
}

const getVerifyOtpTheme = (): VerifyOtpThemeTokens => ({
  pageBackground:
    'bg-[radial-gradient(circle_at_top,_#050308,_#020617)]',
  glowTop: 'bg-orange-500/16',
  glowBottom: 'bg-amber-400/14',
  radialOverlay:
    'bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.7),_transparent_70%)]',
  cardBorder: 'border-slate-800/80',
  cardBackground: 'bg-slate-950/90',
  cardShadow: 'shadow-[0_28px_70px_rgba(0,0,0,0.85)]',
  titleText: 'text-slate-50',
  subtitleText: 'text-slate-300',
  accentIcon: 'text-amber-300',
  accentMailIcon: 'text-orange-300',
  emailHighlight: 'text-orange-100',
  inputBase: 'bg-slate-950/85',
  inputBorder: 'border-slate-700',
  inputFocusBorder: 'focus:border-orange-400',
  inputFocusRing: 'focus:ring-orange-500/45',
  inputText: 'text-slate-100',
  inputPlaceholder: 'placeholder:text-slate-500',
  buttonGradient:
    'bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-300',
  buttonHoverGradient:
    'hover:from-orange-300 hover:via-amber-200 hover:to-yellow-200',
  buttonShadow: 'shadow-[0_0_18px_rgba(249,115,22,0.45)]',
  buttonDisabled:
    'disabled:opacity-50 disabled:cursor-not-allowed',
  errorText: 'text-red-300',
  errorIcon: 'text-red-400',
  infoText: 'text-emerald-300/90',
  resendLink:
    'text-orange-200/90 hover:text-orange-100',
  resendDisabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
  secondaryLink:
    'text-slate-300 hover:text-slate-50',
});

const VERIFY_OTP_THEME = getVerifyOtpTheme();

/* ------------------------------------------------------------------ */
/* Outer wrapper with Suspense to read search params on client        */
/* ------------------------------------------------------------------ */

const VerifyOTPPage: FC = () => {
  return (
    <Suspense fallback={null}>
      <VerifyOTPClient />
    </Suspense>
  );
};

export default VerifyOTPPage;

/* ------------------------------------------------------------------ */
/* Client component                                                   */
/* ------------------------------------------------------------------ */

const VerifyOTPClient: FC = () => {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') ?? '';
  const userType = params.get('userType') ?? 'citizen';
  const { verifyOTP, requestOTP } = useAuth();

  const [otp, setOtp] = useState<OTPArray>([
    '',
    '',
    '',
    '',
    '',
    '',
  ]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState<number>(0);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!email) {
      router.replace('/login');
    }
  }, [email, router]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timerId = window.setInterval(() => {
      setResendIn((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [resendIn]);

  const code = useMemo<string>(() => otp.join(''), [otp]);

  const handleChange = (index: number, value: string): void => {
    if (!/^\d?$/.test(value)) return; // allow a single digit or empty

    const next: OTPArray = [...otp] as OTPArray;
    next[index] = value;
    setOtp(next);
    setError(null);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (
    event,
  ) => {
    const target = event.target as HTMLInputElement;
    const index = Number(target.dataset.index);
    if (Number.isNaN(index)) return;

    if (event.key === 'Backspace' && !target.value && index > 0) {
      inputsRef.current[index - 1]?.focus();
      setOtp((current) => {
        const next: OTPArray = [...current] as OTPArray;
        next[index - 1] = '';
        return next;
      });
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const onSubmit: FormEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault();

    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setSubmitting(true);
    setError(null);
    setInfo(null);

    try {
      await verifyOTP({
        email,
        otpCode: code,
      });

      if (userType === 'ca') {
        router.replace('/ca-view');
      } else {
        router.replace('/folk-view');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Verification failed';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async (): Promise<void> => {
    if (!email) return;

    setSubmitting(true);
    setError(null);
    setInfo(null);

    try {
      const res: OTPStatusResponse = await requestOTP({
        email,
      });

      setInfo(res.message ?? 'A new code has been sent');
      setResendIn(
        typeof res.canResendIn === 'number' ? res.canResendIn : 30,
      );
      inputsRef.current[0]?.focus();
      setOtp(['', '', '', '', '', '']);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not resend code';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col text-slate-100',
        VERIFY_OTP_THEME.pageBackground,
      )}
    >
      <Header />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-10 pt-24 md:px-6 md:pt-24">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            className={cn(
              'absolute top-[-6rem] left-1/3 h-80 w-80 rounded-full blur-3xl',
              VERIFY_OTP_THEME.glowTop,
            )}
            animate={{
              opacity: [0.4, 0.8, 0.4],
              x: [0, 18, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className={cn(
              'absolute bottom-[-6rem] right-1/4 h-96 w-96 rounded-full blur-3xl',
              VERIFY_OTP_THEME.glowBottom,
            )}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              x: [0, -20, 0],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <div
            className={cn(
              'absolute inset-0',
              VERIFY_OTP_THEME.radialOverlay,
            )}
          />
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative z-10 mx-auto w-full max-w-md"
        >
          <motion.div
            className={cn(
              'rounded-2xl border p-6 md:p-7 backdrop-blur-xl',
              VERIFY_OTP_THEME.cardBorder,
              VERIFY_OTP_THEME.cardBackground,
              VERIFY_OTP_THEME.cardShadow,
            )}
            whileHover={{ y: -4, rotateX: 1.2, rotateY: -1.2 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            {/* Header */}
            <div className="mb-5 flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
                <ShieldCheck
                  className={cn('h-5 w-5', VERIFY_OTP_THEME.accentIcon)}
                />
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-tr from-orange-400/30 to-amber-300/25 blur-sm"
                  animate={{
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>
              <div>
                <h1
                  className={cn(
                    'text-lg font-semibold md:text-xl',
                    VERIFY_OTP_THEME.titleText,
                  )}
                >
                  Verify your email
                </h1>
                <p
                  className={cn(
                    'text-[11px] md:text-xs',
                    VERIFY_OTP_THEME.subtitleText,
                  )}
                >
                  Enter the 6-digit code to unlock your workspace.
                </p>
              </div>
            </div>

            {/* Info text */}
            <p className="mb-6 flex items-center gap-2 text-xs md:text-sm">
              <Mail
                className={cn(
                  'h-4 w-4',
                  VERIFY_OTP_THEME.accentMailIcon,
                )}
              />
              <span className={VERIFY_OTP_THEME.subtitleText}>
                We sent a 6-digit code to{' '}
                <span
                  className={cn(
                    'font-medium',
                    VERIFY_OTP_THEME.emailHighlight,
                  )}
                >
                  {maskEmail(email)}
                </span>
              </span>
            </p>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="mb-1 grid grid-cols-6 gap-2 sm:gap-3">
                {otp.map((val, index) => (
                  <Input
                    id={`otp-${index}`}
                    key={index}
                    ref={(element: HTMLInputElement | null): void => {
                      inputsRef.current[index] = element;
                    }}
                    data-index={index}
                    value={val}
                    onChange={(event) =>
                      handleChange(
                        index,
                        event.target.value.replace(/\D/g, '').slice(-1),
                      )
                    }
                    onKeyDown={handleKeyDown}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    aria-label={`Digit ${index + 1}`}
                    className={cn(
                      'h-11 rounded-xl text-center text-lg tracking-[0.4em]',
                      VERIFY_OTP_THEME.inputBase,
                      VERIFY_OTP_THEME.inputBorder,
                      VERIFY_OTP_THEME.inputText,
                      VERIFY_OTP_THEME.inputPlaceholder,
                      VERIFY_OTP_THEME.inputFocusBorder,
                      VERIFY_OTP_THEME.inputFocusRing,
                    )}
                  />
                ))}
              </div>

              {/* Error / Info */}
              {error && (
                <div className="mb-2 flex items-start gap-2 text-sm">
                  <AlertCircle
                    className={cn(
                      'mt-0.5 h-4 w-4',
                      VERIFY_OTP_THEME.errorIcon,
                    )}
                  />
                  <p className={VERIFY_OTP_THEME.errorText}>{error}</p>
                </div>
              )}

              {info && (
                <p
                  className={cn(
                    'mb-2 text-xs md:text-sm',
                    VERIFY_OTP_THEME.infoText,
                  )}
                >
                  {info}
                </p>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={submitting || code.length !== 6}
                className={cn(
                  'w-full justify-center font-semibold',
                  VERIFY_OTP_THEME.buttonGradient,
                  VERIFY_OTP_THEME.buttonHoverGradient,
                  VERIFY_OTP_THEME.buttonShadow,
                  VERIFY_OTP_THEME.buttonDisabled,
                )}
              >
                {submitting ? 'Verifying…' : 'Verify & Continue'}
                {!submitting && (
                  <ArrowRight className="ml-2 h-4 w-4" />
                )}
              </Button>
            </form>

            {/* Footer actions inside card */}
            <div className="mt-5 flex flex-col gap-3 border-t border-slate-800/70 pt-4 text-xs md:flex-row md:items-center md:justify-between md:text-sm">
              <button
                type="button"
                onClick={onResend}
                disabled={submitting || resendIn > 0}
                className={cn(
                  'inline-flex items-center gap-2',
                  VERIFY_OTP_THEME.resendLink,
                  VERIFY_OTP_THEME.resendDisabled,
                )}
                aria-disabled={submitting || resendIn > 0}
              >
                <RefreshCw className="h-4 w-4" />
                {resendIn > 0
                  ? `Resend in ${resendIn}s`
                  : 'Resend code'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/login')}
                className={cn(
                  'inline-flex items-center justify-end',
                  VERIFY_OTP_THEME.secondaryLink,
                )}
              >
                Use a different email
              </button>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};
