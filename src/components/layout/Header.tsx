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
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { checkAuthAndNavigate } from '@/services/navigation.service';

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

          <div className="flex items-center gap-3">
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
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              अर्थसारथी
            </motion.span>

            {/* Premium Separator with gradient */}
            <motion.div
              className="relative h-6 w-px"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-orange-400/60 via-amber-300/80 to-orange-400/60" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-transparent blur-[1px]" />
            </motion.div>

            {/* arQai with EPIC light-travel animation */}
            <motion.div
              className="relative group/arqai"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              {/* Light traveling beam effect */}
              <motion.div
                className="absolute -inset-2 bg-gradient-to-r from-transparent via-orange-400/40 to-transparent blur-md pointer-events-none"
                initial={{ x: '-200%', opacity: 0 }}
                animate={{
                  x: ['200%', '200%'],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{
                  duration: 2,
                  delay: 0.8,
                  times: [0, 0.1, 0.9, 1],
                  ease: "easeInOut"
                }}
              />

              {/* Particle trail effect */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, delay: 1.2 }}
              >
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-orange-400/60"
                    style={{
                      left: `${i * 20}%`,
                      top: '50%',
                    }}
                    initial={{ opacity: 0, scale: 0, y: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      y: [0, -10, -20]
                    }}
                    transition={{
                      duration: 0.8,
                      delay: 0.9 + (i * 0.1),
                      ease: "easeOut"
                    }}
                  />
                ))}
              </motion.div>

              <div className="relative flex items-center text-base font-semibold tracking-wide">
                {/* Letter: a */}
                <motion.span
                  className="relative inline-block"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    filter: [
                      'brightness(1) drop-shadow(0 0 0px rgba(251,146,60,0))',
                      'brightness(2) drop-shadow(0 0 8px rgba(251,146,60,0.8))',
                      'brightness(1) drop-shadow(0 0 2px rgba(251,146,60,0.3))',
                    ]
                  }}
                  transition={{
                    opacity: { duration: 0.3, delay: 0.9 },
                    y: { duration: 0.3, delay: 0.9 },
                    filter: { duration: 0.6, delay: 0.9, times: [0, 0.5, 1] }
                  }}
                  whileHover={{ scale: 1.1 }}
                >
                  a
                </motion.span>

                {/* Letter: r */}
                <motion.span
                  className="relative inline-block"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    filter: [
                      'brightness(1) drop-shadow(0 0 0px rgba(251,146,60,0))',
                      'brightness(2) drop-shadow(0 0 8px rgba(251,146,60,0.8))',
                      'brightness(1) drop-shadow(0 0 2px rgba(251,146,60,0.3))',
                    ]
                  }}
                  transition={{
                    opacity: { duration: 0.3, delay: 1.0 },
                    y: { duration: 0.3, delay: 1.0 },
                    filter: { duration: 0.6, delay: 1.0, times: [0, 0.5, 1] }
                  }}
                  whileHover={{ scale: 1.1 }}
                >
                  r
                </motion.span>

                {/* Letter: Q - HERO LETTER with special effects */}
                <motion.span
                  className="relative inline-block mx-0.5"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                  initial={{ opacity: 0, y: 10, rotateY: 0 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    rotateY: [0, 0, 360],
                    filter: [
                      'brightness(1) drop-shadow(0 0 0px rgba(251,146,60,0))',
                      'brightness(3) drop-shadow(0 0 12px rgba(251,146,60,1))',
                      'brightness(1.5) drop-shadow(0 0 4px rgba(251,146,60,0.5))',
                    ]
                  }}
                  transition={{
                    opacity: { duration: 0.3, delay: 1.1 },
                    y: { duration: 0.3, delay: 1.1 },
                    rotateY: { duration: 1, delay: 1.1, ease: "easeInOut" },
                    filter: { duration: 1, delay: 1.1, times: [0, 0.4, 1] }
                  }}
                  whileHover={{
                    scale: 1.2,
                    rotateY: 180,
                    transition: { duration: 0.5 }
                  }}
                >
                  Q
                  {/* Ring pulse around Q */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-orange-400/40"
                    initial={{ scale: 1, opacity: 0 }}
                    animate={{
                      scale: [1, 2, 2.5],
                      opacity: [0, 0.6, 0]
                    }}
                    transition={{ duration: 1, delay: 1.3 }}
                  />
                </motion.span>

                {/* Letter: a */}
                <motion.span
                  className="relative inline-block"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    filter: [
                      'brightness(1) drop-shadow(0 0 0px rgba(251,146,60,0))',
                      'brightness(2) drop-shadow(0 0 8px rgba(251,146,60,0.8))',
                      'brightness(1) drop-shadow(0 0 2px rgba(251,146,60,0.3))',
                    ]
                  }}
                  transition={{
                    opacity: { duration: 0.3, delay: 1.2 },
                    y: { duration: 0.3, delay: 1.2 },
                    filter: { duration: 0.6, delay: 1.2, times: [0, 0.5, 1] }
                  }}
                  whileHover={{ scale: 1.1 }}
                >
                  a
                </motion.span>

                {/* Letter: i with special dot */}
                <motion.span
                  className="relative inline-block ml-0.5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 1.3 }}
                >
                  <span
                    className="relative inline-block"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    ı
                  </span>
                  {/* Animated dot with projectile motion */}
                  <motion.div
                    className="absolute top-[2px] left-[45%] -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-orange-400"
                    initial={{ opacity: 0, x: -60, y: 4, scale: 0 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      y: [4, -10, 0],
                      scale: [0, 1.2, 1],
                      boxShadow: [
                        '0 0 0px rgba(251,146,60,0)',
                        '0 0 12px rgba(251,146,60,1)',
                        '0 0 4px rgba(251,146,60,0.6)',
                      ]
                    }}
                    transition={{
                      duration: 0.6,
                      delay: 1.35,
                      times: [0, 0.4, 1],
                      ease: "easeOut"
                    }}
                  />
                  {/* Energy ring around dot */}
                  <motion.div
                    className="absolute -top-[2px] left-[45%] -translate-x-1/2 w-[8px] h-[8px] rounded-full border border-orange-400/40"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: [0, 2, 0],
                      opacity: [0, 0.8, 0]
                    }}
                    transition={{ duration: 0.8, delay: 1.4 }}
                  />
                </motion.span>
              </div>

              {/* Holographic shine sweep on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/arqai:opacity-100 blur-sm pointer-events-none -skew-x-12"
                initial={{ x: '-100%' }}
                whileHover={{ x: '200%' }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />
            </motion.div>
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
  const { isAuthenticated, user } = useAuth();
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

  /**
   * Determines if a navigation link requires authentication
   */
  const isProtectedRoute = (href: string): boolean => {
    return href === '/ca-view' || href === '/folk-view';
  };

  /**
   * Handles navigation with authentication checks for protected routes
   */
  const navigate = (href: string): void => {
    setActive(href);
    setIsNavigating(true);
    setMobileOpen(false);

    // Handle hash links (scroll to section on same page)
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

    // Check if route requires authentication
    if (isProtectedRoute(href)) {
      checkAuthAndNavigate({
        isAuthenticated,
        targetPath: href,
        router,
        onSuccess: () => {
          setTimeout(() => {
            setIsNavigating(false);
            setActive(null);
          }, 500);
        },
        onRedirect: () => {
          setTimeout(() => {
            setIsNavigating(false);
            setActive(null);
          }, 500);
        },
      });
      return;
    }

    // Handle regular page navigation
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
            {isAuthenticated ? (
              <motion.button
                type="button"
                onClick={() => {
                  const dashboardLink = user?.role === 'lawyer' ? '/ca-view' : '/folk-view';
                  navigate(dashboardLink);
                }}
                className={`relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-950 ${HEADER_THEME.loginGradient} ${HEADER_THEME.loginShadow} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:ring-orange-400`}
                whileHover={{ y: -1, scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/25 via-transparent to-white/25 opacity-0 transition-opacity duration-200 hover:opacity-100" />
                <span className="relative z-10">Dashboard</span>
                <ArrowRight className="h-4 w-4 relative z-10" />
              </motion.button>
            ) : (
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
            )}
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