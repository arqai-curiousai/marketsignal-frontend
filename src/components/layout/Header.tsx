'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Users,
  Lock,
  Sparkles,
  Menu,
  X,
  Bot,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Theme tokens                                                        */
/* ------------------------------------------------------------------ */

interface HeaderThemeTokens {
  readonly background: string;
  readonly border: string;
  readonly topSweep: string;
  readonly navHighlightBg: string;
  readonly navIconActive: string;
  readonly navIconDefault: string;
  readonly navTextActive: string;
  readonly navTextDefault: string;
  readonly loginGradient: string;
  readonly loginShadow: string;
  readonly progressBarGradient: string;
  readonly logoGlowGradient: string;
}

const getHeaderTheme = (): HeaderThemeTokens => ({
  background: 'bg-slate-950/85',
  border: 'border-slate-800/70',
  topSweep: 'from-transparent via-orange-500/7 to-transparent',
  navHighlightBg: 'bg-orange-500/10',
  navIconActive: 'text-orange-300',
  navIconDefault: 'text-slate-400',
  navTextActive: 'text-slate-50',
  navTextDefault: 'text-slate-300',
  loginGradient: 'bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-300',
  loginShadow: 'shadow-[0_0_22px_rgba(249,115,22,0.45)]',
  progressBarGradient: 'bg-gradient-to-r from-orange-400 via-amber-200 to-orange-500',
  logoGlowGradient: 'from-orange-500/18 via-amber-400/20 to-yellow-400/18',
});

const HEADER_THEME: HeaderThemeTokens = getHeaderTheme();

/* ------------------------------------------------------------------ */
/* Fused Logo - arQai + Arthasarthi                                   */
/* ------------------------------------------------------------------ */

export const ArthasarthiLogo: React.FC = () => {
  return (
    <a href="/" className="relative group cursor-pointer" aria-label="Arthasarthi by arQai">
      <motion.div
        className="relative rounded-2xl border border-white/10 px-5 py-2 shadow-2xl backdrop-blur-xl overflow-hidden"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          background:
            'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.95) 100%)',
        }}
      >
        {/* Animated border glow */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-40"
          style={{
            background:
              'linear-gradient(45deg, transparent, rgba(251,146,60,0.3), transparent, rgba(249,115,22,0.3), transparent)',
            backgroundSize: '300% 300%',
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        <div className="relative z-10 flex items-center gap-3">
          {/* Left: Abstract Logo Mark */}
          <div className="relative h-9 w-9 flex items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full border border-orange-500/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-1 rounded-full border border-orange-400/30"
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-orange-300 to-amber-500 shadow-[0_0_12px_rgba(249,115,22,0.6)]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="flex flex-col justify-center -space-y-0.5">
            {/* Main Highlight: Arthasarthi (Hindi) */}
            <motion.span
              className="text-2xl font-bold tracking-wide leading-tight"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #FFEDD5 0%, #FDBA74 50%, #FB923C 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 2px 8px rgba(249, 115, 22, 0.25))',
              }}
            >
              अर्थसारथी
            </motion.span>

            {/* Subtle Highlight: arQai */}
            <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                Powered by
              </span>
              <span className="text-xs font-semibold text-slate-300 tracking-wide">
                arQai
              </span>
            </div>
          </div>
        </div>

        {/* Ambient glow sweep */}
        <motion.div
          className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-10 group-hover:animate-shimmer"
        />
      </motion.div>
    </a>
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
  { href: '/ca-view', label: 'For CAs', icon: ShieldCheck },
  { href: '/folk-view', label: 'For Citizens', icon: Users },
  { href: '#faqs', label: 'How it Works', icon: Sparkles },
  { href: '#security', label: 'Security', icon: Lock },
];

/* ------------------------------------------------------------------ */
/* Header Component                                                   */
/* ------------------------------------------------------------------ */

const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigate = (href: string): void => {
    setActive(href);
    setIsNavigating(true);
    setMobileOpen(false);

    if (href.startsWith('#')) {
      // Handle hash links (scroll to section on same page)
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

    // Handle page navigation using Next.js router
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
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? `${HEADER_THEME.background} backdrop-blur-2xl border-b ${HEADER_THEME.border}`
          : 'bg-transparent'
        }`}
      role="banner"
    >
      {/* Animated top border */}
      <motion.div
        className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r ${HEADER_THEME.topSweep}`}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scaleX: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <ArthasarthiLogo />

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const isCurrentPage = pathname === href;
              const isHot = hovered === href || active === href || isCurrentPage;
              return (
                <div key={href} className="relative">
                  <button
                    onClick={() => navigate(href)}
                    onMouseEnter={() => setHovered(href)}
                    onMouseLeave={() => setHovered(null)}
                    className="relative inline-flex items-center gap-2 rounded-xl px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:ring-orange-400 transition-colors"
                    aria-label={label}
                  >
                    <motion.span
                      className={`absolute inset-0 rounded-xl ${HEADER_THEME.navHighlightBg}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isHot ? 0.22 : 0, scale: isHot ? 1.02 : 1 }}
                      transition={{ duration: 0.18 }}
                    />
                    <Icon
                      className={`h-4 w-4 ${isHot ? HEADER_THEME.navIconActive : HEADER_THEME.navIconDefault
                        } transition-colors`}
                    />
                    <span
                      className={`text-sm ${isHot ? HEADER_THEME.navTextActive : HEADER_THEME.navTextDefault
                        } transition-colors`}
                    >
                      {label}
                    </span>
                  </button>
                </div>
              );
            })}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <motion.button
              type="button"
              onClick={() => onCta('/login')}
              className={`relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-950 ${HEADER_THEME.loginGradient} ${HEADER_THEME.loginShadow} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:ring-orange-400`}
              whileHover={{ y: -1, scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/25 via-transparent to-white/25 opacity-0 transition-opacity duration-200 hover:opacity-100" />
              <span className="relative z-10">Login</span>
              <Bot className="h-4 w-4 relative z-10" />
            </motion.button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label="Toggle menu"
            className="flex lg:hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="lg:hidden mt-4 p-4 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-800/50"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <nav className="flex flex-col gap-2">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                  const isCurrentPage = pathname === href;
                  return (
                    <button
                      key={href}
                      onClick={() => navigate(href)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-colors text-left w-full ${isCurrentPage
                          ? 'text-orange-300 bg-slate-800/70 border border-orange-500/30'
                          : 'text-slate-300 hover:text-orange-300 hover:bg-slate-800/50'
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </button>
                  );
                })}
                <div className="flex flex-col gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => onCta('/login')}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-slate-950 ${HEADER_THEME.loginGradient} ${HEADER_THEME.loginShadow}`}
                  >
                    Login
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Top progress bar */}
      {isNavigating && (
        <motion.div
          className={`pointer-events-none absolute left-0 top-0 h-[2px] w-full ${HEADER_THEME.progressBarGradient} shadow-lg`}
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