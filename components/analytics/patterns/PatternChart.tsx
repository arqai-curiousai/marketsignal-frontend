'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  createChart,
  createSeriesMarkers,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type SeriesMarker,
  type Time,
  ColorType,
  LineStyle,
  CrosshairMode,
} from 'lightweight-charts';
import { cn } from '@/lib/utils';
import type { IOHLCVBar, IOverlayData, IPatternV2, IRegimeZone } from '@/types/analytics';

// ─── Types ──────────────────────────────────────────────────

type ChartOverlay = 'bb' | 'sma' | 'sr';

interface PatternChartProps {
  ticker?: string;
  chartData: IOHLCVBar[];
  overlayData: IOverlayData[];
  indicators?: {
    bollinger_bands?: {
      upper: number | null;
      middle: number | null;
      lower: number | null;
      bandwidth: number | null;
      position: number | null;
    };
    sma_20?: number | null;
    sma_50?: number | null;
    current_price?: number;
  };
  regimeZones: IRegimeZone[];
  changepointIndices: number[];
  patterns: IPatternV2[];
  supportLevels: number[];
  resistanceLevels: number[];
}

// ─── Constants ──────────────────────────────────────────────

const COLORS = {
  bg: '#0B0F19',
  text: '#9CA3AF',
  grid: '#1F2937',
  candleUp: '#34D399',
  candleDown: '#FB7185',
  bbLine: '#60A5FA',
  bbFill: 'rgba(96, 165, 250, 0.06)',
  sma20: '#FBBF24',
  sma50: '#FB923C',
  support: '#34D399',
  resistance: '#FB7185',
  volumeUp: 'rgba(52, 211, 153, 0.3)',
  volumeDown: 'rgba(251, 113, 133, 0.3)',
  regimeBull: 'rgba(52, 211, 153, 0.06)',
  regimeBear: 'rgba(251, 113, 133, 0.06)',
  regimeSideways: 'rgba(156, 163, 175, 0.04)',
  changepoint: '#FBBF24',
} as const;

const OVERLAY_CONFIG: { id: ChartOverlay; label: string; activeColor: string }[] = [
  { id: 'bb', label: 'BB', activeColor: 'text-blue-400' },
  { id: 'sma', label: 'SMA', activeColor: 'text-amber-400' },
  { id: 'sr', label: 'S/R', activeColor: 'text-emerald-400' },
];

// ─── Helpers ────────────────────────────────────────────────

function toTime(dateStr: string): Time {
  return dateStr as Time;
}

function formatPrice(price: number): string {
  if (price >= 100000) return `${(price / 100000).toFixed(2)}L`;
  if (price >= 1000) return price.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return price.toFixed(2);
}

// ─── Component ──────────────────────────────────────────────

export function PatternChart({
  ticker,
  chartData,
  overlayData,
  indicators,
  regimeZones,
  changepointIndices,
  patterns,
  supportLevels,
  resistanceLevels,
}: PatternChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<{
    candle: ISeriesApi<'Candlestick'> | null;
    volume: ISeriesApi<'Histogram'> | null;
    bbUpper: ISeriesApi<'Line'> | null;
    bbMiddle: ISeriesApi<'Line'> | null;
    bbLower: ISeriesApi<'Line'> | null;
    sma20: ISeriesApi<'Line'> | null;
    sma50: ISeriesApi<'Line'> | null;
  }>({
    candle: null,
    volume: null,
    bbUpper: null,
    bbMiddle: null,
    bbLower: null,
    sma20: null,
    sma50: null,
  });

  const [overlays, setOverlays] = useState<Set<ChartOverlay>>(
    () => new Set<ChartOverlay>(['bb', 'sr'])
  );

  // Derive last bar info
  const lastBar = useMemo(() => {
    if (!chartData.length) return null;
    return chartData[chartData.length - 1];
  }, [chartData]);

  const currentPrice = useMemo(() => {
    if (indicators?.current_price) return indicators.current_price;
    return lastBar?.close ?? null;
  }, [indicators, lastBar]);

  const priceChange = useMemo(() => {
    if (!chartData || chartData.length < 2) return null;
    const prev = chartData[chartData.length - 2].close;
    const curr = chartData[chartData.length - 1].close;
    return {
      absolute: curr - prev,
      percent: ((curr - prev) / prev) * 100,
    };
  }, [chartData]);

  // ── Overlay toggle ──
  const toggleOverlay = useCallback((o: ChartOverlay) => {
    setOverlays((prev) => {
      const next = new Set(prev);
      if (next.has(o)) next.delete(o);
      else next.add(o);
      return next;
    });
  }, []);

  // ── Chart creation & data binding ──
  useEffect(() => {
    if (!containerRef.current || !chartData.length) return;

    const container = containerRef.current;

    // Determine dimensions
    const isMobile = window.innerWidth < 768;
    const chartHeight = isMobile ? 280 : 400;

    // Create chart
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: COLORS.bg },
        textColor: COLORS.text,
        fontFamily: "'Inter', 'SF Pro', system-ui, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: COLORS.grid, style: LineStyle.Dotted },
        horzLines: { color: COLORS.grid, style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(156, 163, 175, 0.3)', width: 1, style: LineStyle.Dashed },
        horzLine: { color: 'rgba(156, 163, 175, 0.3)', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: COLORS.grid,
        scaleMargins: { top: 0.05, bottom: 0.25 },
      },
      timeScale: {
        borderColor: COLORS.grid,
        timeVisible: false,
        secondsVisible: false,
      },
      width: container.clientWidth,
      height: chartHeight,
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    });

    chartRef.current = chart;

    // ── Candlestick series ──
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: COLORS.candleUp,
      downColor: COLORS.candleDown,
      wickUpColor: COLORS.candleUp,
      wickDownColor: COLORS.candleDown,
      borderVisible: false,
    });

    const candleData = chartData.map((bar) => ({
      time: toTime(bar.date),
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    }));
    candleSeries.setData(candleData);
    seriesRefs.current.candle = candleSeries;

    // ── Pattern markers on candlestick series ──
    // ── All markers (patterns + changepoints) via createSeriesMarkers ──
    {
      const patternMarkers: SeriesMarker<Time>[] = patterns
        .filter((p) => p.pattern_end_index >= 0 && p.pattern_end_index < chartData.length)
        .map((p) => {
          const bar = chartData[p.pattern_end_index];
          let shape: 'arrowUp' | 'arrowDown' | 'circle' = 'circle';
          let color = '#60A5FA';
          let position: 'aboveBar' | 'belowBar' = 'aboveBar';

          if (p.direction === 'bullish') {
            shape = 'arrowUp';
            color = COLORS.candleUp;
            position = 'belowBar';
          } else if (p.direction === 'bearish') {
            shape = 'arrowDown';
            color = COLORS.candleDown;
            position = 'aboveBar';
          }

          return {
            time: toTime(bar.date),
            position,
            color,
            shape,
            text: p.type.replace(/_/g, ' '),
            size: 1,
          };
        });

      const cpMarkers: SeriesMarker<Time>[] = changepointIndices
        .filter((idx) => idx >= 0 && idx < chartData.length)
        .map((idx) => ({
          time: toTime(chartData[idx].date),
          position: 'aboveBar' as const,
          color: COLORS.changepoint,
          shape: 'circle' as const,
          text: 'CP',
          size: 1,
        }));

      const allMarkers = [...patternMarkers, ...cpMarkers]
        .sort((a, b) => (a.time as string).localeCompare(b.time as string));

      if (allMarkers.length > 0) {
        createSeriesMarkers(candleSeries, allMarkers);
      }
    }

    // ── Volume histogram series ──
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const volumeData = chartData.map((bar) => ({
      time: toTime(bar.date),
      value: bar.volume,
      color: bar.close >= bar.open ? COLORS.volumeUp : COLORS.volumeDown,
    }));
    volumeSeries.setData(volumeData);
    seriesRefs.current.volume = volumeSeries;

    // ── Bollinger Bands ──
    if (overlayData.length > 0) {
      // BB Upper
      const bbUpperSeries = chart.addSeries(LineSeries, {
        color: COLORS.bbLine,
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        visible: overlays.has('bb'),
      });
      const bbUpperData = overlayData
        .filter((d) => d.bb_upper != null)
        .map((d) => ({ time: toTime(d.date), value: d.bb_upper as number }));
      bbUpperSeries.setData(bbUpperData);
      seriesRefs.current.bbUpper = bbUpperSeries;

      // BB Middle (dashed)
      const bbMiddleSeries = chart.addSeries(LineSeries, {
        color: COLORS.bbLine,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        visible: overlays.has('bb'),
      });
      const bbMiddleData = overlayData
        .filter((d) => d.bb_middle != null)
        .map((d) => ({ time: toTime(d.date), value: d.bb_middle as number }));
      bbMiddleSeries.setData(bbMiddleData);
      seriesRefs.current.bbMiddle = bbMiddleSeries;

      // BB Lower
      const bbLowerSeries = chart.addSeries(LineSeries, {
        color: COLORS.bbLine,
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        visible: overlays.has('bb'),
      });
      const bbLowerData = overlayData
        .filter((d) => d.bb_lower != null)
        .map((d) => ({ time: toTime(d.date), value: d.bb_lower as number }));
      bbLowerSeries.setData(bbLowerData);
      seriesRefs.current.bbLower = bbLowerSeries;

      // SMA 20
      const sma20Series = chart.addSeries(LineSeries, {
        color: COLORS.sma20,
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        visible: overlays.has('sma'),
      });
      const sma20Data = overlayData
        .filter((d) => d.sma_20 != null)
        .map((d) => ({ time: toTime(d.date), value: d.sma_20 as number }));
      sma20Series.setData(sma20Data);
      seriesRefs.current.sma20 = sma20Series;

      // SMA 50
      const sma50Series = chart.addSeries(LineSeries, {
        color: COLORS.sma50,
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        visible: overlays.has('sma'),
      });
      const sma50Data = overlayData
        .filter((d) => d.sma_50 != null)
        .map((d) => ({ time: toTime(d.date), value: d.sma_50 as number }));
      sma50Series.setData(sma50Data);
      seriesRefs.current.sma50 = sma50Series;
    }

    // ── Support / Resistance price lines ──
    if (overlays.has('sr')) {
      supportLevels.forEach((level) => {
        candleSeries.createPriceLine({
          price: level,
          color: COLORS.support,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `S ${formatPrice(level)}`,
        });
      });

      resistanceLevels.forEach((level) => {
        candleSeries.createPriceLine({
          price: level,
          color: COLORS.resistance,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `R ${formatPrice(level)}`,
        });
      });
    }

    // ── Regime zone background markers ──
    // lightweight-charts does not have native rectangle drawing, so we
    // approximate regime zones using thin colored histogram bars on a
    // dedicated hidden-price-scale series.
    if (regimeZones.length > 0) {
      const regimeSeries = chart.addSeries(HistogramSeries, {
        priceScaleId: 'regime',
        priceFormat: { type: 'price' },
        lastValueVisible: false,
        priceLineVisible: false,
      });

      chart.priceScale('regime').applyOptions({
        scaleMargins: { top: 0, bottom: 0 },
        visible: false,
      });

      // Find the max price range to create full-height bars
      const allHighs = chartData.map((b) => b.high);
      const maxHigh = Math.max(...allHighs);

      const regimeData = chartData.map((bar, idx) => {
        const zone = regimeZones.find((z) => idx >= z.start && idx <= z.end);
        let color = 'transparent';
        if (zone) {
          if (zone.regime === 'bull') color = COLORS.regimeBull;
          else if (zone.regime === 'bear') color = COLORS.regimeBear;
          else color = COLORS.regimeSideways;
        }
        return {
          time: toTime(bar.date),
          value: maxHigh,
          color,
        };
      });
      regimeSeries.setData(regimeData);
    }

    // Fit content
    chart.timeScale().fitContent();

    // ── ResizeObserver ──
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          const newHeight = window.innerWidth < 768 ? 280 : 400;
          chart.applyOptions({ width, height: newHeight });
        }
      }
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRefs.current = {
        candle: null,
        volume: null,
        bbUpper: null,
        bbMiddle: null,
        bbLower: null,
        sma20: null,
        sma50: null,
      };
    };
    // We intentionally only re-create the chart when data changes, not on overlay toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData, overlayData, patterns, regimeZones, changepointIndices, supportLevels, resistanceLevels]);

  // ── Toggle overlay visibility without re-creating chart ──
  useEffect(() => {
    const refs = seriesRefs.current;

    // BB visibility
    refs.bbUpper?.applyOptions({ visible: overlays.has('bb') });
    refs.bbMiddle?.applyOptions({ visible: overlays.has('bb') });
    refs.bbLower?.applyOptions({ visible: overlays.has('bb') });

    // SMA visibility
    refs.sma20?.applyOptions({ visible: overlays.has('sma') });
    refs.sma50?.applyOptions({ visible: overlays.has('sma') });

    // S/R lines: need to re-create the chart to toggle (handled via full re-render dependency)
    // For S/R, we track via the overlay set in the main useEffect
  }, [overlays]);

  // ── S/R overlay requires chart re-creation since price lines can't be toggled ──
  // We track the SR toggle separately to force re-render
  const [srKey, setSrKey] = useState(0);
  const prevSrRef = useRef(overlays.has('sr'));

  useEffect(() => {
    const currentSr = overlays.has('sr');
    if (currentSr !== prevSrRef.current) {
      prevSrRef.current = currentSr;
      setSrKey((k) => k + 1);
    }
  }, [overlays]);

  // Force chart re-creation when S/R toggled
  useEffect(() => {
    if (srKey === 0) return; // Skip initial
    if (!chartRef.current || !seriesRefs.current.candle) return;

    const candleSeries = seriesRefs.current.candle;

    // Remove all existing price lines by re-creating the series data
    // Unfortunately lightweight-charts doesn't have removePriceLine by reference easily,
    // so we trigger a full re-render by re-setting data
    const currentData = chartData.map((bar) => ({
      time: toTime(bar.date),
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    }));
    candleSeries.setData(currentData);

    if (overlays.has('sr')) {
      supportLevels.forEach((level) => {
        candleSeries.createPriceLine({
          price: level,
          color: COLORS.support,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `S ${formatPrice(level)}`,
        });
      });

      resistanceLevels.forEach((level) => {
        candleSeries.createPriceLine({
          price: level,
          color: COLORS.resistance,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `R ${formatPrice(level)}`,
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srKey]);

  // ── Render ──

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-[280px] md:h-[400px] bg-[#0B0F19] rounded-xl border border-white/10">
        <p className="text-sm text-muted-foreground">No chart data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0B0F19] overflow-hidden">
      {/* ── Chart Header ── */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-3">
          {ticker && (
            <span className="text-sm font-semibold text-white tracking-wide">{ticker}</span>
          )}
          {currentPrice != null && (
            <span className="text-sm font-bold text-white font-mono tabular-nums">
              {'\u20B9'}{formatPrice(currentPrice)}
            </span>
          )}
          {priceChange && (
            <span
              className={cn(
                'text-xs font-medium font-mono tabular-nums',
                priceChange.absolute >= 0 ? 'text-emerald-400' : 'text-rose-400'
              )}
            >
              {priceChange.absolute >= 0 ? '+' : ''}
              {priceChange.absolute.toFixed(2)} ({priceChange.percent.toFixed(2)}%)
            </span>
          )}
        </div>

        {/* ── Overlay Toggle Pills ── */}
        <div className="flex items-center gap-1">
          {OVERLAY_CONFIG.map((o) => (
            <button
              key={o.id}
              onClick={() => toggleOverlay(o.id)}
              className={cn(
                'px-2.5 py-1 text-[10px] font-semibold rounded-full transition-all border',
                overlays.has(o.id)
                  ? `${o.activeColor} bg-white/10 border-white/20`
                  : 'text-muted-foreground border-transparent hover:text-white hover:bg-white/5'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chart Container ── */}
      <div ref={containerRef} className="w-full" />

      {/* ── Legend row ── */}
      <div className="flex flex-wrap items-center gap-3 px-4 pb-3 pt-1">
        {overlays.has('bb') && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-[2px] bg-blue-400 inline-block rounded-full" />
            <span className="text-[10px] text-blue-400/80">BB</span>
          </div>
        )}
        {overlays.has('sma') && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-[2px] bg-amber-400 inline-block rounded-full" />
              <span className="text-[10px] text-amber-400/80">SMA(20)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-[2px] bg-orange-400 inline-block rounded-full" />
              <span className="text-[10px] text-orange-400/80">SMA(50)</span>
            </div>
          </>
        )}
        {overlays.has('sr') && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-[2px] border-t border-dashed border-emerald-400 inline-block" />
              <span className="text-[10px] text-emerald-400/80">Support</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-[2px] border-t border-dashed border-rose-400 inline-block" />
              <span className="text-[10px] text-rose-400/80">Resistance</span>
            </div>
          </>
        )}
        {regimeZones.length > 0 && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="w-2 h-2 rounded-sm bg-emerald-400/20 inline-block" />
            <span className="text-[10px] text-muted-foreground">Bull</span>
            <span className="w-2 h-2 rounded-sm bg-rose-400/20 inline-block ml-1" />
            <span className="text-[10px] text-muted-foreground">Bear</span>
            <span className="w-2 h-2 rounded-sm bg-slate-400/10 inline-block ml-1" />
            <span className="text-[10px] text-muted-foreground">Sideways</span>
          </div>
        )}
      </div>
    </div>
  );
}
