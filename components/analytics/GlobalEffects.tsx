'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Globe, TrendingUp, TrendingDown } from 'lucide-react';
import { getGlobalIndices } from '@/src/lib/api/analyticsApi';
import type { IGlobalEffects } from '@/types/analytics';
import { cn } from '@/lib/utils';

const EXCHANGE_COLORS: Record<string, string> = {
  TSE: '#EF4444',
  SGX: '#F59E0B',
  HKSE: '#EF4444',
  NSE: '#6EE7B7',
  LSE: '#60A5FA',
  NYSE: '#818CF8',
  NASDAQ: '#A78BFA',
};

export function GlobalEffects() {
  const [data, setData] = useState<IGlobalEffects | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const result = await getGlobalIndices();
      if (result.success && result.data) {
        setData(result.data);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Global index data not yet available. Syncs every 15 minutes.</p>
      </div>
    );
  }

  const { indices, timeline, pre_market_signal } = data;

  return (
    <div className="space-y-6">
      {/* Pre-Market Signal */}
      {pre_market_signal && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'p-4 rounded-xl border',
            pre_market_signal.direction === 'bullish'
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : pre_market_signal.direction === 'bearish'
              ? 'border-red-500/30 bg-red-500/5'
              : 'border-white/10 bg-white/[0.02]',
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <Globe className="h-5 w-5 text-brand-blue" />
            <span className="text-sm font-semibold text-white">Pre-Market Signal</span>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium capitalize',
                pre_market_signal.direction === 'bullish' && 'bg-emerald-500/20 text-emerald-400',
                pre_market_signal.direction === 'bearish' && 'bg-red-500/20 text-red-400',
                pre_market_signal.direction === 'neutral' && 'bg-slate-500/20 text-slate-400',
              )}
            >
              {pre_market_signal.direction}
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto">
              Confidence: {pre_market_signal.confidence}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Based on overnight global movements, NSE likely opens{' '}
            <span className={cn(
              'font-semibold',
              pre_market_signal.estimated_gap_pct >= 0 ? 'text-emerald-400' : 'text-red-400',
            )}>
              {pre_market_signal.estimated_gap_pct >= 0 ? '+' : ''}
              {pre_market_signal.estimated_gap_pct.toFixed(2)}%
            </span>
          </p>
        </motion.div>
      )}

      {/* Global Index Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {indices.map((idx, i) => (
          <motion.div
            key={idx.index_name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: EXCHANGE_COLORS[idx.exchange] || '#64748B' }}
              />
              <span className="text-xs font-medium text-muted-foreground">{idx.exchange}</span>
              <span
                className={cn(
                  'ml-auto text-[10px] px-1.5 py-0.5 rounded-full',
                  idx.market_status === 'open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400',
                )}
              >
                {idx.market_status}
              </span>
            </div>
            <div className="text-sm font-bold text-white">{idx.display_name}</div>
            <div className="flex items-center gap-2 mt-1">
              {idx.value != null ? (
                <>
                  <span className="text-lg font-bold text-white">
                    {idx.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  {idx.change_pct != null && (
                    <span
                      className={cn(
                        'text-xs font-semibold flex items-center gap-0.5',
                        idx.change_pct >= 0 ? 'text-emerald-400' : 'text-red-400',
                      )}
                    >
                      {idx.change_pct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {idx.change_pct >= 0 ? '+' : ''}
                      {idx.change_pct.toFixed(2)}%
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm text-muted-foreground">No data</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Market Timeline */}
      <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <h3 className="text-sm font-semibold text-white mb-4">Market Timeline (IST)</h3>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[60px] top-0 bottom-0 w-px bg-white/10" />

          {timeline.map((item, i) => {
            const matchedIndex = indices.find((idx) => idx.index_name === item.index);
            const changePct = matchedIndex?.change_pct;

            return (
              <motion.div
                key={item.index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 py-2 relative"
              >
                <span className="text-xs text-muted-foreground font-mono w-[52px] text-right">
                  {item.opens_ist}
                </span>
                <div
                  className="h-3 w-3 rounded-full border-2 border-white/20 z-10"
                  style={{ backgroundColor: EXCHANGE_COLORS[matchedIndex?.exchange ?? ''] || '#64748B' }}
                />
                <span className="text-sm text-white font-medium">
                  {matchedIndex?.display_name ?? item.index}
                </span>
                {changePct != null && (
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      changePct >= 0 ? 'text-emerald-400' : 'text-red-400',
                    )}
                  >
                    {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground ml-auto">
                  closes {item.closes_ist}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
