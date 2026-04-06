'use client';

import React from 'react';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { FooterCanvas } from './FooterCanvas';

export function Footer() {
    return (
        <footer className="relative w-full border-t border-white/[0.06] bg-brand-slate py-12 overflow-hidden">
            {/* Subtle gradient line at top */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />

            {/* Canvas background (desktop only, auto-pauses off-screen) */}
            <div className="absolute inset-0 pointer-events-none">
                <FooterCanvas />
            </div>

            <div className="container relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <span className="text-xl font-bold tracking-tight gradient-text mb-4 block">
                            {BRAND.fullName}
                        </span>
                        <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
                            {BRAND.description}
                        </p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4">Products</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/" className="hover:text-white transition-colors">Forex Analysis</Link></li>
                            <li><Link href="/pulse" className="hover:text-white transition-colors">Market Pulse</Link></li>
                            <li><Link href="/simulations" className="hover:text-white transition-colors">Simulation Lab</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/signals" className="hover:text-white transition-colors">Pulse Dashboard</Link></li>
                            <li><Link href="/forex" className="hover:text-white transition-colors">Forex Dashboard</Link></li>
                            <li><Link href="/playground" className="hover:text-white transition-colors">Simulation Lab</Link></li>
                            <li><Link href="/assistant" className="hover:text-white transition-colors">AI Assistant</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                            <li><Link href="/legal" className="hover:text-white transition-colors">Legal & Compliance</Link></li>
                            <li><a href={`mailto:${BRAND.support}`} className="hover:text-white transition-colors">Support</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-muted-foreground">
                        &copy; {new Date().getFullYear()} {BRAND.fullName}. All rights reserved.
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                        {BRAND.disclaimer}
                    </p>
                </div>
            </div>
        </footer>
    );
}
