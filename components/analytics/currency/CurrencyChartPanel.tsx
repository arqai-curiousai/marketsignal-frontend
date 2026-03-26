'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { IChartApi, ISeriesApi, SeriesType } from 'lightweight-charts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCurrencyCandles, getCurrencyPatterns } from '@/src/lib/api/analyticsApi';
import type { ICurrencyCandle } from '@/src/lib/api/analyticsApi';
import type { IPatternDetectionV2, ICurrencyTechnicals } from '@/src/types/analytics';
import type { ChartOverlays } from './AnalysisView';

interface Props {
  pair: string;
  timeframe: string;
  technicals?: ICurrencyTechnicals | null;
  onTimeframeChange?: (tf: string) => void;
  overlays?: ChartOverlays;
  onOverlaysChange?: (overlays: ChartOverlays) => void;
}

/** Map UI timeframe labels to backend interval param */
function toBackendInterval(tf: string): string {
  if (tf === '1D' || tf === '1W') return '1D';
  return tf; // 1m, 5m, 15m, 1h pass through
}

/** Candle limit per timeframe */
function getCandleLimit(tf: string): number {
  switch (tf) {
    case '1m': return 500;
    case '5m': return 500;
    case '15m': return 500;
    case '1h': return 500;
    case '1D': return 365;
    default: return 500;
  }
}

// Cache the lightweight-charts module so we only import once
let lwcModulePromise: Promise<typeof import('lightweight-charts')> | null = null;
function getLightweightCharts() {
  if (!lwcModulePromise) {
    lwcModulePromise = import('lightweight-charts').catch((err) => {
      lwcModulePromise = null;
      throw err;
    });
  }
  return lwcModulePromise;
}

/** Compute Simple Moving Average from candle closes */
function computeSMA(
  bars: Array<{ time: string; close: number }>,
  period: number,
): Array<{ time: string; value: number }> {
  const result: Array<{ time: string; value: number }> = [];
  for (let i = period - 1; i < bars.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += bars[j].close;
    }
    result.push({ time: bars[i].time, value: sum / period });
  }
  return result;
}

/** Compute Bollinger Bands (20-period SMA +/- 2 std dev) */
function computeBollingerBands(
  bars: Array<{ time: string; close: number }>,
  period = 20,
  multiplier = 2,
): {
  upper: Array<{ time: string; value: number }>;
  middle: Array<{ time: string; value: number }>;
  lower: Array<{ time: string; value: number }>;
} {
  const upper: Array<{ time: string; value: number }> = [];
  const middle: Array<{ time: string; value: number }> = [];
  const lower: Array<{ time: string; value: number }> = [];

  for (let i = period - 1; i < bars.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += bars[j].close;
    }
    const mean = sum / period;

    let sqSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sqSum += (bars[j].close - mean) ** 2;
    }
    const stdDev = Math.sqrt(sqSum / period);

    middle.push({ time: bars[i].time, value: mean });
    upper.push({ time: bars[i].time, value: mean + multiplier * stdDev });
    lower.push({ time: bars[i].time, value: mean - multiplier * stdDev });
  }

  return { upper, middle, lower };
}

export function CurrencyChartPanel({ pair, timeframe, technicals, onTimeframeChange, overlays, onOverlaysChange }: Props) {
  const [candles, setCandles] = useState<ICurrencyCandle[]>([]);
  const [patterns, setPatterns] = useState<IPatternDetectionV2 | null>(null);
  const [loading, setLoading] = useState(true);

  // Use parent-controlled overlays if provided, otherwise fall back to local state
  const showVol = overlays?.vol ?? true;
  const showSMA = overlays?.sma ?? false;
  const showBB = overlays?.bb ?? false;
  const showPivots = overlays?.pivots ?? false;

  const toggleOverlay = useCallback((key: keyof ChartOverlays) => {
    if (onOverlaysChange && overlays) {
      onOverlaysChange({ ...overlays, [key]: !overlays[key] });
    }
  }, [overlays, onOverlaysChange]);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<IChartApi | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  // Track overlay series so we can add/remove without rebuilding the chart
  const overlaySeriesRef = useRef<ISeriesApi<SeriesType>[]>([]);
  // Cache the lightweight-charts module ref for the overlay effect
  const lwcRef = useRef<typeof import('lightweight-charts') | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const interval = toBackendInterval(timeframe);
      const limit = getCandleLimit(timeframe);

      // Primary: candles from dedicated endpoint
      const candleRes = await getCurrencyCandles(pair, interval, limit);
      if (candleRes.success && candleRes.data?.candles) {
        setCandles(candleRes.data.candles);
      }

      // Secondary: patterns overlay (only for daily/weekly)
      if (timeframe === '1D' || timeframe === '1W') {
        const tf = timeframe === '1D' ? 'daily' : 'weekly';
        const patRes = await getCurrencyPatterns(pair, tf);
        if (patRes.success) {
          setPatterns(patRes.data);
        }
      } else {
        setPatterns(null);
      }
    } catch (err) {
      console.warn('[CurrencyChartPanel] Failed to fetch data:', err);
      setCandles([]);
    } finally {
      setLoading(false);
    }
  }, [pair, timeframe]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create base chart (candlestick only) — only re-runs when candles or timeframe change
  useEffect(() => {
    if (!chartRef.current || !candles.length) return;

    let isMounted = true;

    const renderChart = async () => {
      const lwc = await getLightweightCharts();
      lwcRef.current = lwc;
      const { createChart, CandlestickSeries } = lwc;

      if (!isMounted || !chartRef.current) return;

      // Clean up previous chart + observer + overlay refs
      overlaySeriesRef.current = [];
      if (chartInstance.current) {
        chartInstance.current.remove();
        chartInstance.current = null;
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      const containerWidth = chartRef.current.clientWidth;
      const chartHeight = containerWidth < 640 ? 320 : 480;

      const chart = createChart(chartRef.current, {
        width: containerWidth,
        height: chartHeight,
        layout: {
          background: { color: 'transparent' },
          textColor: '#9ca3af',
          fontSize: 11,
        },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.04)' },
          horzLines: { color: 'rgba(255,255,255,0.04)' },
        },
        crosshair: {
          mode: 0,
        },
        rightPriceScale: {
          borderColor: 'rgba(255,255,255,0.1)',
        },
        timeScale: {
          borderColor: 'rgba(255,255,255,0.1)',
          timeVisible: timeframe !== '1D' && timeframe !== '1W',
        },
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });

      const bars = candles.map((b) => ({
        time: b.time as string,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }));

      candleSeries.setData(bars);
      chart.timeScale().fitContent();
      chartInstance.current = chart;

      // Responsive resize — observer stored in ref for proper cleanup
      const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
          chart.applyOptions({ width: entry.contentRect.width });
        }
      });
      observer.observe(chartRef.current);
      observerRef.current = observer;
    };

    renderChart();

    return () => {
      isMounted = false;
      overlaySeriesRef.current = [];
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (chartInstance.current) {
        chartInstance.current.remove();
        chartInstance.current = null;
      }
    };
  }, [candles, timeframe]);

  // Manage overlay series (VOL, SMA, BB, Pivots) — adds/removes from existing chart
  useEffect(() => {
    const chart = chartInstance.current;
    const lwc = lwcRef.current;
    if (!chart || !lwc || !candles.length) return;

    const { LineSeries, HistogramSeries } = lwc;

    // Remove previous overlay series
    for (const s of overlaySeriesRef.current) {
      try { chart.removeSeries(s); } catch { /* series may already be removed */ }
    }
    overlaySeriesRef.current = [];

    const bars = candles.map((b) => ({
      time: b.time as string,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }));

    // Volume histogram
    if (showVol) {
      const volSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'vol',
      });
      chart.priceScale('vol').applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
      });
      const volData = candles
        .filter(b => b.volume != null && b.volume > 0)
        .map(b => ({
          time: b.time as string,
          value: b.volume ?? 0,
          color: b.close >= b.open ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)',
        }));
      if (volData.length > 0) volSeries.setData(volData);
      overlaySeriesRef.current.push(volSeries);
    }

    // Pivot levels (classic pivots from technicals)
    if (showPivots && technicals?.pivots?.classic) {
      const pivots = technicals.pivots.classic;
      const pivotLevels: Array<{ price: number; label: string; color: string }> = [
        { price: pivots.pp, label: 'PP', color: 'rgba(255,255,255,0.35)' },
        { price: pivots.r1, label: 'R1', color: 'rgba(239,68,68,0.4)' },
        { price: pivots.r2, label: 'R2', color: 'rgba(239,68,68,0.25)' },
        { price: pivots.s1, label: 'S1', color: 'rgba(16,185,129,0.4)' },
        { price: pivots.s2, label: 'S2', color: 'rgba(16,185,129,0.25)' },
      ];
      for (const lv of pivotLevels) {
        if (lv.price) {
          const pivotLine = chart.addSeries(LineSeries, {
            color: lv.color,
            lineWidth: 1,
            lineStyle: 1,
            priceLineVisible: false,
            lastValueVisible: true,
            title: lv.label,
          });
          if (bars.length > 0) {
            pivotLine.setData([
              { time: bars[0].time, value: lv.price },
              { time: bars[bars.length - 1].time, value: lv.price },
            ]);
          }
          overlaySeriesRef.current.push(pivotLine);
        }
      }
    }

    // SMA overlays — computed from candle data
    if (showSMA && bars.length > 0) {
      const closeBars = bars.map(b => ({ time: b.time, close: b.close }));

      const sma20Data = computeSMA(closeBars, 20);
      if (sma20Data.length > 0) {
        const sma20Series = chart.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          title: 'SMA 20',
        });
        sma20Series.setData(sma20Data);
        overlaySeriesRef.current.push(sma20Series);
      }

      const sma50Data = computeSMA(closeBars, 50);
      if (sma50Data.length > 0) {
        const sma50Series = chart.addSeries(LineSeries, {
          color: '#f59e0b',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          title: 'SMA 50',
        });
        sma50Series.setData(sma50Data);
        overlaySeriesRef.current.push(sma50Series);
      }

      const sma200Data = computeSMA(closeBars, 200);
      if (sma200Data.length > 0) {
        const sma200Series = chart.addSeries(LineSeries, {
          color: '#ef4444',
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          title: 'SMA 200',
        });
        sma200Series.setData(sma200Data);
        overlaySeriesRef.current.push(sma200Series);
      }
    }

    // Bollinger Band overlays — computed from candle data
    if (showBB && bars.length > 0) {
      const closeBars = bars.map(b => ({ time: b.time, close: b.close }));
      const bb = computeBollingerBands(closeBars, 20, 2);

      if (bb.upper.length > 0) {
        const bbUpperSeries = chart.addSeries(LineSeries, {
          color: 'rgba(139, 92, 246, 0.5)',
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          title: 'BB Upper',
        });
        bbUpperSeries.setData(bb.upper);
        overlaySeriesRef.current.push(bbUpperSeries);

        const bbMiddleSeries = chart.addSeries(LineSeries, {
          color: 'rgba(139, 92, 246, 0.3)',
          lineWidth: 1,
          lineStyle: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        bbMiddleSeries.setData(bb.middle);
        overlaySeriesRef.current.push(bbMiddleSeries);

        const bbLowerSeries = chart.addSeries(LineSeries, {
          color: 'rgba(139, 92, 246, 0.5)',
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          title: 'BB Lower',
        });
        bbLowerSeries.setData(bb.lower);
        overlaySeriesRef.current.push(bbLowerSeries);
      }
    }
  }, [candles, showBB, showSMA, showVol, showPivots, technicals]);

  if (loading && !candles.length) {
    return <Skeleton className="h-[480px] w-full rounded-lg" />;
  }

  // Empty state: no candles available (e.g., intraday when market closed)
  const isIntraday = timeframe !== '1D' && timeframe !== '1W';
  if (!loading && candles.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 shadow-[0_2px_16px_rgba(0,0,0,0.15)]">
        <h3 className="text-sm font-medium mb-2">{pair} — {timeframe}</h3>
        <div className="flex flex-col items-center justify-center h-[400px] text-center">
          <p className="text-sm text-muted-foreground mb-1">
            No data available for {timeframe} timeframe
          </p>
          {isIntraday && (
            <p className="text-xs text-muted-foreground/60 mb-4">
              Intraday data may be unavailable outside forex trading hours
            </p>
          )}
          {isIntraday && onTimeframeChange && (
            <button
              onClick={() => onTimeframeChange('1D')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Switch to Daily
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 shadow-[0_2px_16px_rgba(0,0,0,0.15)]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">
          {pair} — {timeframe}
          {candles.length > 0 && (
            <span className="text-muted-foreground font-normal ml-2 text-xs">
              {candles.length} candles
            </span>
          )}
        </h3>
        <div className="flex items-center gap-1.5">
          {/* Overlay toggles — only render when parent provides handlers */}
          {overlays && onOverlaysChange && [
            { key: 'vol' as const, label: 'VOL', active: showVol, activeClass: 'bg-emerald-500/20 text-emerald-400' },
            { key: 'sma' as const, label: 'SMA', active: showSMA, activeClass: 'bg-blue-500/20 text-blue-400' },
            { key: 'bb' as const, label: 'BB', active: showBB, activeClass: 'bg-violet-500/20 text-violet-400' },
            { key: 'pivots' as const, label: 'PIVOTS', active: showPivots, activeClass: 'bg-amber-500/20 text-amber-400' },
          ].map(btn => (
            <button
              key={btn.key}
              onClick={() => toggleOverlay(btn.key)}
              aria-pressed={btn.active}
              className={cn(
                'px-2 py-0.5 text-[10px] rounded font-medium transition-colors',
                btn.active ? btn.activeClass : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.06]'
              )}
            >
              {btn.label}
            </button>
          ))}
          {patterns?.patterns && patterns.patterns.length > 0 && (
            <span className="text-xs text-muted-foreground ml-2">
              {patterns.patterns.length} pattern{patterns.patterns.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      <div ref={chartRef} className="w-full" role="img" aria-label={`${pair} ${timeframe} candlestick chart`} />
      {patterns?.patterns && patterns.patterns.length > 0 && (
        <div className="mt-3 space-y-1">
          {patterns.patterns.slice(0, 5).map((p, i) => (
            <div key={i} className="flex items-center justify-between text-xs px-1">
              <span className="text-muted-foreground">{p.type}</span>
              <div className="flex items-center gap-2">
                <span className={p.direction === 'bullish' ? 'text-emerald-500' : p.direction === 'bearish' ? 'text-red-500' : 'text-muted-foreground'}>
                  {p.direction}
                </span>
                <span className="text-muted-foreground">
                  {p.quality_grade || (p.confidence * 100).toFixed(0) + '%'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
