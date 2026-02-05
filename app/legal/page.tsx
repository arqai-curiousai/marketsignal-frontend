'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Shield, Info, Scale, Gavel } from 'lucide-react';

export default function LegalPage() {
    return (
        <div className="container py-12 px-6 max-w-4xl">
            <div className="mb-12">
                <h1 className="text-4xl font-bold text-white mb-2">Compliance & Legal</h1>
                <p className="text-muted-foreground">Transparency, methodology, and regulatory disclaimers.</p>
            </div>

            <div className="space-y-12">
                {/* Primary Disclaimer */}
                <section>
                    <Card className="p-8 bg-brand-blue/5 border-brand-blue/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Shield className="h-24 w-24" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <Scale className="h-6 w-6 text-brand-blue" />
                            Investment Disclaimer
                        </h2>
                        <div className="space-y-4 text-white/80 leading-relaxed">
                            <p className="font-bold text-white uppercase tracking-tight">
                                MarketSignal AI is an informational research platform only.
                            </p>
                            <p>
                                The content, signals, and AI-generated analysis provided on this platform do not constitute investment, financial, tax, or legal advice. No part of this platform should be construed as a recommendation to buy, sell, or hold any security or financial instrument.
                            </p>
                            <p>
                                Investing in financial markets involves significant risk. Past performance is not indicative of future results. Always consult with a qualified financial advisor before making any investment decisions.
                            </p>
                        </div>
                    </Card>
                </section>

                {/* AI Methodology */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Info className="h-5 w-5 text-brand-emerald" />
                            AI Methodology
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Our AI Research Assistant uses Retrieval-Augmented Generation (RAG) to synthesize insights from verified institutional data sources. Every response is cross-referenced against multiple feeds to ensure accuracy and reduce hallucinations.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Gavel className="h-5 w-5 text-brand-violet" />
                            Regulatory Compliance
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            We enforce strict &quot;no-recommendation&quot; filters. Our systems are designed to provide data, context, and analysis without crossing the line into personalized investment advice as defined by global financial regulators.
                        </p>
                    </div>
                </section>

                {/* Data Provenance */}
                <section>
                    <h3 className="text-lg font-bold text-white mb-6">Data Provenance Statement</h3>
                    <div className="glass-card p-8 space-y-6">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            MarketSignal AI aggregates data from the following categories of providers:
                        </p>
                        <ul className="space-y-4">
                            <li className="flex gap-4">
                                <div className="h-1.5 w-1.5 rounded-full bg-brand-blue mt-2 flex-shrink-0" />
                                <div>
                                    <span className="text-sm font-medium text-white">Institutional Market Data</span>
                                    <p className="text-xs text-muted-foreground">Real-time pricing, volume, and volatility metrics from global exchanges.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="h-1.5 w-1.5 rounded-full bg-brand-emerald mt-2 flex-shrink-0" />
                                <div>
                                    <span className="text-sm font-medium text-white">Global News Feeds</span>
                                    <p className="text-xs text-muted-foreground">Curated financial news from Bloomberg, Reuters, WSJ, and FT.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="h-1.5 w-1.5 rounded-full bg-brand-violet mt-2 flex-shrink-0" />
                                <div>
                                    <span className="text-sm font-medium text-white">Regulatory Filings</span>
                                    <p className="text-xs text-muted-foreground">Direct integration with SEC EDGAR and other global regulatory repositories.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </section>

                <div className="pt-12 border-t border-white/5 text-center">
                    <p className="text-xs text-muted-foreground">
                        Last updated: January 24, 2026
                    </p>
                </div>
            </div>
        </div>
    );
}
