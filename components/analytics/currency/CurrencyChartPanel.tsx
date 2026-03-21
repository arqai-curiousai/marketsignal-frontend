'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { IChartApi } from 'lightweight-charts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCurrencyCandles, getCurrencyPatterns } from '@/src/lib/api/analyticsApi';
import type { ICurrencyCandlesResponse, ICurrencyCandle } from '@/src/lib/api/analyticsApi';
import type { IPatternDetectionV2, ICurrencyTechnicals } from '@/src/types/analytics';

interface Props {
  pair: string;
  timeframe: string;
  technicals?: ICurrencyTechnicals | null;
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

export function CurrencyChartPanel({ pair, timeframe, technicals }: Props) {
  const [candles, setCandles] = useState<ICurrencyCandle[]>([]);
  const [patterns, setPatterns] = useState<IPatternDetectionV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showSMA, setShowSMA] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<IChartApi | null>(null);

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
      console.error('[CurrencyChartPanel] Failed to fetch data:', err);
      setCandles([]);
    } finally {
      setLoading(false);
    }
  }, [pair, timeframe]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Render chart with lightweight-charts
  useEffect(() => {
    if (!chartRef.current || !candles.length) return;

    let isMounted = true;

    const renderChart = async () => {
      const { createChart, CandlestickSeries, LineSeries } = await import('lightweight-charts');

      if (!isMounted || !chartRef.current) return;

      // Clean up previous chart
      if (chartInstance.current) {
        chartInstance.current.remove();
        chartInstance.current = null;
      }

      const chart = createChart(chartRef.current, {
        width: chartRef.current.clientWidth,
        height: 480,
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

      // SMA overlays
      if (showSMA && technicals) {
        if (technicals.sma.sma20) {
          const sma20Series = chart.addSeries(LineSeries, {
            color: '#3b82f6',
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          if (bars.length > 0) {
            sma20Series.setData([
              { time: bars[0].time, value: technicals.sma.sma20 },
              { time: bars[bars.length - 1].time, value: technicals.sma.sma20 },
            ]);
          }
        }
        if (technicals.sma.sma50) {
          const sma50Series = chart.addSeries(LineSeries, {
            color: '#f59e0b',
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          if (bars.length > 0) {
            sma50Series.setData([
              { time: bars[0].time, value: technicals.sma.sma50 },
              { time: bars[bars.length - 1].time, value: technicals.sma.sma50 },
            ]);
          }
        }
      }

      // Bollinger Band overlays
      if (showBB && technicals) {
        const bbUpper = chart.addSeries(LineSeries, {
          color: 'rgba(139, 92, 246, 0.5)',
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        const bbLower = chart.addSeries(LineSeries, {
          color: 'rgba(139, 92, 246, 0.5)',
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        if (bars.length > 0) {
          bbUpper.setData([
            { time: bars[0].time, value: technicals.bollinger.upper },
            { time: bars[bars.length - 1].time, value: technicals.bollinger.upper },
          ]);
          bbLower.setData([
            { time: bars[0].time, value: technicals.bollinger.lower },
            { time: bars[bars.length - 1].time, value: technicals.bollinger.lower },
          ]);
        }
      }

      chart.timeScale().fitContent();
      chartInstance.current = chart;

      // Responsive
      const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
          chart.applyOptions({ width: entry.contentRect.width });
        }
      });
      observer.observe(chartRef.current);

      return () => observer.disconnect();
    };

    renderChart();

    return () => {
      isMounted = false;
      if (chartInstance.current) {
        chartInstance.current.remove();
        chartInstance.current = null;
      }
    };
  }, [candles, showBB, showSMA, technicals, timeframe]);

  if (loading && !candles.length) {
    return <Skeleton className="h-[480px] w-full rounded-lg" />;
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
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
          {/* Overlay toggles */}
          <button
            onClick={() => setShowSMA(p => !p)}
            className={cn(
              'px-2 py-0.5 text-[10px] rounded font-medium transition-colors',
              showSMA ? 'bg-blue-500/20 text-blue-400' : 'bg-muted text-muted-foreground'
            )}
          >
            SMA
          </button>
          <button
            onClick={() => setShowBB(p => !p)}
            className={cn(
              'px-2 py-0.5 text-[10px] rounded font-medium transition-colors',
              showBB ? 'bg-violet-500/20 text-violet-400' : 'bg-muted text-muted-foreground'
            )}
          >
            BB
          </button>
          {patterns?.patterns && patterns.patterns.length > 0 && (
            <span className="text-xs text-muted-foreground ml-2">
              {patterns.patterns.length} pattern{patterns.patterns.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      <div ref={chartRef} className="w-full" />
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
