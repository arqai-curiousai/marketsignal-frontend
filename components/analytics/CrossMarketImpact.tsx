'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Zap } from 'lucide-react';
import { getCrossAsset } from '@/src/lib/api/analyticsApi';
import type { ICrossAssetCorrelation } from '@/types/analytics';
import { cn } from '@/lib/utils';

export function CrossMarketImpact() {
  const [data, setData] = useState<ICrossAssetCorrelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'commodity' | 'currency'>('all');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const sourceType = filter === 'all' ? undefined : filter;
      const result = await getCrossAsset(sourceType, undefined, 0.2);
      if (result.success && result.data?.items) {
        setData(result.data.items);
      }
      setLoading(false);
    }
    fetchData();
  }, [filter]);

  // Group by source
  const grouped = data.reduce<Record<string, ICrossAssetCorrelation[]>>((acc, item) => {
    const key = item.source_ticker;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Cross-asset correlation data not yet computed. Refreshes daily at 16:30 IST.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10 w-fit">
        {(['all', 'commodity', 'currency'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize',
              f === filter ? 'bg-brand-blue/30 text-white' : 'text-muted-foreground hover:text-white',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Connection Diagram */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([source, connections], groupIdx) => {
          const sourceType = connections[0]?.source_type ?? 'commodity';
          const sortedConns = [...connections].sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

          return (
            <motion.div
              key={source}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIdx * 0.05 }}
              className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"
            >
              {/* Source header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold',
                    sourceType === 'commodity'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-blue-500/20 text-blue-400',
                  )}
                >
                  {sourceType === 'commodity' ? '₹' : '💱'}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{source}</div>
                  <div className="text-[10px] text-muted-foreground capitalize">{sourceType}</div>
                </div>
              </div>

              {/* Connections */}
              <div className="space-y-2">
                {sortedConns.slice(0, 8).map((conn, connIdx) => {
                  const isPositive = conn.correlation > 0;
                  const absCorr = Math.abs(conn.correlation);
                  const barWidth = `${absCorr * 100}%`;

                  return (
                    <motion.div
                      key={conn.target_ticker}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: connIdx * 0.03 }}
                      className="flex items-center gap-3 group"
                    >
                      {/* Connection line */}
                      <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden relative">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            isPositive ? 'bg-emerald-500/60' : 'bg-red-500/60',
                          )}
                          style={{ width: barWidth }}
                        />
                      </div>

                      {/* Correlation value */}
                      <span
                        className={cn(
                          'text-xs font-mono w-14 text-right',
                          isPositive ? 'text-emerald-400' : 'text-red-400',
                        )}
                      >
                        {conn.correlation > 0 ? '+' : ''}{conn.correlation.toFixed(2)}
                      </span>

                      {/* Arrow */}
                      <span className="text-muted-foreground text-xs">→</span>

                      {/* Target */}
                      <span className="text-sm font-medium text-white">{conn.target_ticker}</span>

                      {/* Strength badge */}
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-full capitalize',
                          conn.relationship_strength === 'strong' && 'bg-emerald-500/10 text-emerald-400',
                          conn.relationship_strength === 'moderate' && 'bg-yellow-500/10 text-yellow-400',
                          conn.relationship_strength === 'weak' && 'bg-slate-500/10 text-slate-400',
                        )}
                      >
                        {conn.relationship_strength}
                      </span>

                      {conn.granger_pvalue != null && conn.granger_pvalue < 0.05 && (
                        <span className="text-[10px] text-brand-violet flex items-center gap-0.5">
                          <Zap className="h-3 w-3" />
                          Causal
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
