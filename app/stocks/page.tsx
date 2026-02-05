'use client';

import React from 'react';
import { StockList } from '@/components/stocks/StockList';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Activity, Globe } from 'lucide-react';

/**
 * Stocks Dashboard Page
 * 
 * Displays top stocks across multiple exchanges with:
 * - Exchange tabs (NASDAQ, NYSE, NSE, BSE, LSE)
 * - Search functionality
 * - Paginated stock grid
 * - Real-time price data from backend
 */
export default function StocksDashboard() {
    return (
        <div className="container py-12 px-6 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-blue/20 to-brand-violet/20 border border-brand-blue/20">
                        <TrendingUp className="h-6 w-6 text-brand-blue" />
                    </div>
                    <Badge
                        variant="outline"
                        className="px-3 py-1 border-brand-emerald/30 bg-brand-emerald/5 text-brand-emerald text-xs uppercase tracking-widest"
                    >
                        Algorithmic Signals & Live Data
                    </Badge>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Stock Signals
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                    Track top stocks from major global exchanges. Real-time prices, historical data,
                    and company fundamentals powered by our data pipeline.
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5">
                            <Globe className="h-5 w-5 text-brand-blue" />
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Exchanges</div>
                            <div className="text-lg font-bold text-white">5</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5">
                            <Activity className="h-5 w-5 text-brand-emerald" />
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Stocks Tracked</div>
                            <div className="text-lg font-bold text-white">500+</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5">
                            <TrendingUp className="h-5 w-5 text-brand-violet" />
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Data Updates</div>
                            <div className="text-lg font-bold text-white">Every 5m</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5">
                            <Activity className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Historical</div>
                            <div className="text-lg font-bold text-white">10+ Years</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stock List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <StockList initialExchange="NASDAQ" pageSize={50} />
            </motion.div>
        </div>
    );
}
