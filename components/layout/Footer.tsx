import React from 'react';
import Link from 'next/link';

export function Footer() {
    return (
        <footer className="w-full border-t border-white/10 bg-brand-slate py-12">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <span className="text-xl font-bold tracking-tight gradient-text mb-4 block">MarketSignal AI</span>
                        <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
                            AI-powered investment research and signals platform. Providing real-time monitoring and sourced insights without buy/sell recommendations.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/signals" className="hover:text-white transition-colors">Pulse</Link></li>
                            <li><Link href="/forex" className="hover:text-white transition-colors">Forex</Link></li>
                            <li><Link href="/assistant" className="hover:text-white transition-colors">AI Assistant</Link></li>
                            <li><Link href="/research" className="hover:text-white transition-colors">Research Library</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/legal" className="hover:text-white transition-colors">Legal & Compliance</Link></li>
                            <li><Link href="/settings" className="hover:text-white transition-colors">Settings</Link></li>
                            <li><a href="mailto:support@marketsignal.ai" className="hover:text-white transition-colors">Support</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} MarketSignal AI. All rights reserved.
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                        Information only — not investment advice
                    </p>
                </div>
            </div>
        </footer>
    );
}
