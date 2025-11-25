'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, ShieldCheck, ExternalLink } from 'lucide-react';

/**
 * Footer Component
 * 
 * Minimal, clean footer design - visually distinct from header.
 * Follows a simple 2-column layout with reduced vertical space.
 */

interface FooterLinkProps {
  readonly href: string;
  readonly children: React.ReactNode;
  readonly external?: boolean;
}

const FooterLink: React.FC<FooterLinkProps> = ({ href, children, external = false }) => {
  const className = "text-sm text-slate-400 hover:text-amber-400 transition-colors duration-200";

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} inline-flex items-center gap-1`}
      >
        {children}
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
};

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-slate-800/50 bg-slate-950/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Main Footer Content - 2 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          {/* Left Column: Brand and Description */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">
                <span className="text-transparent bg-gradient-to-r from-orange-300 via-amber-200 to-yellow-300 bg-clip-text">
                  अर्थसारथी
                </span>
              </h2>
              <span className="text-slate-500 text-sm">by arQai</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              AI-powered financial compliance and tax optimization platform for professionals and individuals.
            </p>

            {/* Security Badges */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <Lock className="w-3.5 h-3.5" />
                Secured in India
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5" />
                ISO 27001 Certified
              </span>
            </div>
          </div>

          {/* Right Column: Links Grid */}
          <div className="grid grid-cols-2 gap-6 md:justify-self-end">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-50 mb-3">Product</h3>
              <nav className="flex flex-col space-y-2">
                <FooterLink href="/ca-view">For CAs</FooterLink>
                <FooterLink href="/folk-view">For Citizens</FooterLink>
                <FooterLink href="/#security">Security</FooterLink>
              </nav>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-50 mb-3">Company</h3>
              <nav className="flex flex-col space-y-2">
                <FooterLink href="/about">About</FooterLink>
                <FooterLink href="/privacy">Privacy</FooterLink>
                <FooterLink href="/terms">Terms</FooterLink>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Copyright */}
        <div className="pt-6 border-t border-slate-800/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>
              © {currentYear} Arthasarthi. All rights reserved.
            </p>
            <p>
              Built with precision for the future of finance.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
