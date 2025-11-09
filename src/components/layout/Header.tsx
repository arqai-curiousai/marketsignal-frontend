'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ShieldCheck,
  Scale,
  BookOpen,
  LineChart,
  Mail,
  Menu,
  X,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Theme tokens                                                       */
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
  readonly loginBorder: string;
  readonly loginGradient: string;
  readonly loginShadow: string;
  readonly progressBarGradient: string;
  readonly logoGlowGradient: string;
  readonly productBadgeBg: string;
  readonly productBadgeBorder: string;
  readonly productBadgeText: string;
  readonly productBadgeGlow: string;
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
  loginBorder: 'border-orange-300/70',
  loginGradient: 'bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-300',
  loginShadow: 'shadow-[0_0_22px_rgba(249,115,22,0.45)]',
  progressBarGradient:
    'bg-gradient-to-r from-orange-400 via-amber-200 to-orange-500',
  logoGlowGradient:
    'from-orange-500/18 via-amber-400/20 to-yellow-400/18',
  productBadgeBg: 'bg-slate-950/90',
  productBadgeBorder: 'border-orange-500/40',
  productBadgeText: 'text-orange-50',
  productBadgeGlow:
    'from-orange-500/25 via-amber-400/20 to-yellow-400/25',
});

const HEADER_THEME: HeaderThemeTokens = getHeaderTheme();

/* ------------------------------------------------------------------ */
/* Logo – only arQai wordmark now                                     */
/* ------------------------------------------------------------------ */

const LegalArQaiLogo: React.FC = () => {
  const orbVariants = {
    rest: {
      backgroundColor: '#FFF7ED',
      boxShadow: '0 0 8px rgba(248, 250, 252, 0.35)',
    },
    hover: {
      backgroundColor: '#FED7AA',
      boxShadow: '0 0 16px rgba(251, 146, 60, 0.7)',
    },
  } as const;

  return (
    <Link
      href="/"
      className="relative group cursor-pointer"
      aria-label="arQai home"
    >
      <motion.div
        className="relative rounded-3xl border border-white/20 px-5 py-2.5 shadow-2xl backdrop-blur-xl"
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.97 }}
        style={{
          background:
            'linear-gradient(135deg, rgba(248,250,252,0.14) 0%, rgba(15,23,42,0.9) 60%, rgba(15,23,42,0.98) 100%)',
        }}
      >
        {/* Animated border glow */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{
            background:
              'linear-gradient(45deg, transparent, rgba(251,146,60,0.45), transparent, rgba(249,115,22,0.5), transparent)',
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

        {/* arQai wordmark */}
        <span
          className="relative z-10 text-2xl font-light tracking-tight inline-flex items-center"
          style={{
            backgroundImage:
              'linear-gradient(135deg, #FFF7ED 0%, #FED7AA 40%, #FDBA74 70%, #FFFBEB 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 8px rgba(248, 250, 252, 0.35))',
          }}
        >
          <motion.span
            className="font-normal"
            animate={{
              textShadow: [
                '0 0 8px rgba(248, 250, 252, 0.3)',
                '0 0 16px rgba(251, 146, 60, 0.55)',
                '0 0 8px rgba(248, 250, 252, 0.3)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            ar
          </motion.span>

          <motion.span
            className="mx-1 origin-center font-medium relative"
            style={{
              display: 'inline-block',
              backgroundImage:
                'linear-gradient(135deg, #FDBA74 0%, #FB923C 40%, #EA580C 80%, #FFEDD5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            animate={{
              rotateY: [0, 360],
              scale: [1, 1.06, 1],
            }}
            transition={{
              rotateY: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
              scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            Q
            <motion.div
              className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-400/35 to-amber-300/35 blur-sm"
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scale: [0.85, 1.2, 0.85],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.span>

          <motion.span
            className="font-normal"
            animate={{
              textShadow: [
                '0 0 8px rgba(248, 250, 252, 0.3)',
                '0 0 16px rgba(252, 211, 77, 0.6)',
                '0 0 8px rgba(248, 250, 252, 0.3)',
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          >
            a
          </motion.span>

          <span className="font-normal relative">
            <motion.span
              style={{
                background:
                  'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 60%, #FEF9C3 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              animate={{
                textShadow: [
                  '0 0 8px rgba(248, 250, 252, 0.3)',
                  '0 0 16px rgba(251, 191, 36, 0.6)',
                  '0 0 8px rgba(248, 250, 252, 0.3)',
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
            >
              ı
            </motion.span>

            {/* Dot + ring */}
            <motion.div
              className="absolute h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-amber-300 shadow-lg"
              style={{
                top: '2px',
                left: '20%',
                transform: 'translateX(-50%)',
                filter:
                  'drop-shadow(0 0 6px rgba(249, 115, 22, 0.9))',
              }}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.8, 1, 0.8],
                boxShadow: [
                  '0 0 6px rgba(249, 115, 22, 0.9)',
                  '0 0 20px rgba(251, 191, 36, 1)',
                  '0 0 6px rgba(249, 115, 22, 0.9)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute h-4 w-4 rounded-full border-2 border-orange-300/60"
              style={{
                top: '-2px',
                left: '20%',
                transform: 'translateX(-50%)',
              }}
              animate={{
                scale: [0.5, 1.5, 0.5],
                opacity: [0.8, 0.1, 0.8],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </span>
        </span>

        {/* Floating orb */}
        <motion.div
          className="absolute h-3 w-3 rounded-full border-2 border-white/70 shadow-xl backdrop-blur-sm"
          style={{
            top: '6px',
            left: '6px',
            background:
              'linear-gradient(135deg,#FFF7ED 0%,#FDBA74 40%,#FB923C 100%)',
            filter: 'drop-shadow(0 0 8px rgba(255, 237, 213, 0.8))',
          }}
          animate={{
            rotate: 360,
            x: [0, 22, 40, 22, 0],
            y: [0, 8, 0, -6, 0],
            scale: [1, 1.12, 1, 1.12, 1],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          variants={orbVariants}
          initial="rest"
          whileHover="hover"
        />

        {/* Ambient glow sweep */}
        <motion.div
          className={`absolute -inset-2 rounded-3xl blur-xl bg-gradient-to-r ${HEADER_THEME.logoGlowGradient} opacity-0 group-hover:opacity-80 transition-opacity duration-700`}
          animate={{
            scale: [0.95, 1.05, 0.95],
            rotate: [0, 180, 360],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </Link>
  );
};

/* ------------------------------------------------------------------ */
/* Product badge – "legalaid" outside the logo box                    */
/* ------------------------------------------------------------------ */

const LegalaidProductBadge: React.FC = () => (
  <motion.div
    className={`relative hidden items-center rounded-2xl border px-3 py-1.5 md:flex ${HEADER_THEME.productBadgeBg} ${HEADER_THEME.productBadgeBorder}`}
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.2 }}
    whileHover={{ y: -1, scale: 1.02 }}
  >
    {/* soft glow behind */}
    <motion.div
      className={`pointer-events-none absolute inset-0 -z-10 rounded-2xl blur-xl bg-gradient-to-r ${HEADER_THEME.productBadgeGlow}`}
      animate={{
        opacity: [0.2, 0.5, 0.2],
        scale: [0.9, 1.05, 0.9],
      }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    />
    <div className="flex items-center gap-2">
      <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-slate-900">
        <Scale className="h-3.5 w-3.5 text-amber-300" />
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-400/30 to-amber-300/20 blur-sm"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div className="flex flex-col leading-none">
        <div
          className={`text-[0.68rem] uppercase tracking-[0.22em] ${HEADER_THEME.productBadgeText}`}
        >
          legalaid
        </div>
        <div className="mt-1 flex items-center gap-1">
          {/* <span className="text-[0.68rem] text-slate-400">
            AI legal co-pilot
          </span> */}
          {/* <motion.span
            className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-orange-400 to-amber-300"
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          /> */}
        </div>
      </div>
    </div>
  </motion.div>
);

/* ------------------------------------------------------------------ */
/* Navigation metadata                                                */
/* ------------------------------------------------------------------ */

interface NavigationLink {
  readonly href: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
}

const navigationLinks: NavigationLink[] = [
  { href: '#features', label: 'Product', icon: Sparkles },
  { href: '#solutions', label: 'Solutions', icon: BookOpen },
  { href: '#trust', label: 'Trust & Security', icon: ShieldCheck },
  { href: '#pricing', label: 'Pricing', icon: LineChart },
  { href: '#faq', label: 'FAQs', icon: Mail },
];

/* ------------------------------------------------------------------ */
/* Header                                                             */
/* ------------------------------------------------------------------ */

const LegalHeader: React.FC = () => {
  const router = useRouter();
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [clickedLink, setClickedLink] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleAnchorOrRouteNavigation = (
    href: string,
    event: React.MouseEvent<HTMLAnchorElement>,
  ): void => {
    event.preventDefault();
    setClickedLink(href);
    setIsNavigating(true);
    setIsMobileMenuOpen(false);

    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element instanceof HTMLElement) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      setTimeout(() => {
        setIsNavigating(false);
        setClickedLink(null);
      }, 800);
      return;
    }

    router.push(href);
    setTimeout(() => {
      setIsNavigating(false);
      setClickedLink(null);
    }, 600);
  };

  const handleLogin = (): void => {
    setIsNavigating(true);
    router.push('/login');
    setTimeout(() => setIsNavigating(false), 600);
  };

  const handleLaunchApp = (): void => {
    setIsNavigating(true);
    router.push('/chatbot');
    setTimeout(() => setIsNavigating(false), 600);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40" id="top">
      <div
        className={`relative border-b ${HEADER_THEME.border} ${HEADER_THEME.background} backdrop-blur-xl`}
      >
        {/* subtle top gradient sweep */}
        <motion.div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${HEADER_THEME.topSweep}`}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />

        <div className="relative mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 md:px-6 md:py-4">
          {/* Left: Logo + standalone legalaid badge */}
          <div className="flex items-center gap-3">
            <LegalArQaiLogo />
            <LegalaidProductBadge />
          </div>

          {/* Desktop nav – shifted right */}
          <nav className="ml-auto hidden items-center gap-4 text-xs font-medium text-slate-200 md:flex lg:gap-5">
            {navigationLinks.map((link) => {
              const Icon = link.icon;
              const isHovered = hoveredLink === link.href;
              const isActive = clickedLink === link.href;

              return (
                <div key={link.href} className="relative">
                  <Link
                    href={link.href}
                    onClick={(e) => handleAnchorOrRouteNavigation(link.href, e)}
                    onMouseEnter={() => setHoveredLink(link.href)}
                    onMouseLeave={() => setHoveredLink(null)}
                    className="relative flex items-center gap-2 rounded-xl px-3 py-2"
                  >
                    <motion.div
                      className={`absolute inset-0 rounded-xl ${HEADER_THEME.navHighlightBg}`}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: isHovered || isActive ? 0.22 : 0,
                        scale: isActive ? 1.02 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                    />
                    <Icon
                      className={`h-4 w-4 ${
                        isHovered || isActive
                          ? HEADER_THEME.navIconActive
                          : HEADER_THEME.navIconDefault
                      }`}
                    />
                    <span
                      className={`text-[0.78rem] ${
                        isHovered || isActive
                          ? HEADER_THEME.navTextActive
                          : HEADER_THEME.navTextDefault
                      }`}
                    >
                      {link.label}
                    </span>
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* Desktop Login CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <motion.button
              type="button"
              onClick={handleLogin}
              className={`group relative inline-flex items-center gap-2 overflow-hidden rounded-xl border px-4 py-2 text-sm font-semibold tracking-wide text-slate-950 ${HEADER_THEME.loginBorder} ${HEADER_THEME.loginGradient} ${HEADER_THEME.loginShadow} transition-colors`}
              whileHover={{ y: -1, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <span className="relative z-10">Login</span>
              <Sparkles className="relative z-10 h-4 w-4" />
              <span className="pointer-events-none absolute -right-3 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-orange-200/70 blur-xl" />
            </motion.button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 md:hidden"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5 text-slate-100" />
            ) : (
              <Menu className="h-5 w-5 text-slate-100" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <motion.div
            className="border-t border-slate-800/70 bg-slate-950/95 md:hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4">
              {navigationLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleAnchorOrRouteNavigation(link.href, e)}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100"
                  >
                    <Icon className="h-4 w-4 text-orange-300" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleLogin}
                  className="w-full rounded-lg border border-orange-300/60 bg-orange-400 px-3 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_18px_rgba(249,115,22,0.5)]"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={handleLaunchApp}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-100"
                >
                  Launch Co-pilot
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Top progress bar on route changes / CTA */}
      {isNavigating && (
        <motion.div
          className={`pointer-events-none absolute left-0 top-0 h-[2px] w-full ${HEADER_THEME.progressBarGradient} shadow-lg`}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ transformOrigin: '0% 50%' }}
        />
      )}
    </header>
  );
};

export default LegalHeader;
