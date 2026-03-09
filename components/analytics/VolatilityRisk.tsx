'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Activity, AlertTriangle, Shield, TrendingUp, TrendingDown } from 'lucide-react';
import { getAllVolatility } from '@/src/lib/api/analyticsApi';
import type { IVolatilityMetrics } from '@/types/analytics';
import { cn } from '@/lib/utils';

type SortKey = 'hv' | 'beta' | 'sharpe' | 'drawdown' | 'var';

export function VolatilityRisk() {
  const [data, setData] = useState<IVolatilityMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('hv');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const result = await getAllVolatility();
      if (result.success && result.data) {
        setData(result.data.items ?? []);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Compute market-level aggregates
  const marketStats = useMemo(() => {
    if (data.length === 0) return null;
    const hvValues = data.filter((d) => d.hv_20d != null).map((d) => d.hv_20d!);
    const avgHV = hvValues.length > 0 ? hvValues.reduce((a, b) => a + b, 0) / hvValues.length : 0;

    const sharpeValues = data.filter((d) => d.sharpe_proxy != null).map((d) => d.sharpe_proxy!);
    const avgSharpe = sharpeValues.length > 0 ? sharpeValues.reduce((a, b) => a + b, 0) / sharpeValues.length : 0;

    let fearLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME' = 'LOW';
    if (avgHV > 0.4) fearLevel = 'EXTREME';
    else if (avgHV > 0.3) fearLevel = 'HIGH';
    else if (avgHV > 0.2) fearLevel = 'MODERATE';

    return { avgHV, avgSharpe, fearLevel, count: data.length };
  }, [data]);

  const sorted = useMemo(() => {
    const copy = [...data];
    copy.sort((a, b) => {
      switch (sortBy) {
        case 'hv': return (b.hv_20d ?? 0) - (a.hv_20d ?? 0);
        case 'beta': return Math.abs(b.beta_90d ?? 0) - Math.abs(a.beta_90d ?? 0);
        case 'sharpe': return (b.sharpe_proxy ?? -99) - (a.sharpe_proxy ?? -99);
        case 'drawdown': return (a.max_drawdown ?? 0) - (b.max_drawdown ?? 0);
        case 'var': return (b.var_95_1d ?? 0) - (a.var_95_1d ?? 0);
        default: return 0;
      }
    });
    return copy;
  }, [data, sortBy]);

  // For the SVG scatter plot
  const scatterData = useMemo(() => {
    return data
      .filter((d) => d.hv_20d != null && d.annualized_return != null)
      .map((d) => ({
        ticker: d.ticker,
        hv: d.hv_20d!,
        ret: d.annualized_return!,
        sharpe: d.sharpe_proxy ?? 0,
        beta: d.beta_90d ?? 1,
      }));
  }, [data]);

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
        <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Volatility data not yet available. Computed daily after market close.</p>
      </div>
    );
  }

  const fearColors = {
    LOW: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    MODERATE: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    HIGH: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
    EXTREME: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  };

  const fc = marketStats ? fearColors[marketStats.fearLevel] : fearColors.LOW;

  return (
    <div className="space-y-6">
      {/* Market Fear Gauge + Risk-Return Scatter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fear Gauge */}
        {marketStats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('p-5 rounded-xl border', fc.border, fc.bg)}
          >
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className={cn('h-5 w-5', fc.text)} />
              <span className="text-sm font-semibold text-white">Market Volatility Gauge</span>
            </div>
            <div className="flex items-end gap-4">
              <div>
                <div className={cn('text-3xl font-bold', fc.text)}>
                  {marketStats.fearLevel}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Avg 20-day HV: {(marketStats.avgHV * 100).toFixed(1)}%
                </div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-xs text-muted-foreground">Avg Sharpe</div>
                <div className={cn(
                  'text-lg font-bold',
                  marketStats.avgSharpe >= 1 ? 'text-emerald-400' :
                  marketStats.avgSharpe >= 0 ? 'text-yellow-400' : 'text-red-400'
                )}>
                  {marketStats.avgSharpe.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Gauge bar */}
            <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(marketStats.avgHV * 250, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn(
                  'h-full rounded-full',
                  marketStats.fearLevel === 'LOW' && 'bg-emerald-500',
                  marketStats.fearLevel === 'MODERATE' && 'bg-yellow-500',
                  marketStats.fearLevel === 'HIGH' && 'bg-orange-500',
                  marketStats.fearLevel === 'EXTREME' && 'bg-red-500',
                )}
              />
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
              <span>Low</span><span>Moderate</span><span>High</span><span>Extreme</span>
            </div>
          </motion.div>
        )}

        {/* Risk-Return Scatter */}
        {scatterData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-brand-blue" />
              <span className="text-sm font-semibold text-white">Risk vs Return</span>
              <span className="text-[10px] text-muted-foreground ml-auto">hover for detail</span>
            </div>

            <svg viewBox="0 0 400 250" className="w-full h-48">
              {(() => {
                const hvs = scatterData.map((d) => d.hv);
                const rets = scatterData.map((d) => d.ret);
                const minHV = Math.min(...hvs) * 0.9;
                const maxHV = Math.max(...hvs) * 1.1;
                const minRet = Math.min(...rets, -0.1);
                const maxRet = Math.max(...rets, 0.1);

                const xScale = (hv: number) => 40 + ((hv - minHV) / (maxHV - minHV || 1)) * 340;
                const yScale = (ret: number) => 230 - ((ret - minRet) / (maxRet - minRet || 1)) * 210;

                return (
                  <g>
                    {/* Axes */}
                    <line x1="40" y1="230" x2="380" y2="230" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <line x1="40" y1="20" x2="40" y2="230" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                    {/* Zero return line */}
                    {minRet < 0 && maxRet > 0 && (
                      <line
                        x1="40" y1={yScale(0)} x2="380" y2={yScale(0)}
                        stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4"
                      />
                    )}

                    {/* Axis labels */}
                    <text x="210" y="248" fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="middle">
                      Volatility (20d HV)
                    </text>
                    <text x="12" y="125" fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="middle" transform="rotate(-90, 12, 125)">
                      Return
                    </text>

                    {/* Data points */}
                    {scatterData.map((d) => {
                      const cx = xScale(d.hv);
                      const cy = yScale(d.ret);
                      const isStar = d.sharpe >= 1.5;
                      const color = d.ret >= 0 ? '#6EE7B7' : '#FCA5A5';

                      return (
                        <g key={d.ticker}>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isStar ? 6 : 4}
                            fill={color}
                            fillOpacity={0.6}
                            stroke={isStar ? '#FBBF24' : 'none'}
                            strokeWidth={isStar ? 1.5 : 0}
                          >
                            <title>{`${d.ticker}\nHV: ${(d.hv * 100).toFixed(1)}%\nReturn: ${(d.ret * 100).toFixed(1)}%\nSharpe: ${d.sharpe.toFixed(2)}\nBeta: ${d.beta.toFixed(2)}`}</title>
                          </circle>
                          <text
                            x={cx}
                            y={cy - 7}
                            fill="rgba(255,255,255,0.5)"
                            fontSize="7"
                            textAnchor="middle"
                          >
                            {d.ticker.slice(0, 6)}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })()}
            </svg>

            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" /> Positive return
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-300 inline-block" /> Negative return
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full border border-yellow-400 inline-block" /> Sharpe &gt; 1.5
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Sort by:</span>
        {([
          ['hv', 'Volatility'],
          ['beta', 'Beta'],
          ['sharpe', 'Sharpe'],
          ['drawdown', 'Drawdown'],
          ['var', 'VaR'],
        ] as [SortKey, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-colors',
              sortBy === key
                ? 'bg-brand-blue/20 text-brand-blue'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stock Risk Table */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="grid grid-cols-7 gap-2 px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase border-b border-white/5">
          <span>Ticker</span>
          <span className="text-right">HV (20d)</span>
          <span className="text-right">Beta</span>
          <span className="text-right">Sharpe</span>
          <span className="text-right">Return</span>
          <span className="text-right">Max DD</span>
          <span className="text-right">VaR 95%</span>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {sorted.map((stock, i) => (
            <motion.div
              key={stock.ticker}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="grid grid-cols-7 gap-2 px-4 py-2.5 text-xs border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors"
            >
              <span className="font-semibold text-white">{stock.ticker}</span>

              <span className={cn(
                'text-right font-mono',
                (stock.hv_20d ?? 0) > 0.3 ? 'text-red-400' :
                (stock.hv_20d ?? 0) > 0.2 ? 'text-yellow-400' : 'text-emerald-400',
              )}>
                {stock.hv_20d != null ? `${(stock.hv_20d * 100).toFixed(1)}%` : '—'}
              </span>

              <span className={cn(
                'text-right font-mono',
                (stock.beta_90d ?? 1) > 1.2 ? 'text-red-400' :
                (stock.beta_90d ?? 1) < 0.8 ? 'text-blue-400' : 'text-white',
              )}>
                {stock.beta_90d != null ? stock.beta_90d.toFixed(2) : '—'}
              </span>

              <span className={cn(
                'text-right font-mono',
                (stock.sharpe_proxy ?? 0) >= 1.5 ? 'text-emerald-400' :
                (stock.sharpe_proxy ?? 0) >= 0 ? 'text-yellow-400' : 'text-red-400',
              )}>
                {stock.sharpe_proxy != null ? stock.sharpe_proxy.toFixed(2) : '—'}
              </span>

              <span className={cn(
                'text-right font-mono flex items-center justify-end gap-0.5',
              )}>
                {stock.annualized_return != null ? (
                  <>
                    {stock.annualized_return >= 0
                      ? <TrendingUp className="h-3 w-3 text-emerald-400" />
                      : <TrendingDown className="h-3 w-3 text-red-400" />
                    }
                    <span className={stock.annualized_return >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {(stock.annualized_return * 100).toFixed(1)}%
                    </span>
                  </>
                ) : '—'}
              </span>

              <span className="text-right font-mono text-red-400">
                {stock.max_drawdown != null ? `${(stock.max_drawdown * 100).toFixed(1)}%` : '—'}
              </span>

              <span className="text-right font-mono text-orange-400">
                {stock.var_95_1d != null ? `${(stock.var_95_1d * 100).toFixed(1)}%` : '—'}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
