"use client";

import React from "react";
import { Scale, Lock, BookOpen } from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  id: number;
  title: string;
  links: FooterLink[];
}

const footerColumns: FooterColumn[] = [
  {
    id: 1,
    title: "Product",
    links: [
      { label: "Overview", href: "#features" },
      { label: "Use cases", href: "#solutions" },
      { label: "Pricing", href: "#pricing" },
      { label: "Changelog", href: "#resources" },
    ],
  },
  {
    id: 2,
    title: "Solutions",
    links: [
      { label: "Law firms", href: "#solutions" },
      { label: "In-house teams", href: "#solutions" },
      { label: "Boutique practices", href: "#solutions" },
    ],
  },
  {
    id: 3,
    title: "Security",
    links: [
      { label: "Governance", href: "#trust" },
      { label: "Data privacy", href: "#trust" },
      { label: "Deployment options", href: "#trust" },
    ],
  },
  {
    id: 4,
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Blog", href: "#resources" },
      { label: "Case studies", href: "#resources" },
    ],
  },
  {
    id: 5,
    title: "Legal",
    links: [
      { label: "Terms of service", href: "#" },
      { label: "Privacy policy", href: "#" },
      { label: "Cookie policy", href: "#" },
    ],
  },
];

const LegalFooter: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800/70 bg-[#020617]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <div className="grid gap-8 md:grid-cols-[2fr,3fr]">
          {/* Brand + description */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-sky-500">
                <div className="absolute inset-[2px] rounded-[0.7rem] bg-slate-950" />
                <Scale className="relative z-10 mx-auto mt-2 h-4.5 w-4.5 text-emerald-200" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-50">
                  arQai Legal Co-pilot
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
                        className="hover:text-emerald-300 transition-colors"
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
          <span>© {year} arQai. All rights reserved.</span>
          <span className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3 w-3" />
              <span>Secure by design</span>
            </span>
            <span className="hidden text-slate-600 md:inline">·</span>
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              <span>Built for legal teams</span>
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default LegalFooter;
