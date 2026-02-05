'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart2 } from 'lucide-react';
import NextLink from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function StockAnalyticsPage() {
    const params = useParams();
    const ticker = typeof params.ticker === 'string' ? params.ticker.toUpperCase() : '';

    return (
        <div className="container py-12 px-6 max-w-7xl mx-auto">
            {/* Header / Back */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-8"
            >
                <NextLink href="/stocks">
                    <Button variant="ghost" className="text-muted-foreground hover:text-white pl-0 gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Stock Signals
                    </Button>
                </NextLink>
            </motion.div>

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-8"
            >
                {/* Title Section */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-bold text-white">{ticker}</h1>
                            <Badge variant="outline" className="border-white/20 text-white/50">
                                NASDAQ
                            </Badge>
                        </div>
                        <p className="text-lg text-muted-foreground">Detailed Analytics & Algo Signals</p>
                    </div>
                </div>

                {/* Placeholder Content Area */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Chart Placeholder */}
                    <div className="md:col-span-2 h-[400px] rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center p-8 text-center">
                        <BarChart2 className="h-16 w-16 text-brand-blue mb-4 opacity-50" />
                        <h3 className="text-xl font-medium text-white mb-2">Technical Analysis Chart</h3>
                        <p className="text-muted-foreground max-w-md">
                            Interactive charts with algorithm overlays coming in the next phase.
                        </p>
                    </div>

                    {/* Stats / Signals */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                                Signal Strength
                            </h3>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-3 w-3 rounded-full bg-slate-300 animate-pulse" />
                                <span className="text-2xl font-bold text-white">Neutral</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Algorithm is currently watching for a breakout pattern.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                                Key Levels
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Resistance</span>
                                    <span className="text-red-400 font-mono">Loading...</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Support</span>
                                    <span className="text-emerald-400 font-mono">Loading...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
