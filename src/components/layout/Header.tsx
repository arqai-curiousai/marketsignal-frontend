'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Sparkles,
  LineChart,
  BookOpen,
  Bot,
  Menu,
  X,
  Lock,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Theme tokens (emerald/teal on slate) — NO HOOKS AT MODULE SCOPE     */
/* ------------------------------------------------------------------ */

interface HeaderThemeTokens {
  readonly bg: string;
  readonly border: string;
  readonly topSweep: string;
  readonly navHoverBg: string;
  readonly navIconActive: string;
  readonly navIcon: string;
  readonly navTextActive: string;
  readonly navText: string;
  readonly ctaPrimaryGrad: string;
  readonly ctaPrimaryRing: string;
  readonly ctaGhost: string;
  readonly progressGrad: string;
  readonly logoGlow: string;
}

const getHeaderTheme = (): HeaderThemeTokens => ({
  bg: 'bg-slate-950/85',
  border: 'border-slate-800/70',
  topSweep: 'from-transparent via-emerald-400/10 to-transparent',
  navHoverBg: 'bg-emerald-400/10',
  navIconActive: 'text-emerald-300',
  navIcon: 'text-slate-400',
  navTextActive: 'text-slate-50',
  navText: 'text-slate-300',
  ctaPrimaryGrad: 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-sky-400',
  ctaPrimaryRing: 'focus-visible:ring-emerald-400',
  ctaGhost: 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-900/70',
  progressGrad: 'bg-gradient-to-r from-emerald-400 via-cyan-300 to-sky-400',
  logoGlow: 'from-emerald-500/25 via-cyan-400/20 to-sky-400/25',
});

/* ------------------------------------------------------------------ */
/* New arQai logo variant (SVG wordmark + animated accent)            */
/* ------------------------------------------------------------------ */

const ArQaiLogoEmerald: React.FC = () => {
  const THEME = getHeaderTheme();
  return (
    <Link
      href="/"
      aria-label="arQai home"
      className="relative group inline-flex items-center"
    >
      <motion.div
        className="relative rounded-2xl border border-white/15 px-4 py-2 backdrop-blur-xl"
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.98 }}
        style={{
          background:
            'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(2,6,23,0.9) 60%, rgba(2,6,23,0.95) 100%)',
        }}
      >
        {/* animated border sweep */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(20,184,166,0.45), transparent, rgba(56,189,248,0.45), transparent)',
            backgroundSize: '300% 300%',
          }}
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
        />

        {/* SVG wordmark */}
        <div className="relative z-10 flex items-center gap-2">
          <svg
            width="120"
            height="26"
            viewBox="0 0 480 104"
            role="img"
            aria-label="arQai brand"
            className="drop-shadow-[0_0_10px_rgba(16,185,129,0.35)]"
          >
            <defs>
              <linearGradient id="arqaiGrad" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="qAccent" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#a7f3d0" />
                <stop offset="100%" stopColor="#67e8f9" />
              </linearGradient>
            </defs>

            {/* a r */}
            <text
              x="0"
              y="74"
              fontFamily="Inter, ui-sans-serif, system-ui"
              fontWeight={600}
              fontSize="74"
              fill="url(#arqaiGrad)"
            >
              ar
            </text>

            {/* Q with accent ring */}
            <g transform="translate(138, 0)">
              <text
                x="0"
                y="74"
                fontFamily="Inter, ui-sans-serif, system-ui"
                fontWeight={700}
                fontSize="74"
                fill="url(#qAccent)"
              >
                Q
              </text>
              <motion.circle
                cx="64"
                cy="86"
                r="12"
                stroke="url(#arqaiGrad)"
                strokeWidth="6"
                fill="none"
                initial={{ rotate: 0, opacity: 0.8 }}
                animate={{ rotate: 360, opacity: [0.8, 0.3, 0.8] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'linear' }}
              />
            </g>

            {/* a i (with glowing dot) */}
            <text
              x="234"
              y="74"
              fontFamily="Inter, ui-sans-serif, system-ui"
              fontWeight={600}
              fontSize="74"
              fill="url(#arqaiGrad)"
            >
              a
            </text>
            <text
              x="298"
              y="74"
              fontFamily="Inter, ui-sans-serif, system-ui"
              fontWeight={600}
              fontSize="74"
              fill="url(#arqaiGrad)"
            >
              i
            </text>
            <motion.circle
              cx="318"
              cy="30"
              r="6.8"
              fill="url(#qAccent)"
              initial={{ scale: 1, filter: 'drop-shadow(0 0 0 rgba(16,185,129,0))' }}
              animate={{
                scale: [1, 1.25, 1],
                filter: [
                  'drop-shadow(0 0 0 rgba(16,185,129,0))',
                  'drop-shadow(0 0 12px rgba(56,189,248,0.9))',
                  'drop-shadow(0 0 0 rgba(16,185,129,0))',
                ],
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>

          <span className="hidden text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400 sm:inline">
            Artha-Sarthi
          </span>
        </div>

        {/* ambient glow */}
        <motion.div
          className={`absolute -inset-2 rounded-2xl blur-xl bg-gradient-to-r ${THEME.logoGlow} opacity-0 transition-opacity duration-700 group-hover:opacity-80`}
          animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.98, 1.04, 0.98] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </Link>
  );
};

/* ------------------------------------------------------------------ */
/* Navigation metadata                                                */
/* ------------------------------------------------------------------ */

interface NavigationLink {
  readonly href: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
}

const NAV_LINKS: readonly NavigationLink[] = [
  { href: '#for-ca', label: 'For CAs', icon: ShieldCheck },
  { href: '#for-citizens', label: 'For citizens', icon: BookOpen },
  { href: '#how-it-works', label: 'How it works', icon: LineChart },
  { href: '#security', label: 'Security', icon: Lock },
  { href: '/#faq', label: 'FAQs', icon: Sparkles },
];

/* ------------------------------------------------------------------ */
/* Header                                                             */
/* ------------------------------------------------------------------ */

const Header: React.FC = () => {
  const THEME = getHeaderTheme(); // ✅ computed inside component
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const navigate = (href: string): void => {
    setActive(href);
    setIsNavigating(true);
    setMobileOpen(false);

    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      setTimeout(() => {
        setIsNavigating(false);
        setActive(null);
      }, 700);
      return;
    }

    router.push(href);
    setTimeout(() => {
      setIsNavigating(false);
      setActive(null);
    }, 500);
  };

  const onCta = (path: string): void => {
    setIsNavigating(true);
    router.push(path);
    setTimeout(() => setIsNavigating(false), 500);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40" role="banner">
      <div className={`relative border-b ${THEME.border} ${THEME.bg} backdrop-blur-xl`}>
        {/* thin animated sweep */}
        <motion.div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${THEME.topSweep}`}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        />

        <div className="relative mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 md:px-6 md:py-4">
          {/* Left: Logo */}
          <ArQaiLogoEmerald />

          {/* Desktop nav */}
          <nav className="ml-auto hidden items-center gap-2 md:flex lg:gap-3" aria-label="Primary">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const isHot = hovered === href || active === href;
              return (
                <div key={href} className="relative">
                  <button
                    onClick={() => navigate(href)}
                    onMouseEnter={() => setHovered(href)}
                    onMouseLeave={() => setHovered(null)}
                    className="relative inline-flex items-center gap-2 rounded-xl px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:ring-emerald-400"
                    aria-label={label}
                  >
                    <motion.span
                      className={`absolute inset-0 rounded-xl ${THEME.navHoverBg}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isHot ? 0.22 : 0, scale: isHot ? 1.02 : 1 }}
                      transition={{ duration: 0.18 }}
                    />
                    <Icon className={`h-4 w-4 ${isHot ? THEME.navIconActive : THEME.navIcon}`} />
                    <span className={`text-[0.8rem] ${isHot ? THEME.navTextActive : THEME.navText}`}>
                      {label}
                    </span>
                  </button>
                </div>
              );
            })}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => onCta('/login')}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold text-slate-100 ${THEME.ctaGhost} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${THEME.ctaPrimaryRing}`}
            >
              Log in
            </button>
            <motion.button
              type="button"
              onClick={() => onCta('/signup')}
              className={`relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-950 ${THEME.ctaPrimaryGrad} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${THEME.ctaPrimaryRing}`}
              whileHover={{ y: -1, scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/25 via-transparent to-white/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              Get started
              <Bot className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5 text-slate-100" /> : <Menu className="h-5 w-5 text-slate-100" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            className="border-t border-slate-800/70 bg-slate-950/95 md:hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <button
                  key={href}
                  onClick={() => navigate(href)}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-left text-xs text-slate-100"
                >
                  <Icon className="h-4 w-4 text-emerald-300" />
                  <span>{label}</span>
                </button>
              ))}
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onCta('/login')}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-100"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => onCta('/signup')}
                  className="w-full rounded-lg border border-emerald-300/60 bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_18px_rgba(16,185,129,0.45)]"
                >
                  Get started
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Top progress bar */}
      {isNavigating && (
        <motion.div
          className={`pointer-events-none absolute left-0 top-0 h-[2px] w-full ${THEME.progressGrad} shadow-lg`}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ transformOrigin: '0% 50%' }}
          aria-hidden
        />
      )}
    </header>
  );
};

export default Header;
