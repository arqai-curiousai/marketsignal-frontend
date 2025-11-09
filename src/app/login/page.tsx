'use client';

import React from 'react';
import { motion } from 'framer-motion';
import LegalHeader from '@/components/layout/Header';
import LegalFooter from '@/components/layout/Footer';
import { OTPRequestForm } from '@/components/auth/LoginForm';

interface LoginHighlightProps {
  readonly title: string;
  readonly description: string;
}

interface LoginThemeTokens {
  readonly pageBackground: string;
  readonly glowWarm: string;
  readonly glowAccent: string;
  readonly glowBase: string;
  readonly radialOverlay: string;
  readonly badgeBorder: string;
  readonly badgeBg: string;
  readonly badgeText: string;
  readonly headingAccent: string;
  readonly cardBorder: string;
  readonly cardBackground: string;
  readonly dividerGradient: string;
}

const getLoginTheme = (): LoginThemeTokens => ({
  pageBackground:
    'bg-[radial-gradient(circle_at_top,_#050308,_#020617)]',
  glowWarm: 'bg-orange-500/18',
  glowAccent: 'bg-amber-400/16',
  glowBase: 'bg-slate-800/20',
  radialOverlay:
    'bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.6),_transparent_65%)]',
  badgeBorder: 'border-orange-400/40',
  badgeBg: 'bg-orange-500/12',
  badgeText: 'text-orange-100',
  headingAccent:
    'bg-gradient-to-r from-orange-300 via-amber-200 to-yellow-300 bg-clip-text text-transparent',
  cardBorder: 'border-slate-800/80',
  cardBackground: 'bg-slate-950/85',
  dividerGradient:
    'bg-gradient-to-r from-orange-500/45 via-slate-700 to-transparent',
});

const LOGIN_THEME = getLoginTheme();

const loginHighlights: LoginHighlightProps[] = [
  {
    title: 'OTP-only, passwordless access',
    description:
      'Sign in with a verified email used by your firm or organisation. No passwords to manage or reset.',
  },
  {
    title: 'Governed workspace',
    description:
      'Your matters, notes, and queries are scoped to controlled workspaces and firm policies.',
  },
  {
    title: 'Citations by default',
    description:
      'Every answer can be traced back to judgments, statutes, or your internal documents.',
  },
];

const LoginHighlight: React.FC<LoginHighlightProps> = ({
  title,
  description,
}) => (
  <motion.div
    className="space-y-1.5 rounded-xl border border-slate-800/60 bg-slate-950/70 px-3 py-3"
    whileHover={{ y: -2, scale: 1.01 }}
    transition={{ duration: 0.18 }}
  >
    <p className="text-xs font-semibold text-slate-50">{title}</p>
    <p className="text-[11px] leading-relaxed text-slate-400">{description}</p>
  </motion.div>
);

const LoginPage: React.FC = () => {
  return (
    <div
      className={`flex min-h-screen flex-col ${LOGIN_THEME.pageBackground} text-slate-100`}
    >
      <LegalHeader />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-10 pt-24 md:px-6 md:pt-24">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            className={`absolute -left-24 top-[-6rem] h-72 w-72 rounded-full blur-3xl ${LOGIN_THEME.glowWarm}`}
            animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.05, 0.9] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className={`absolute right-[-4rem] top-1/3 h-80 w-80 rounded-full blur-3xl ${LOGIN_THEME.glowAccent}`}
            animate={{ opacity: [0.2, 0.6, 0.2], x: [0, -18, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className={`absolute bottom-[-6rem] left-1/4 h-80 w-80 rounded-full blur-3xl ${LOGIN_THEME.glowBase}`}
            animate={{ opacity: [0.15, 0.4, 0.15], x: [0, 16, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className={`absolute inset-0 ${LOGIN_THEME.radialOverlay}`} />
        </div>

        {/* Content layout */}
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-10 md:flex-row md:items-center md:gap-12">
          {/* Left column: copy */}
          <motion.section
            className="space-y-6 md:flex-1"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium ${LOGIN_THEME.badgeBorder} ${LOGIN_THEME.badgeBg} ${LOGIN_THEME.badgeText}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
            >
              Trusted access
              <span className="h-1 w-1 rounded-full bg-orange-300" />
              OTP login for legal teams
            </motion.span>
            <div className="space-y-3">
              <h1 className="text-balance text-2xl font-semibold text-slate-50 md:text-3xl">
                Sign in to your{' '}
                <span className={LOGIN_THEME.headingAccent}>legalaid</span>{' '}
                workspace
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-slate-300 md:text-base">
                Continue research notes, matters, and drafts exactly where you
                left off. Your work is encrypted in transit and at rest, and
                stays within your governed workspace.
              </p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {loginHighlights.map((item) => (
                <LoginHighlight
                  key={item.title}
                  title={item.title}
                  description={item.description}
                />
              ))}
            </div>
          </motion.section>

          {/* Right column: login card */}
          <motion.section
            className="md:flex-1"
            initial={{ opacity: 0, x: 24, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <motion.div
              className={`mx-auto w-full max-w-md rounded-2xl border p-6 shadow-[0_24px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl md:p-7 ${LOGIN_THEME.cardBorder} ${LOGIN_THEME.cardBackground}`}
              whileHover={{ y: -4, rotateX: 1.2, rotateY: -1.2 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <div className="mb-4 space-y-1">
                <h2 className="text-lg font-semibold text-slate-50">
                  Login with your email
                </h2>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  We&apos;ll send a one-time passcode (OTP) to verify your
                  identity and device. No passwords, no recovery questions.
                </p>
              </div>
              <div className={`mb-4 h-px w-full ${LOGIN_THEME.dividerGradient}`} />
              <OTPRequestForm />
              <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                By continuing, you confirm that you&apos;re authorised to access
                your organisation&apos;s legal workspace and agree to the
                applicable terms and privacy policy.
              </p>
            </motion.div>
          </motion.section>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
};

export default LoginPage;
