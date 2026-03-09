'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Search, LineChart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getPatterns } from '@/src/lib/api/analyticsApi';
import type { IPatternDetection } from '@/types/analytics';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const DEFAULT_TICKER = 'RELIANCE';

const POPULAR_TICKERS = [
  'RELIANCE', 'HDFCBANK', 'TCS', 'INFY', 'ICICIBANK',
  'SBIN', 'TATASTEEL', 'WIPRO', 'MARUTI', 'TITAN',
];

type ChartOverlay = 'bb' | 'keltner' | 'sma' | 'sr';

export function PatternIdentifier() {
  const [data, setData] = useState<IPatternDetection | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticker, setTicker] = useState(DEFAULT_TICKER);
  const [searchInput, setSearchInput] = useState(DEFAULT_TICKER);
  const [error, setError] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<Set<ChartOverlay>>(() => new Set<ChartOverlay>(['bb', 'sr']));

  const fetchPatterns = useCallback(async (t: string) => {
    setLoading(true);
    setError(null);
    const result = await getPatterns(t);
    if (result.success && result.data) {
      if ('error' in result.data && result.data.error) {
        setError(result.data.error as string);
        setData(null);
      } else {
        setData(result.data);
      }
    } else {
      setError('Failed to fetch patterns. Please ensure you are logged in.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPatterns(ticker);
  }, [ticker, fetchPatterns]);

  const handleSearch = () => {
    if (searchInput.trim()) {
      setTicker(searchInput.trim().toUpperCase());
    }
  };

  const toggleOverlay = (o: ChartOverlay) => {
    setOverlays((prev) => {
      const next = new Set(prev);
      if (next.has(o)) next.delete(o);
      else next.add(o);
      return next;
    });
  };

  const directionIcon = (dir: string) => {
    if (dir === 'bullish') return <TrendingUp className="h-4 w-4 text-emerald-400" />;
    if (dir === 'bearish') return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

  const confColor = (conf: number) => {
    if (conf >= 0.75) return 'text-emerald-400';
    if (conf >= 0.60) return 'text-yellow-400';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-4">
      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Ticker Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter ticker (e.g., RELIANCE)"
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-brand-blue/20 text-brand-blue hover:bg-brand-blue/30 transition-colors"
        >
          Analyze
        </button>
      </div>

      {/* Quick Ticker Select */}
      <div className="flex flex-wrap gap-1.5">
        {POPULAR_TICKERS.map((t) => (
          <button
            key={t}
            onClick={() => {
              setTicker(t);
              setSearchInput(t);
            }}
            className={cn(
              'px-2.5 py-1 text-[11px] font-medium rounded-md border transition-all',
              t === ticker
                ? 'bg-brand-blue/20 border-brand-blue/50 text-white'
                : 'bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:border-white/20',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      )}

      {error && (
        <div className="text-center py-20 text-muted-foreground">
          <LineChart className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Chart Area */}
          {data.chart_data && data.chart_data.length > 0 && (
            <div className="p-4 rounded-xl border border-white/10 bg-[#0d1117]">
              {/* Chart Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">{data.ticker}</span>
                  {data.indicators.current_price && (
                    <span className="text-sm font-bold text-white font-mono">
                      ₹{data.indicators.current_price.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Overlay toggles */}
                <div className="flex items-center gap-1">
                  {([
                    { id: 'bb' as ChartOverlay, label: 'BB', color: 'text-blue-400' },
                    { id: 'keltner' as ChartOverlay, label: 'KC', color: 'text-purple-400' },
                    { id: 'sma' as ChartOverlay, label: 'SMA', color: 'text-yellow-400' },
                    { id: 'sr' as ChartOverlay, label: 'S/R', color: 'text-emerald-400' },
                  ]).map((o) => (
                    <button
                      key={o.id}
                      onClick={() => toggleOverlay(o.id)}
                      className={cn(
                        'px-2 py-0.5 text-[10px] font-medium rounded transition-all border',
                        overlays.has(o.id)
                          ? `${o.color} bg-white/10 border-white/20`
                          : 'text-muted-foreground border-transparent hover:text-white',
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Candlestick + Volume Chart */}
              <svg viewBox="0 0 800 380" className="w-full" style={{ height: 'clamp(250px, 40vw, 380px)' }}>
                {(() => {
                  const chartData = data.chart_data;
                  const overlayData = data.overlay_data || [];
                  const n = chartData.length;
                  if (n === 0) return null;

                  // Price scale
                  const allPrices = chartData.flatMap((d) => [d.high, d.low]);
                  const minP = Math.min(...allPrices) * 0.99;
                  const maxP = Math.max(...allPrices) * 1.01;
                  const priceRange = maxP - minP || 1;

                  // Volume scale
                  const volumes = chartData.map((d) => d.volume);
                  const maxVol = Math.max(...volumes) || 1;

                  const chartTop = 10;
                  const chartBottom = 280;
                  const chartHeight = chartBottom - chartTop;
                  const volTop = 295;
                  const volBottom = 370;
                  const volHeight = volBottom - volTop;
                  const candleWidth = Math.min(Math.max((780 / n) * 0.6, 2), 12);
                  const gap = 780 / n;

                  const xPos = (i: number) => 10 + gap * i + gap / 2;
                  const yPrice = (p: number) => chartBottom - ((p - minP) / priceRange) * chartHeight;

                  // Build overlay paths
                  const buildPath = (vals: (number | null)[]) => {
                    let first = true;
                    return vals
                      .map((v, i) => {
                        if (v == null) return '';
                        const cmd = first ? 'M' : 'L';
                        first = false;
                        return `${cmd} ${xPos(i)} ${yPrice(v)}`;
                      })
                      .filter(Boolean)
                      .join(' ');
                  };

                  return (
                    <g>
                      {/* Grid lines */}
                      {[0.25, 0.5, 0.75].map((pct) => {
                        const y = chartBottom - chartHeight * pct;
                        const price = minP + priceRange * pct;
                        return (
                          <g key={pct}>
                            <line x1="10" y1={y} x2="790" y2={y} stroke="rgba(255,255,255,0.04)" />
                            <text x="795" y={y + 3} className="fill-slate-600 text-[8px]" textAnchor="end">
                              {price.toFixed(0)}
                            </text>
                          </g>
                        );
                      })}

                      {/* BB overlay */}
                      {overlays.has('bb') && (
                        <>
                          {buildPath(overlayData.map((d) => d.bb_upper)) && (
                            <path d={buildPath(overlayData.map((d) => d.bb_upper))} fill="none" stroke="rgba(96,165,250,0.4)" strokeWidth="1" />
                          )}
                          {buildPath(overlayData.map((d) => d.bb_lower)) && (
                            <path d={buildPath(overlayData.map((d) => d.bb_lower))} fill="none" stroke="rgba(96,165,250,0.4)" strokeWidth="1" />
                          )}
                          {buildPath(overlayData.map((d) => d.bb_middle)) && (
                            <path d={buildPath(overlayData.map((d) => d.bb_middle))} fill="none" stroke="rgba(96,165,250,0.2)" strokeWidth="1" strokeDasharray="4 4" />
                          )}
                          {/* BB fill band */}
                          {(() => {
                            const upper = overlayData.map((d) => d.bb_upper);
                            const lower = overlayData.map((d) => d.bb_lower);
                            const upPath = buildPath(upper);
                            const downPath = [...lower].reverse()
                              .map((v, i) => {
                                if (v == null) return '';
                                return `L ${xPos(n - 1 - i)} ${yPrice(v)}`;
                              })
                              .filter(Boolean)
                              .join(' ');
                            if (upPath && downPath) {
                              return <path d={`${upPath} ${downPath} Z`} fill="rgba(96,165,250,0.05)" />;
                            }
                            return null;
                          })()}
                        </>
                      )}

                      {/* Keltner Channel */}
                      {overlays.has('keltner') && data.indicators.keltner_channel && (
                        <>
                          {data.indicators.keltner_channel.upper != null && (
                            <line
                              x1="10" y1={yPrice(data.indicators.keltner_channel.upper)}
                              x2="790" y2={yPrice(data.indicators.keltner_channel.upper)}
                              stroke="rgba(168,85,247,0.4)" strokeWidth="1" strokeDasharray="8 4"
                            />
                          )}
                          {data.indicators.keltner_channel.lower != null && (
                            <line
                              x1="10" y1={yPrice(data.indicators.keltner_channel.lower)}
                              x2="790" y2={yPrice(data.indicators.keltner_channel.lower)}
                              stroke="rgba(168,85,247,0.4)" strokeWidth="1" strokeDasharray="8 4"
                            />
                          )}
                        </>
                      )}

                      {/* SMA lines */}
                      {overlays.has('sma') && (
                        <>
                          {buildPath(overlayData.map((d) => d.sma_20)) && (
                            <path d={buildPath(overlayData.map((d) => d.sma_20))} fill="none" stroke="rgba(251,191,36,0.6)" strokeWidth="1.5" />
                          )}
                          {buildPath(overlayData.map((d) => d.sma_50)) && (
                            <path d={buildPath(overlayData.map((d) => d.sma_50))} fill="none" stroke="rgba(251,146,36,0.5)" strokeWidth="1.5" />
                          )}
                        </>
                      )}

                      {/* Support/Resistance levels */}
                      {overlays.has('sr') && (
                        <>
                          {data.indicators.support_levels?.map((level, i) => (
                            <g key={`s${i}`}>
                              <line
                                x1="10" y1={yPrice(level)} x2="790" y2={yPrice(level)}
                                stroke="rgba(16,185,129,0.35)" strokeWidth="1" strokeDasharray="6 3"
                              />
                              <text x="12" y={yPrice(level) - 3} className="fill-emerald-500/60 text-[8px]">
                                S ₹{level.toFixed(0)}
                              </text>
                            </g>
                          ))}
                          {data.indicators.resistance_levels?.map((level, i) => (
                            <g key={`r${i}`}>
                              <line
                                x1="10" y1={yPrice(level)} x2="790" y2={yPrice(level)}
                                stroke="rgba(239,68,68,0.35)" strokeWidth="1" strokeDasharray="6 3"
                              />
                              <text x="12" y={yPrice(level) - 3} className="fill-red-500/60 text-[8px]">
                                R ₹{level.toFixed(0)}
                              </text>
                            </g>
                          ))}
                        </>
                      )}

                      {/* Candlesticks */}
                      {chartData.map((bar, i) => {
                        const isGreen = bar.close >= bar.open;
                        const bodyTop = yPrice(Math.max(bar.open, bar.close));
                        const bodyBottom = yPrice(Math.min(bar.open, bar.close));
                        const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
                        const color = isGreen ? '#6EE7B7' : '#EF4444';
                        const x = xPos(i);

                        return (
                          <g key={i}>
                            {/* Wick */}
                            <line
                              x1={x} y1={yPrice(bar.high)}
                              x2={x} y2={yPrice(bar.low)}
                              stroke={color} strokeWidth="1" opacity={0.7}
                            />
                            {/* Body */}
                            <rect
                              x={x - candleWidth / 2}
                              y={bodyTop}
                              width={candleWidth}
                              height={bodyHeight}
                              fill={isGreen ? color : color}
                              fillOpacity={isGreen ? 0.3 : 0.5}
                              stroke={color}
                              strokeWidth={0.5}
                            />
                          </g>
                        );
                      })}

                      {/* Volume bars */}
                      <line x1="10" y1={volTop - 5} x2="790" y2={volTop - 5} stroke="rgba(255,255,255,0.05)" />
                      {chartData.map((bar, i) => {
                        const isGreen = bar.close >= bar.open;
                        const barHeight = (bar.volume / maxVol) * volHeight;
                        const x = xPos(i);
                        return (
                          <rect
                            key={`v${i}`}
                            x={x - candleWidth / 2}
                            y={volBottom - barHeight}
                            width={candleWidth}
                            height={barHeight}
                            fill={isGreen ? 'rgba(110,231,183,0.25)' : 'rgba(239,68,68,0.25)'}
                          />
                        );
                      })}
                      <text x="12" y={volTop + 8} className="fill-slate-600 text-[7px]">VOL</text>
                    </g>
                  );
                })()}
              </svg>

              {/* Indicator badges */}
              <div className="flex flex-wrap gap-2 mt-2">
                {data.indicators.bollinger_bands?.position != null && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
                    BB Position: {(data.indicators.bollinger_bands.position * 100).toFixed(0)}%
                  </span>
                )}
                {data.indicators.bollinger_bands?.bandwidth != null && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
                    BB Width: {(data.indicators.bollinger_bands.bandwidth * 100).toFixed(1)}%
                  </span>
                )}
                {data.indicators.sma_20 != null && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400">
                    SMA(20): ₹{data.indicators.sma_20.toFixed(0)}
                  </span>
                )}
                {data.indicators.sma_50 != null && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-orange-500/10 text-orange-400">
                    SMA(50): ₹{data.indicators.sma_50.toFixed(0)}
                  </span>
                )}
                {data.indicators.sma_20 != null && data.indicators.sma_50 != null && (
                  <span
                    className={cn(
                      'text-[10px] px-2 py-1 rounded-full',
                      data.indicators.sma_20 > data.indicators.sma_50
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400',
                    )}
                  >
                    {data.indicators.sma_20 > data.indicators.sma_50 ? 'Golden Cross' : 'Death Cross'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Detected Patterns */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              Detected Patterns ({data.patterns.length})
            </h3>
            {data.patterns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No significant patterns detected for {data.ticker}.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.patterns.map((pattern, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {directionIcon(pattern.direction)}
                      <span className="text-sm font-semibold text-white capitalize">
                        {pattern.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{pattern.description}</p>
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-[10px] text-muted-foreground">Confidence</div>
                        <div className={cn('text-sm font-bold', confColor(pattern.confidence))}>
                          {(pattern.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground">Hist. Success</div>
                        <div className="text-sm font-bold text-white">
                          {(pattern.historical_success_rate * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="ml-auto">
                        <span
                          className={cn(
                            'text-[10px] px-2 py-1 rounded-full capitalize',
                            pattern.direction === 'bullish' && 'bg-emerald-500/10 text-emerald-400',
                            pattern.direction === 'bearish' && 'bg-red-500/10 text-red-400',
                            pattern.direction === 'neutral' && 'bg-slate-500/10 text-slate-400',
                          )}
                        >
                          {pattern.direction}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
