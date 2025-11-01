"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Scale, BookOpen, Shield, HelpCircle, Menu, X, Gavel } from "lucide-react";

/**
 * LegalAILogo displays the animated, premium-styled company logo.
 * Enhanced version with legal-themed visual effects and improved animations.
 */
const LegalAILogo: React.FC = () => {
  const ballVariants = {
    rest: { 
      backgroundColor: "#FFFFFF",
      boxShadow: "0 0 8px rgba(255, 255, 255, 0.3)"
    },
    hover: { 
      backgroundColor: "#F0F9FF",
      boxShadow: "0 0 16px rgba(240, 249, 255, 0.6)"
    },
  } as const;

  return (
    <Link href="/" className="relative group cursor-pointer" aria-label="Legal AI home">
      <motion.div
        className="relative px-8 py-4 bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl hover:shadow-amber-500/20 transition-all duration-500"
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.05) 100%)",
        }}
      >
        {/* Animated border glow */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: "linear-gradient(45deg, transparent, rgba(251, 191, 36, 0.3), transparent, rgba(220, 38, 38, 0.3), transparent)",
            backgroundSize: "300% 300%",
          }}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <div className="flex items-center gap-3 relative z-10">
          {/* Scale Icon */}
          <motion.div
            className="relative"
            animate={{ 
              rotateY: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              rotateY: { duration: 8, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <Scale
              size={32}
              className="text-white drop-shadow-lg"
              style={{
                filter: "drop-shadow(0 0 12px rgba(251, 191, 36, 0.8))",
              }}
            />
            {/* Scale enhancement glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-amber-400/30 to-red-400/30 rounded-lg blur-sm"
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          <span
            className="text-3xl font-light tracking-tight inline-flex items-center"
            style={{
              backgroundImage: "linear-gradient(135deg, #FFFFFF 0%, #fef3c7 30%, #fbbf24 60%, #FFFFFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 8px rgba(251, 191, 36, 0.3))",
            }}
          >
            <motion.span 
              className="font-medium"
              animate={{ 
                textShadow: [
                  "0 0 8px rgba(255, 255, 255, 0.3)",
                  "0 0 16px rgba(251, 191, 36, 0.4)",
                  "0 0 8px rgba(255, 255, 255, 0.3)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              Legal
            </motion.span>
            <motion.span 
              className="font-bold ml-2"
              style={{
                backgroundImage: "linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #fbbf24 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
              animate={{ 
                textShadow: [
                  "0 0 8px rgba(220, 38, 38, 0.3)",
                  "0 0 16px rgba(239, 68, 68, 0.4)",
                  "0 0 8px rgba(220, 38, 38, 0.3)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              AI
            </motion.span>
          </span>
        </div>

        {/* Enhanced floating gavel */}
        <motion.div
          className="absolute -top-2 -right-2"
          animate={{ 
            rotate: [-10, 10, -10],
            y: [-2, 2, -2],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Gavel 
            size={20} 
            className="text-amber-400 drop-shadow-lg"
            style={{
              filter: "drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))",
            }}
          />
        </motion.div>

        {/* Dynamic background gradient */}
        <motion.div
          className="absolute inset-0 rounded-3xl bg-gradient-to-r from-amber-500/10 via-red-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          animate={{ 
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            backgroundSize: ["100% 100%", "120% 120%", "100% 100%"]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
    </Link>
  );
};

/**
 * Navigation link metadata for legal AI.
 */
interface NavigationLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}

/**
 * Header displays the logo and navigation for the legal AI assistant.
 */
const Header: React.FC = () => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [clickedLink, setClickedLink] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationLinks: NavigationLink[] = [
    { href: "#features", label: "Features", icon: Scale },
    { href: "#resources", label: "Legal Resources", icon: BookOpen },
    { href: "#security", label: "Security", icon: Shield },
    { href: "#help", label: "Help", icon: HelpCircle },
  ];

  const handleNavigation = async (
    href: string,
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ): Promise<void> => {
    e.preventDefault();
    setClickedLink(href);
    setIsNavigating(true);
    setIsMobileMenuOpen(false);

    // Smooth scroll to section if it's an anchor link
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      setTimeout(async () => {
        try {
          await router.push(href);
        } finally {
          setIsNavigating(false);
          setClickedLink(null);
        }
      }, 150);
    }

    setTimeout(() => {
      setIsNavigating(false);
      setClickedLink(null);
    }, 1000);
  };

  return (
    <header className="relative z-50" id="top">
      <div className="bg-gradient-to-r from-slate-900 via-zinc-800 to-stone-900 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

        <div className="relative container mx-auto px-6 py-6 flex items-center justify-between">
          {/* Left - Logo and Tagline */}
          <div className="flex items-center gap-6">
            <LegalAILogo />
            <div className="hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-px h-8 bg-white/30" />
                <div className="text-white/80 font-light text-lg tracking-wide">
                  Indian Law Assistant
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navigationLinks.map((link) => {
              const IconComponent = link.icon;
              const isHovered = hoveredLink === link.href;
              const isClicked = clickedLink === link.href;

              return (
                <div key={link.href} className="relative">
                  <Link
                    href={link.href}
                    className="group relative flex flex-col items-center gap-2 py-3 px-4 transition-all duration-200 rounded-xl"
                    onClick={(e) => handleNavigation(link.href, e)}
                    onMouseEnter={() => setHoveredLink(link.href)}
                    onMouseLeave={() => setHoveredLink(null)}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400/20 via-orange-400/20 to-red-400/20 blur-sm"
                      animate={{
                        opacity: isHovered ? 0.8 : 0.3,
                        scale: isClicked ? 0.95 : isHovered ? 1.05 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                    />

                    <motion.div
                      className="absolute inset-0 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20"
                      animate={{
                        borderColor: isHovered
                          ? "rgba(255,255,255,0.4)"
                          : "rgba(255,255,255,0.15)",
                        backgroundColor: isClicked
                          ? "rgba(255,255,255,0.25)"
                          : isHovered
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(255,255,255,0.08)",
                      }}
                      transition={{ duration: 0.2 }}
                    />

                    <motion.div
                      className="relative z-10"
                      animate={{
                        scale: isClicked ? 0.9 : isHovered ? 1.15 : 1,
                        y: isClicked ? 1 : isHovered ? -3 : 0,
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <IconComponent
                        size={24}
                        className={`transition-all duration-300 stroke-[1.5] relative z-10 ${
                          isClicked
                            ? "text-amber-300 drop-shadow-lg"
                            : isHovered
                            ? "text-white drop-shadow-md"
                            : "text-white/80"
                        }`}
                        style={{
                          filter:
                            isHovered || isClicked
                              ? "drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))"
                              : "drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))",
                        }}
                      />
                    </motion.div>

                    <motion.span
                      className={`text-sm font-medium tracking-wide transition-all duration-300 relative z-10 ${
                        isClicked
                          ? "text-amber-300 font-semibold"
                          : isHovered
                          ? "text-white font-medium"
                          : "text-white/85"
                      }`}
                      animate={{
                        y: isClicked ? 1 : isHovered ? -2 : 0,
                        scale: isClicked ? 0.95 : isHovered ? 1.05 : 1,
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      {link.label}
                    </motion.span>

                    {isClicked && (
                      <motion.div
                        className="absolute inset-0 rounded-xl border-2 border-amber-400/50"
                        initial={{ scale: 0.8, opacity: 1 }}
                        animate={{ scale: 1.2, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    )}
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg bg-white/10 border border-white/20"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden absolute top-full left-0 right-0 bg-gradient-to-b from-slate-900 to-zinc-900 border-t border-white/10 shadow-2xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="container mx-auto px-6 py-6">
              <nav className="space-y-4">
                {navigationLinks.map((link) => {
                  const IconComponent = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
                      onClick={(e) => handleNavigation(link.href, e)}
                    >
                      <IconComponent className="w-5 h-5 text-white/80" />
                      <span className="text-white font-medium">{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </motion.div>
        )}

        <div className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent w-full" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
        />
      </div>

      {isNavigating && (
        <motion.div
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-white to-red-400 z-50 shadow-lg"
          initial={{ width: "0%", opacity: 0 }}
          animate={{ width: "100%", opacity: 1, boxShadow: "0 0 20px rgba(251, 191, 36, 0.8)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        />
      )}
    </header>
  );
};

export default Header; 