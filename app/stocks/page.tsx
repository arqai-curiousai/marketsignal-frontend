'use client';

import React from 'react';
import { StockList } from '@/components/stocks/StockList';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Activity, BarChart3, Clock } from 'lucide-react';

/**
 * Stocks Dashboard — NIFTY 50
 *
 * India-first stock dashboard with:
 * - NIFTY 50 stocks from NSE via Kite Connect
 * - Real-time OHLC prices (market hours) or last-day data (after hours)
 * - Sector filtering and search
 * - Professional list/grid views
 */
export default function StocksDashboard() {
    return (
        <div className="container py-8 md:py-12 px-4 md:px-6 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-brand-blue/20 to-brand-violet/20 border border-brand-blue/20">
                        <BarChart3 className="h-5 w-5 text-brand-blue" />
                    </div>
                    <Badge
                        variant="outline"
                        className="px-2.5 py-0.5 border-brand-emerald/30 bg-brand-emerald/5 text-brand-emerald text-[10px] uppercase tracking-widest"
                    >
                        NSE Live Data
                    </Badge>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    NIFTY 50 Stocks
                </h1>
                <p className="text-sm md:text-base text-muted-foreground max-w-xl">
                    Real-time prices and historical data for India&apos;s top 50 stocks,
                    powered by Kite Connect.
                </p>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
                    <StatItem
                        icon={<TrendingUp className="h-4 w-4 text-brand-blue" />}
                        label="Index"
                        value="NIFTY 50"
                    />
                    <StatItem
                        icon={<Activity className="h-4 w-4 text-brand-emerald" />}
                        label="Stocks"
                        value="50"
                    />
                    <StatItem
                        icon={<Clock className="h-4 w-4 text-brand-violet" />}
                        label="Market Hours"
                        value="9:15 - 15:30"
                    />
                    <StatItem
                        icon={<BarChart3 className="h-4 w-4 text-yellow-400" />}
                        label="Exchange"
                        value="NSE India"
                    />
                </div>
            </motion.div>

            {/* Stock List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <StockList initialExchange="NSE" pageSize={50} />
            </motion.div>
        </div>
    );
}

function StatItem({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-white/5">{icon}</div>
            <div>
                <div className="text-[11px] text-muted-foreground">{label}</div>
                <div className="text-sm font-semibold text-white">{value}</div>
            </div>
        </div>
    );
}
