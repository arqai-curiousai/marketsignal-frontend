"use client";

import React from "react";
import { motion } from "framer-motion";
import LegalHeader from "@/components/layout/Header";
import LegalFooter from "@/components/layout/Footer";
import { OTPRequestForm } from "@/components/auth/LoginForm";

interface LoginHighlightProps {
  title: string;
  description: string;
}

const loginHighlights: LoginHighlightProps[] = [
  {
    title: "OTP-only, passwordless access",
    description:
      "Sign in with a verified email used by your firm or organisation. No passwords to manage or reset.",
  },
  {
    title: "Governed workspace",
    description:
      "Your matters, notes, and queries are scoped to controlled workspaces and firm policies.",
  },
  {
    title: "Citations by default",
    description:
      "Every answer can be traced back to judgments, statutes, or your internal documents.",
  },
];

const LoginHighlight: React.FC<LoginHighlightProps> = ({
  title,
  description,
}) => (
  <div className="space-y-1.5">
    <p className="text-xs font-medium text-slate-100">{title}</p>
    <p className="text-[11px] text-slate-400">{description}</p>
  </div>
);

const LoginPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-[#020617] text-slate-100">
      <LegalHeader />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pt-24 pb-10 md:px-6 md:pt-24">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-[-6rem] h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="absolute right-[-4rem] top-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-[-6rem] left-1/4 h-80 w-80 rounded-full bg-slate-700/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.5),_transparent_60%)]" />
        </div>

        {/* Content layout */}
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-10 md:flex-row md:items-center md:gap-12">
          {/* Left column: copy */}
          <motion.section
            className="md:flex-1 space-y-5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
              Trusted access
              <span className="h-1 w-1 rounded-full bg-emerald-300" />
              OTP login for legal teams
            </span>
            <h1 className="text-balance text-2xl font-semibold text-slate-50 md:text-3xl">
              Sign in to your{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                Legal AI co-pilot
              </span>
            </h1>
            <p className="max-w-md text-sm text-slate-300">
              Continue research notes, matters, and drafts exactly where you
              left off. Your work is encrypted in transit and at rest, and kept
              within your governed workspace.
            </p>
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
            initial={{ opacity: 0, x: 20, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-800/70 bg-slate-950/80 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.75)] backdrop-blur-xl md:p-7">
              <div className="mb-4 space-y-1">
                <h2 className="text-lg font-semibold text-slate-50">
                  Login with your email
                </h2>
                <p className="text-[11px] text-slate-400">
                  We will send a one-time passcode (OTP) to verify your identity
                  and device. No passwords/signups or recovery questions.
                </p>
              </div>
              <div className="mb-4 h-px w-full bg-gradient-to-r from-emerald-500/40 via-slate-700 to-transparent" />
              <OTPRequestForm />
              <p className="mt-4 text-[11px] text-slate-500">
                By continuing, you confirm that you are authorised to access
                your organisation&apos;s legal workspace and agree to the
                applicable terms and privacy policy.
              </p>
            </div>
          </motion.section>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
};

export default LoginPage;
