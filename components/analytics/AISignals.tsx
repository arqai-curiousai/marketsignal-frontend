'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2, Search, Lock, Brain, TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronUp, BarChart3, Sparkles,
} from 'lucide-react';
import { getForecast } from '@/src/lib/api/analyticsApi';
import type { IForecast } from '@/types/analytics';
import type { IAISignal } from '@/types/stock';
import { activateSignal, deactivateSignal, getActiveSignals } from '@/src/lib/api/signalApi';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const DEFAULT_TICKER = 'RELIANCE';

export function AISignals() {
  const [ticker, setTicker] = useState(DEFAULT_TICKER);
  const [searchInput, setSearchInput] = useState(DEFAULT_TICKER);
  const [forecast, setForecast] = useState<IForecast | null>(null);
  const [signal, setSignal] = useState<IAISignal | null>(null);
  const [loading, setLoading] = useState(false);
  const [signalLoading, setSignalLoading] = useState(false);
  const [signalActive, setSignalActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForecastDetail, setShowForecastDetail] = useState(false);

  const fetchData = useCallback(async (t: string) => {
    setLoading(true);
    setError(null);

    // Fetch forecast and existing signal in parallel
    const [forecastRes, signalsRes] = await Promise.all([
      getForecast(t).catch(() => ({ success: false, data: null } as const)),
      getActiveSignals().catch(() => ({ success: false, data: null } as const)),
    ]);

    if (forecastRes.success && forecastRes.data) {
      if ('error' in forecastRes.data && forecastRes.data.error) {
        setError(forecastRes.data.error as string);
        setForecast(null);
      } else {
        setForecast(forecastRes.data as IForecast);
      }
    } else {
      setError('Failed to load forecast. Please ensure you are logged in.');
    }

    // Check if signal already active for this ticker
    if (signalsRes.success && signalsRes.data) {
      const match = signalsRes.data.items.find(
        (s) => s.ticker === t && s.exchange === 'NSE'
      );
      if (match?.signal) {
        setSignal(match.signal);
        setSignalActive(true);
      } else {
        setSignal(null);
        setSignalActive(false);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(ticker);
  }, [ticker, fetchData]);

  const handleSearch = () => {
    if (searchInput.trim()) {
      setTicker(searchInput.trim().toUpperCase());
    }
  };

  const handleToggleSignal = async () => {
    setSignalLoading(true);
    if (signalActive) {
      const res = await deactivateSignal(ticker, 'NSE');
      if (res.success) {
        setSignalActive(false);
        setSignal(null);
      }
    } else {
      const res = await activateSignal(ticker, 'NSE', 'equity');
      if (res.success) {
        setSignalActive(true);
        // Refetch to get the generated signal
        const sigs = await getActiveSignals();
        if (sigs.success && sigs.data) {
          const match = sigs.data.items.find(
            (s) => s.ticker === ticker && s.exchange === 'NSE'
          );
          if (match?.signal) setSignal(match.signal);
        }
      }
    }
    setSignalLoading(false);
  };

  const actionColor = (action: string) => {
    if (action === 'BUY') return 'text-emerald-400';
    if (action === 'SELL') return 'text-red-400';
    return 'text-yellow-400';
  };

  const actionBg = (action: string) => {
    if (action === 'BUY') return 'bg-emerald-500/10 border-emerald-500/30';
    if (action === 'SELL') return 'bg-red-500/10 border-red-500/30';
    return 'bg-yellow-500/10 border-yellow-500/30';
  };

  return (
    <div className="space-y-4">
      {/* Premium Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 text-xs text-brand-violet"
      >
        <Sparkles className="h-4 w-4" />
        <span className="font-semibold">Premium AI Analysis</span>
        <span className="text-muted-foreground">— Dual Agent Pipeline + Time-Series Forecast</span>
      </motion.div>

      {/* Ticker Search */}
      <div className="flex items-center gap-2">
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
          className="px-4 py-2 text-xs font-medium rounded-lg bg-brand-violet/20 text-brand-violet hover:bg-brand-violet/30 transition-colors"
        >
          Analyze
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-violet" />
        </div>
      )}

      {error && (
        <div className="text-center py-16 text-muted-foreground">
          <Lock className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dual-Agent Signal Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'p-5 rounded-xl border',
              signal ? actionBg(signal.action) : 'border-white/10 bg-white/[0.02]',
            )}
          >
            <div className="flex items-center gap-3 mb-4">
              <Brain className="h-5 w-5 text-brand-violet" />
              <span className="text-sm font-semibold text-white">Dual-Agent Signal</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{ticker}</span>
            </div>

            {signal ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={cn('text-2xl font-bold', actionColor(signal.action))}>
                    {signal.action}
                  </span>
                  <div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                    <div className="text-sm font-bold text-white">
                      {(signal.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-xs text-muted-foreground">Type</div>
                    <div className={cn(
                      'text-sm font-semibold capitalize',
                      signal.conflictType === 'divergence' ? 'text-brand-violet' :
                      signal.conflictType === 'alignment' ? 'text-brand-blue' : 'text-yellow-400',
                    )}>
                      {signal.conflictType}
                    </div>
                  </div>
                </div>

                {/* Agent biases */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1">Market Maker</div>
                    <div className="text-xs font-semibold text-white capitalize flex items-center gap-1">
                      {signal.marketMakerBias === 'accumulating' ? (
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                      ) : signal.marketMakerBias === 'distributing' ? (
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      ) : (
                        <Minus className="h-3 w-3 text-slate-400" />
                      )}
                      {signal.marketMakerBias}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1">Retail Investor</div>
                    <div className="text-xs font-semibold text-white capitalize flex items-center gap-1">
                      {signal.retailBias === 'bullish' ? (
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                      ) : signal.retailBias === 'bearish' ? (
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      ) : (
                        <Minus className="h-3 w-3 text-slate-400" />
                      )}
                      {signal.retailBias}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-white/5">
                  {signal.reasoning}
                </p>

                {signal.priceAtSignal && (
                  <div className="text-[10px] text-muted-foreground">
                    Price at signal: ₹{signal.priceAtSignal.toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Activate the AI signal to get dual-agent analysis for {ticker}
                </p>
                <button
                  onClick={handleToggleSignal}
                  disabled={signalLoading}
                  className="px-6 py-2 text-sm font-medium rounded-lg bg-brand-violet/20 text-brand-violet hover:bg-brand-violet/30 transition-colors disabled:opacity-50"
                >
                  {signalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  ) : null}
                  Activate Signal
                </button>
              </div>
            )}

            {signal && (
              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Generated: {new Date(signal.generatedAt).toLocaleString()}
                </span>
                <button
                  onClick={handleToggleSignal}
                  disabled={signalLoading}
                  className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                >
                  {signalLoading ? 'Processing...' : 'Deactivate'}
                </button>
              </div>
            )}
          </motion.div>

          {/* Forecast Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-xl border border-white/10 bg-white/[0.02]"
          >
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="h-5 w-5 text-brand-blue" />
              <span className="text-sm font-semibold text-white">Price Forecast</span>
              {forecast && (
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {forecast.model_name} • {forecast.horizon}d horizon
                </span>
              )}
            </div>

            {forecast ? (
              <>
                {/* SVG Forecast Chart */}
                <svg viewBox="0 0 400 200" className="w-full h-40 md:h-48">
                  {(() => {
                    const n = forecast.forecast_values.length;
                    if (n === 0) return null;

                    const allVals = [
                      ...forecast.forecast_values,
                      ...forecast.confidence_lower,
                      ...forecast.confidence_upper,
                    ];
                    const minV = Math.min(...allVals) * 0.98;
                    const maxV = Math.max(...allVals) * 1.02;
                    const range = maxV - minV || 1;

                    const xScale = (i: number) => 20 + (n > 1 ? (i / (n - 1)) * 360 : 180);
                    const yScale = (v: number) => 185 - ((v - minV) / range) * 170;

                    // Confidence band path (filled area)
                    const bandTop = forecast.confidence_upper
                      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(v)}`)
                      .join(' ');
                    const bandBottom = [...forecast.confidence_lower]
                      .reverse()
                      .map((v, i) => {
                        const idx = n - 1 - i;
                        return `L ${xScale(idx)} ${yScale(v)}`;
                      })
                      .join(' ');
                    const bandPath = `${bandTop} ${bandBottom} Z`;

                    // Median forecast line
                    const medianPath = forecast.forecast_values
                      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(v)}`)
                      .join(' ');

                    const lastVal = forecast.forecast_values[n - 1];
                    const firstVal = forecast.forecast_values[0];
                    const changePct = firstVal > 0 ? ((lastVal - firstVal) / firstVal) * 100 : 0;

                    return (
                      <g>
                        {/* Gradient defs */}
                        <defs>
                          <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(124,58,237,0.15)" />
                            <stop offset="100%" stopColor="rgba(124,58,237,0.02)" />
                          </linearGradient>
                        </defs>

                        {/* Confidence band */}
                        <path d={bandPath} fill="url(#forecastBand)" />

                        {/* Upper/lower bounds */}
                        <path
                          d={forecast.confidence_upper
                            .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(v)}`)
                            .join(' ')}
                          fill="none" stroke="rgba(124,58,237,0.3)" strokeWidth="1" strokeDasharray="3 3"
                        />
                        <path
                          d={forecast.confidence_lower
                            .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(v)}`)
                            .join(' ')}
                          fill="none" stroke="rgba(124,58,237,0.3)" strokeWidth="1" strokeDasharray="3 3"
                        />

                        {/* Median line */}
                        <path d={medianPath} fill="none" stroke="#7C3AED" strokeWidth="2" />

                        {/* Start and end dots */}
                        <circle cx={xScale(0)} cy={yScale(firstVal)} r="3" fill="#7C3AED" />
                        <circle cx={xScale(n - 1)} cy={yScale(lastVal)} r="4" fill="#7C3AED" />

                        {/* End price label */}
                        <text
                          x={xScale(n - 1) - 5}
                          y={yScale(lastVal) - 10}
                          fill="white"
                          fontSize="10"
                          fontWeight="600"
                          textAnchor="end"
                        >
                          ₹{lastVal.toFixed(0)}
                        </text>

                        {/* Change badge */}
                        <text
                          x={xScale(n - 1)}
                          y={yScale(lastVal) + 15}
                          fill={changePct >= 0 ? '#6EE7B7' : '#FCA5A5'}
                          fontSize="9"
                          fontWeight="600"
                          textAnchor="end"
                        >
                          {changePct >= 0 ? '+' : ''}{changePct.toFixed(1)}%
                        </text>
                      </g>
                    );
                  })()}
                </svg>

                {/* Forecast Summary */}
                <div className="flex items-center gap-4 mt-2">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Start</div>
                    <div className="text-sm font-bold text-white">
                      ₹{forecast.forecast_values[0]?.toFixed(0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">End ({forecast.horizon}d)</div>
                    <div className="text-sm font-bold text-white">
                      ₹{forecast.forecast_values[forecast.forecast_values.length - 1]?.toFixed(0)}
                    </div>
                  </div>
                  <div className="ml-auto">
                    <div className="text-[10px] text-muted-foreground">90% Band</div>
                    <div className="text-xs font-semibold text-brand-violet">
                      ₹{forecast.confidence_lower[forecast.confidence_lower.length - 1]?.toFixed(0)}
                      {' — '}
                      ₹{forecast.confidence_upper[forecast.confidence_upper.length - 1]?.toFixed(0)}
                    </div>
                  </div>
                </div>

                {/* Expandable detail */}
                <button
                  onClick={() => setShowForecastDetail(!showForecastDetail)}
                  className="flex items-center gap-1 mt-3 text-[10px] text-muted-foreground hover:text-white transition-colors"
                >
                  {showForecastDetail ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {showForecastDetail ? 'Hide' : 'Show'} daily forecast
                </button>

                {showForecastDetail && (
                  <div className="mt-2 max-h-40 overflow-y-auto text-[10px] font-mono">
                    <div className="grid grid-cols-4 gap-1 text-muted-foreground font-semibold mb-1">
                      <span>Date</span><span className="text-right">Forecast</span>
                      <span className="text-right">Lower</span><span className="text-right">Upper</span>
                    </div>
                    {forecast.forecast_dates.map((date, i) => (
                      <div key={date} className="grid grid-cols-4 gap-1 text-white/70 py-0.5">
                        <span>{date.slice(5)}</span>
                        <span className="text-right">₹{forecast.forecast_values[i]?.toFixed(0)}</span>
                        <span className="text-right text-red-400/60">₹{forecast.confidence_lower[i]?.toFixed(0)}</span>
                        <span className="text-right text-emerald-400/60">₹{forecast.confidence_upper[i]?.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Forecast unavailable for {ticker}</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
