'use client';

import React from 'react';
import { Scale, Lock, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface FooterLink {
  readonly label: string;
  readonly href: string;
}

interface FooterColumn {
  readonly id: number;
  readonly title: string;
  readonly links: FooterLink[];
}

interface FooterThemeTokens {
  readonly background: string;
  readonly border: string;
  readonly accentGradient: string;
  readonly accentIcon: string;
  readonly accentText: string;
  readonly linkHover: string;
  readonly chipBg: string;
}

const getFooterTheme = (): FooterThemeTokens => ({
  background:
    'bg-[radial-gradient(circle_at_top,_#050308,_#020617)]',
  border: 'border-slate-800/70',
  accentGradient: 'from-orange-400 via-amber-400 to-yellow-400',
  accentIcon: 'text-orange-200',
  accentText: 'text-orange-200',
  linkHover: 'hover:text-orange-300',
  chipBg: 'bg-slate-900/80',
});

const FOOTER_THEME: FooterThemeTokens = getFooterTheme();

const footerColumns: FooterColumn[] = [
  {
    id: 1,
    title: 'Product',
    links: [
      { label: 'Overview', href: '#features' },
      { label: 'Use cases', href: '#solutions' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Changelog', href: '#resources' },
    ],
  },
  {
    id: 2,
    title: 'Solutions',
    links: [
      { label: 'Law firms', href: '#solutions' },
      { label: 'In-house teams', href: '#solutions' },
      { label: 'Boutique practices', href: '#solutions' },
    ],
  },
  {
    id: 3,
    title: 'Security',
    links: [
      { label: 'Governance', href: '#trust' },
      { label: 'Data privacy', href: '#trust' },
      { label: 'Deployment options', href: '#trust' },
    ],
  },
  {
    id: 4,
    title: 'Company',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Blog', href: '#resources' },
      { label: 'Case studies', href: '#resources' },
    ],
  },
  {
    id: 5,
    title: 'Legal',
    links: [
      { label: 'Terms of service', href: '#' },
      { label: 'Privacy policy', href: '#' },
      { label: 'Cookie policy', href: '#' },
    ],
  },
];

const LegalFooter: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      className={`${FOOTER_THEME.background} border-t ${FOOTER_THEME.border}`}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <div className="grid gap-8 md:grid-cols-[2fr,3fr]">
          {/* Brand + description */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10">
                {/* Soft animated glow */}
                <motion.div
                  className="absolute inset-0 rounded-2xl blur-md bg-gradient-to-br from-orange-500/30 via-amber-400/25 to-yellow-400/30"
                  animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.05, 0.95] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="relative h-full w-full rounded-2xl border border-slate-800/80 bg-slate-950 flex items-center justify-center">
                  <div className="absolute inset-[3px] rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(248,250,252,0.12),_transparent)]" />
                  <Scale
                    className={`relative z-10 h-5 w-5 ${FOOTER_THEME.accentIcon}`}
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-50">
                  arQai <span className={FOOTER_THEME.accentText}>legalaid</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  AI-native workspace for litigation and advisory teams.
                </p>
              </div>
            </div>
            <p className="max-w-sm text-xs text-slate-400">
              Designed to help Indian and global legal teams move faster without
              compromising on depth, governance, or client trust.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid gap-6 text-xs text-slate-300 sm:grid-cols-3 md:grid-cols-5">
            {footerColumns.map((column) => (
              <div key={column.id} className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {column.title}
                </p>
                <ul className="space-y-1.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className={`transition-colors ${FOOTER_THEME.linkHover}`}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-slate-800/70 pt-4 text-[11px] text-slate-500 md:flex-row">
          <span>© {year} arQai legalaid. All rights reserved.</span>
          <span className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${FOOTER_THEME.chipBg}`}
            >
              <Lock className="h-3 w-3 text-orange-300" />
              <span>Secure by design</span>
            </span>
            <span className="hidden text-slate-600 md:inline">·</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${FOOTER_THEME.chipBg}`}
            >
              <BookOpen className="h-3 w-3 text-orange-300" />
              <span>Built for legal teams</span>
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default LegalFooter;
