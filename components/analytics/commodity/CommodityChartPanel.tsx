'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { IChartApi } from 'lightweight-charts';
import { Skeleton } from '@/components/ui/skeleton';
import { getCommodityPatterns } from '@/src/lib/api/analyticsApi';
import type { IPatternDetectionV2 } from '@/src/types/analytics';

interface Props {
  commodity: string;
  timeframe: string;
}

export function CommodityChartPanel({ commodity, timeframe }: Props) {
  const [data, setData] = useState<IPatternDetectionV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<IChartApi | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const tf = timeframe === '1D' ? 'daily' : timeframe === '1W' ? 'weekly' : timeframe;
      const res = await getCommodityPatterns(commodity, tf);
      if (res.success) {
        setData(res.data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [commodity, timeframe]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!chartRef.current || !data?.chart_data?.length) return;

    let isMounted = true;

    const renderChart = async () => {
      const { createChart, CandlestickSeries } = await import('lightweight-charts');

      if (!isMounted || !chartRef.current) return;

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
        crosshair: { mode: 0 },
        rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
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
      chart.timeScale().fitContent();
      chartInstance.current = chart;

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
  }, [data]);

  if (loading && !data) {
    return <Skeleton className="h-[400px] w-full rounded-lg" />;
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">{commodity} — {timeframe}</h3>
        {data?.patterns && data.patterns.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {data.patterns.length} pattern{data.patterns.length !== 1 ? 's' : ''} detected
          </span>
        )}
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
