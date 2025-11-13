// 'use client';

// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import {
//   ShieldCheck,
//   Sparkles,
//   Users,
//   Lock,
//   ArrowUpRight,
//   Menu,
//   X,
// } from 'lucide-react';

// // Premium Sanskrit-inspired logo
// export const ArthasarthiLogo = () => {
//   return (
//     <motion.div
//       className="relative group"
//       whileHover={{ scale: 1.02 }}
//       transition={{ type: "spring", stiffness: 400 }}
//     >
//       <div className="relative">
//         {/* Glow effect */}
//         <motion.div
//           className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
//           animate={{
//             scale: [1, 1.05, 1],
//             opacity: [0.5, 0.8, 0.5],
//           }}
//           transition={{
//             duration: 3,
//             repeat: Infinity,
//             ease: "easeInOut",
//           }}
//         />
        
//         <div className="relative flex items-center gap-3 px-4 py-2 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-amber-500/20 rounded-2xl">
//           {/* Sanskrit-style ornament */}
//           <svg width="32" height="32" viewBox="0 0 32 32" className="text-amber-400">
//             <defs>
//               <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
//                 <stop offset="0%" stopColor="#fbbf24" />
//                 <stop offset="50%" stopColor="#eab308" />
//                 <stop offset="100%" stopColor="#f59e0b" />
//               </linearGradient>
//             </defs>
//             <motion.path
//               d="M16 4 L20 12 L28 12 L22 18 L24 26 L16 22 L8 26 L10 18 L4 12 L12 12 Z"
//               fill="url(#logoGrad)"
//               initial={{ rotate: 0 }}
//               animate={{ rotate: 360 }}
//               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
//             />
//             <circle cx="16" cy="16" r="4" fill="none" stroke="url(#logoGrad)" strokeWidth="2" opacity="0.6" />
//           </svg>
          
//           <div className="flex flex-col">
//             <span className="text-xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent tracking-tight">
//               अर्थसारथि
//             </span>
//             <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 -mt-1">
//               Arthasarthi
//             </span>
//           </div>
//         </div>
//       </div>
//     </motion.div>
//   );
// };

// // Premium Header
// const Header = () => {
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [scrolled, setScrolled] = useState(false);

//   useEffect(() => {
//     const handleScroll = () => setScrolled(window.scrollY > 20);
//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   const navItems = [
//     { label: 'For CAs', href: '#for-ca', icon: ShieldCheck },
//     { label: 'For Citizens', href: '#for-citizens', icon: Users },
//     { label: 'How it Works', href: '#how-it-works', icon: Sparkles },
//     { label: 'Security', href: '#security', icon: Lock },
//   ];

//   return (
//     <motion.header
//       className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
//         scrolled ? 'bg-slate-950/95 backdrop-blur-2xl border-b border-slate-800/50' : 'bg-transparent'
//       }`}
//       initial={{ y: -100 }}
//       animate={{ y: 0 }}
//       transition={{ type: "spring", stiffness: 100 }}
//     >
//       {/* Animated top border */}
//       <motion.div
//         className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"
//         animate={{
//           opacity: [0.3, 0.6, 0.3],
//           scaleX: [0.8, 1, 0.8],
//         }}
//         transition={{
//           duration: 3,
//           repeat: Infinity,
//           ease: "easeInOut",
//         }}
//       />

//       <div className="max-w-7xl mx-auto px-6 py-4">
//         <div className="flex items-center justify-between">
//           <ArthasarthiLogo />

//           {/* Desktop Nav */}
//           <nav className="hidden lg:flex items-center gap-1">
//             {navItems.map((item) => (
//               <motion.a
//                 key={item.label}
//                 href={item.href}
//                 className="relative px-4 py-2 text-sm text-slate-300 hover:text-amber-400 transition-colors group"
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 <span className="relative z-10 flex items-center gap-2">
//                   <item.icon className="w-4 h-4" />
//                   {item.label}
//                 </span>
//                 <motion.div
//                   className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-lg opacity-0 group-hover:opacity-100"
//                   layoutId="navHover"
//                   transition={{ type: "spring", stiffness: 400 }}
//                 />
//               </motion.a>
//             ))}
//           </nav>

//           {/* CTA Buttons */}
//           <div className="hidden lg:flex items-center gap-3">
//             <motion.a
//               href="/login"
//               className="px-6 py-2 text-sm font-medium text-slate-300 hover:text-amber-400 transition-colors"
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//             >
//               Login
//             </motion.a>
//             <motion.a
//               href="/signup"
//               className="relative px-6 py-2.5 text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 rounded-full overflow-hidden group"
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//             >
//               <span className="relative z-10 flex items-center gap-2">
//                 Get Started
//                 <ArrowUpRight className="w-4 h-4" />
//               </span>
//               <motion.div
//                 className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-600 to-amber-700"
//                 initial={{ x: '100%' }}
//                 whileHover={{ x: 0 }}
//                 transition={{ duration: 0.3 }}
//               />
//             </motion.a>
//           </div>

//           {/* Mobile Menu Button */}
//           <button
//             onClick={() => setMobileOpen(!mobileOpen)}
//             className="lg:hidden p-2 text-slate-300 hover:text-amber-400"
//           >
//             {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
//           </button>
//         </div>

//         {/* Mobile Menu */}
//         <AnimatePresence>
//           {mobileOpen && (
//             <motion.div
//               className="lg:hidden mt-4 p-4 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-800/50"
//               initial={{ opacity: 0, height: 0 }}
//               animate={{ opacity: 1, height: 'auto' }}
//               exit={{ opacity: 0, height: 0 }}
//               transition={{ duration: 0.3 }}
//             >
//               <nav className="flex flex-col gap-2">
//                 {navItems.map((item) => (
//                   <a
//                     key={item.label}
//                     href={item.href}
//                     className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-amber-400 hover:bg-slate-800/50 rounded-lg transition-colors"
//                     onClick={() => setMobileOpen(false)}
//                   >
//                     <item.icon className="w-4 h-4" />
//                     {item.label}
//                   </a>
//                 ))}
//                 <div className="flex flex-col gap-2 mt-4">
//                   <a
//                     href="/login"
//                     className="px-4 py-3 text-center text-sm font-medium text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800/50"
//                   >
//                     Login
//                   </a>
//                   <a
//                     href="/signup"
//                     className="px-4 py-3 text-center text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 rounded-lg"
//                   >
//                     Get Started
//                   </a>
//                 </div>
//               </nav>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     </motion.header>
//   );
// };

// export default Header;

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <a href="/" className="relative group cursor-pointer" aria-label="Arthasarthi by arQai">
      <motion.div
        className="relative rounded-3xl border border-white/20 px-5 py-3 shadow-2xl backdrop-blur-xl"
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.97 }}
        style={{
          background:
            'linear-gradient(135deg, rgba(248,250,252,0.14) 0%, rgba(15,23,42,0.9) 60%, rgba(15,23,42,0.98) 100%)',
        }}
      >
        {/* Animated border glow */}
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
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

        <div className="relative z-10 flex flex-col gap-1">
          {/* Top: arQai wordmark (company) */}
          <div className="flex items-center gap-2">
            {/* Floating orb */}
            <motion.div
              className="h-2.5 w-2.5 rounded-full border-2 border-white/70 shadow-xl backdrop-blur-sm"
              style={{
                background:
                  'linear-gradient(135deg,#FFF7ED 0%,#FDBA74 40%,#FB923C 100%)',
                filter: 'drop-shadow(0 0 8px rgba(255, 237, 213, 0.8))',
              }}
              animate={{
                rotate: 360,
                scale: [1, 1.15, 1],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              variants={orbVariants}
              initial="rest"
              whileHover="hover"
            />

            {/* arQai text */}
            <span
              className="text-base font-light tracking-tight inline-flex items-center"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #FFF7ED 0%, #FED7AA 40%, #FDBA74 70%, #FFFBEB 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 6px rgba(248, 250, 252, 0.3))',
              }}
            >
              <motion.span className="font-normal">ar</motion.span>

              <motion.span
                className="mx-0.5 origin-center font-medium relative"
                style={{
                  display: 'inline-block',
                  backgroundImage:
                    'linear-gradient(135deg, #FDBA74 0%, #FB923C 40%, #EA580C 80%, #FFEDD5 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
                animate={{
                  rotateY: [0, 360],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  rotateY: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
                  scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                Q
              </motion.span>

              <motion.span className="font-normal">a</motion.span>

              <span className="font-normal relative">
                <motion.span
                  style={{
                    background:
                      'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 60%, #FEF9C3 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  ı
                </motion.span>

                {/* Dot + ring */}
                <motion.div
                  className="absolute h-1.5 w-1.5 rounded-full bg-gradient-to-r from-orange-400 to-amber-300"
                  style={{
                    top: '1px',
                    left: '20%',
                    transform: 'translateX(-50%)',
                    filter: 'drop-shadow(0 0 4px rgba(249, 115, 22, 0.9))',
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute h-3 w-3 rounded-full border border-orange-300/40"
                  style={{
                    top: '-1px',
                    left: '20%',
                    transform: 'translateX(-50%)',
                  }}
                  animate={{
                    scale: [0.5, 1.3, 0.5],
                    opacity: [0.6, 0.1, 0.6],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </span>
            </span>
          </div>

          {/* Divider line */}
          <motion.div
            className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Bottom: Arthasarthi in Hindi (product) - CORRECTED with stress mark */}
          <div className="flex items-center gap-2">
            <motion.span
              className="text-xl font-semibold tracking-tight"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #FCD34D 0%, #FBBF24 30%, #F59E0B 60%, #FDE047 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.4))',
              }}
              animate={{
                textShadow: [
                  '0 0 8px rgba(251, 191, 36, 0.3)',
                  '0 0 16px rgba(251, 191, 36, 0.6)',
                  '0 0 8px rgba(251, 191, 36, 0.3)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              अर्थसारथी
            </motion.span>

            {/* Product badge */}
            {/* <motion.div
              className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-medium text-amber-300/80 bg-amber-500/10 border border-amber-500/20 rounded-full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              .ai
            </motion.div> */}
          </div>
        </div>

        {/* Ambient glow sweep */}
        <motion.div
          className={`absolute -inset-3 rounded-3xl blur-xl bg-gradient-to-r ${HEADER_THEME.logoGlowGradient} opacity-0 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none`}
          animate={{
            scale: [0.95, 1.05, 0.95],
            rotate: [0, 180, 360],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
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
  { href: '#for-ca', label: 'For CAs', icon: ShieldCheck },
  { href: '#for-citizens', label: 'For Citizens', icon: Users },
  { href: '#how-it-works', label: 'How it Works', icon: Sparkles },
  { href: '#security', label: 'Security', icon: Lock },
];

/* ------------------------------------------------------------------ */
/* Header Component                                                   */
/* ------------------------------------------------------------------ */

const Header: React.FC = () => {
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

    window.location.href = href;
    setTimeout(() => {
      setIsNavigating(false);
      setActive(null);
    }, 500);
  };

  const onCta = (path: string): void => {
    setIsNavigating(true);
    window.location.href = path;
    setTimeout(() => setIsNavigating(false), 500);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
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
              const isHot = hovered === href || active === href;
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
                      className={`h-4 w-4 ${
                        isHot ? HEADER_THEME.navIconActive : HEADER_THEME.navIconDefault
                      } transition-colors`}
                    />
                    <span
                      className={`text-sm ${
                        isHot ? HEADER_THEME.navTextActive : HEADER_THEME.navTextDefault
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
                {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                  <button
                    key={href}
                    onClick={() => navigate(href)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-orange-300 hover:bg-slate-800/50 rounded-xl transition-colors text-left w-full"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                ))}
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