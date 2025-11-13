'use client';

import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { ArthasarthiLogo } from './Header';

const Footer = () => {
  return (
    <footer className="relative border-t border-slate-800/50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2">
            <ArthasarthiLogo />
            <p className="mt-4 text-sm text-slate-400 max-w-md">
              Empowering financial professionals and individuals with AI-driven insights for smarter compliance and tax optimization.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-slate-50 mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#for-ca" className="hover:text-amber-400 transition-colors">For CAs</a></li>
              <li><a href="#for-citizens" className="hover:text-amber-400 transition-colors">For Citizens</a></li>
              <li><a href="#security" className="hover:text-amber-400 transition-colors">Security</a></li>
              <li><a href="/pricing" className="hover:text-amber-400 transition-colors">Pricing</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-slate-50 mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="/about" className="hover:text-amber-400 transition-colors">About Us</a></li>
              <li><a href="/contact" className="hover:text-amber-400 transition-colors">Contact</a></li>
              <li><a href="/privacy" className="hover:text-amber-400 transition-colors">Privacy</a></li>
              <li><a href="/terms" className="hover:text-amber-400 transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Arthasarthi. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Secured in India
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              ISO 27001 Certified
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
