'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Zap, Search, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
    return (
        <div className="flex flex-col items-center">
            {/* Hero Section */}
            <section className="w-full pt-20 pb-32 px-6">
                <div className="container max-w-6xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Badge variant="outline" className="mb-6 px-4 py-1 border-brand-blue/30 bg-brand-blue/5 text-brand-blue text-xs uppercase tracking-widest">
                            Next-Gen Investment Research
                        </Badge>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8 leading-[1.1]">
                            Ask anything about the market. <br />
                            <span className="gradient-text">Get sourced answers.</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
                            Fast, explainable research and continuous automated monitoring.
                            Professional-grade signals without the noise of buy/sell recommendations.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/assistant">
                                <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-brand-blue to-brand-violet hover:opacity-90 transition-opacity">
                                    Try AI Assistant
                                </Button>
                            </Link>
                            <Link href="/signals">
                                <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/10 bg-white/5 hover:bg-white/10 text-white">
                                    View Live Signals
                                </Button>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Stats / Proof Points */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 border-y border-white/5 py-12"
                    >
                        {[
                            { label: 'Latency', value: '< 800ms' },
                            { label: 'Sources per Answer', value: '12+' },
                            { label: 'Signals Monitored', value: '50k+' },
                            { label: 'Accuracy Rating', value: '99.4%' },
                        ].map((stat) => (
                            <div key={stat.label}>
                                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="w-full py-32 px-6 bg-white/[0.02]">
                <div className="container max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="space-y-4">
                            <div className="h-12 w-12 rounded-2xl bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
                                <Zap className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Real-time Signals</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Automated monitoring of macro shifts, sector shocks, and correlation breakdowns as they happen.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                                <Search className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Sourced Research</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Every insight is backed by verifiable institutional data and news sources with relevance scores.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="h-12 w-12 rounded-2xl bg-brand-violet/10 flex items-center justify-center text-brand-violet">
                                <Shield className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Purely Informational</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Strict compliance filtering ensures you get data and analysis without biased buy/sell instructions.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="w-full py-32 px-6">
                <div className="container max-w-4xl mx-auto">
                    <div className="glass-card p-12 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/10 to-brand-violet/10 pointer-events-none" />
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to upgrade your research?</h2>
                        <p className="text-muted-foreground mb-10 max-w-lg mx-auto">
                            Join institutional investors using MarketSignal AI for faster, more reliable market intelligence.
                        </p>
                        <Link href="/assistant">
                            <Button size="lg" className="bg-white text-brand-slate hover:bg-white/90">
                                Get Started Now
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

