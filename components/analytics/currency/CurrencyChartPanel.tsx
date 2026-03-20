'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { IChartApi } from 'lightweight-charts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCurrencyPatterns } from '@/src/lib/api/analyticsApi';
import type { IPatternDetectionV2, ICurrencyTechnicals } from '@/src/types/analytics';

interface Props {
  pair: string;
  timeframe: string;
  technicals?: ICurrencyTechnicals | null;
}

export function CurrencyChartPanel({ pair, timeframe, technicals }: Props) {
  const [data, setData] = useState<IPatternDetectionV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showSMA, setShowSMA] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<IChartApi | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const tf = timeframe === '1D' ? 'daily' : timeframe === '1W' ? 'weekly' : timeframe;
      const res = await getCurrencyPatterns(pair, tf);
      if (res.success) {
        setData(res.data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [pair, timeframe]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Render chart with lightweight-charts
  useEffect(() => {
    if (!chartRef.current || !data?.chart_data?.length) return;

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
        height: 400,
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
          timeVisible: true,
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

      const bars = data.chart_data.map((b) => ({
        time: b.date,
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
          // Use the last value as a horizontal reference
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
  }, [data, showBB, showSMA, technicals]);

  if (loading && !data) {
    return <Skeleton className="h-[400px] w-full rounded-lg" />;
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">{pair} — {timeframe}</h3>
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
          {data?.patterns && data.patterns.length > 0 && (
            <span className="text-xs text-muted-foreground ml-2">
              {data.patterns.length} pattern{data.patterns.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      <div ref={chartRef} className="w-full" />
      {data?.patterns && data.patterns.length > 0 && (
        <div className="mt-3 space-y-1">
          {data.patterns.slice(0, 5).map((p, i) => (
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
