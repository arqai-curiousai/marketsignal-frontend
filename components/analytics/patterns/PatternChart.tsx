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
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { IOHLCVBar, IOverlayData, IPatternV2, IRegimeZone, ISupertrend, ITrendline, IFibonacci } from '@/types/analytics';
import { DrawingCanvas, type DrawingTool, type Drawing } from './DrawingCanvas';
import { DrawingToolbar } from './DrawingToolbar';

// ─── Types ──────────────────────────────────────────────────

type ChartOverlay = 'bb' | 'sma' | 'sr' | 'st' | 'tl' | 'fib';

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
  supertrend?: ISupertrend | null;
  trendlines?: { support: ITrendline[]; resistance: ITrendline[] } | null;
  fibonacci?: IFibonacci | null;
}

// ─── Constants ──────────────────────────────────────────────

const COLORS = {
  bg: '#0B0F19',
  text: '#9CA3AF',
  grid: '#1F2937',
  candleUp: '#34D399',
  candleDown: '#FB7185',
  stUp: '#34D399',
  stDown: '#FB7185',
  bbLine: '#4ADE80',
  bbFill: 'rgba(74, 222, 128, 0.06)',
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

const OVERLAY_CONFIG: { id: ChartOverlay; label: string; tip: string; activeColor: string }[] = [
  { id: 'bb', label: 'BB', tip: 'Bollinger Bands', activeColor: 'text-blue-400' },
  { id: 'sma', label: 'SMA', tip: 'Simple Moving Average', activeColor: 'text-amber-400' },
  { id: 'sr', label: 'S/R', tip: 'Support / Resistance', activeColor: 'text-emerald-400' },
  { id: 'st', label: 'ST', tip: 'Supertrend', activeColor: 'text-teal-400' },
  { id: 'tl', label: 'TL', tip: 'Trendlines', activeColor: 'text-violet-400' },
  { id: 'fib', label: 'Fib', tip: 'Fibonacci Retracement', activeColor: 'text-cyan-400' },
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
  supertrend,
  trendlines,
  fibonacci,
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
    stUp: ISeriesApi<'Line'> | null;
    stDown: ISeriesApi<'Line'> | null;
    trendlineSeries: ISeriesApi<'Line'>[];
  }>({
    candle: null,
    volume: null,
    bbUpper: null,
    bbMiddle: null,
    bbLower: null,
    sma20: null,
    sma50: null,
    stUp: null,
    stDown: null,
    trendlineSeries: [],
  });

  const [overlays, setOverlays] = useState<Set<ChartOverlay>>(
    () => new Set<ChartOverlay>(['bb', 'sr'])
  );

  // ── S/R & Fib price lines refs for toggle without re-creation ──
  const srPriceLinesRef = useRef<ReturnType<ISeriesApi<'Candlestick'>['createPriceLine']>[]>([]);
  const fibPriceLinesRef = useRef<ReturnType<ISeriesApi<'Candlestick'>['createPriceLine']>[]>([]);

  // ── Drawing tools state ──
  const [activeTool, setActiveTool] = useState<DrawingTool | null>(null);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });

  // ── Undo stack for drawings (Fix 18) ──
  const undoStackRef = useRef<Drawing[]>([]);

  // ── Crosshair tooltip state (Fix 3) ──
  const [tooltipData, setTooltipData] = useState<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    date: string;
  } | null>(null);

  const storageKey = ticker ? `ms_drawings_${ticker}` : null;

  // Load drawings from localStorage on mount
  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Drawing[];
        if (Array.isArray(parsed)) setDrawings(parsed);
      }
    } catch {
      // Ignore corrupt localStorage
    }
  }, [storageKey]);

  // Save drawings to localStorage on change
  useEffect(() => {
    if (!storageKey) return;
    if (drawings.length === 0) {
      localStorage.removeItem(storageKey);
    } else {
      try {
        localStorage.setItem(storageKey, JSON.stringify(drawings));
      } catch {
        // Quota exceeded — silently ignore
      }
    }
  }, [drawings, storageKey]);

  // Safe tool setter — blocks activation if chart isn't ready
  const safeSetActiveTool = useCallback((tool: DrawingTool | null) => {
    if (tool && (chartDimensions.width === 0 || chartDimensions.height === 0)) return;
    setActiveTool(tool);
  }, [chartDimensions]);

  // Drawing delete handler with undo support
  const handleDrawingDelete = useCallback((id: string) => {
    setDrawings((prev) => {
      const deleted = prev.find((d) => d.id === id);
      if (deleted) undoStackRef.current.push(deleted);
      return prev.filter((d) => d.id !== id);
    });
  }, []);

  // Keyboard shortcuts for drawing tools + undo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        const restored = undoStackRef.current.pop();
        if (restored) {
          setDrawings((prev) => [...prev, restored]);
        } else {
          // No deleted items — undo the most recent drawing
          setDrawings((prev) => {
            if (prev.length === 0) return prev;
            const removed = prev[prev.length - 1];
            undoStackRef.current.push(removed);
            return prev.slice(0, -1);
          });
        }
        return;
      }

      const map: Record<string, DrawingTool> = {
        t: 'trendline',
        h: 'horizontal',
        f: 'fibonacci',
        r: 'rectangle',
        e: 'eraser',
      };
      if (map[e.key]) {
        safeSetActiveTool(activeTool === map[e.key] ? null : map[e.key]);
      }
      if (e.key === 'Escape') setActiveTool(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTool, safeSetActiveTool]);

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
    if (prev === 0 || !Number.isFinite(prev) || !Number.isFinite(curr)) return null;
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

  // ── Zoom controls (Fix 15) ──
  const zoomIn = useCallback(() => {
    const ts = chartRef.current?.timeScale();
    if (!ts) return;
    const range = ts.getVisibleLogicalRange();
    if (!range) return;
    const center = (range.from + range.to) / 2;
    const halfSpan = (range.to - range.from) / 4;
    ts.setVisibleLogicalRange({ from: center - halfSpan, to: center + halfSpan });
  }, []);

  const zoomOut = useCallback(() => {
    const ts = chartRef.current?.timeScale();
    if (!ts) return;
    const range = ts.getVisibleLogicalRange();
    if (!range) return;
    const center = (range.from + range.to) / 2;
    const halfSpan = (range.to - range.from);
    ts.setVisibleLogicalRange({ from: center - halfSpan, to: center + halfSpan });
  }, []);

  const resetZoom = useCallback(() => {
    chartRef.current?.timeScale().fitContent();
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

    // ── Pattern markers — aggregate same-bar markers (Fix 17) ──
    {
      const markersByBar = new Map<number, IPatternV2[]>();
      for (const p of patterns) {
        if (p.pattern_end_index >= 0 && p.pattern_end_index < chartData.length) {
          const existing = markersByBar.get(p.pattern_end_index) || [];
          existing.push(p);
          markersByBar.set(p.pattern_end_index, existing);
        }
      }

      const patternMarkers: SeriesMarker<Time>[] = [];
      markersByBar.forEach((pats, idx) => {
        const bar = chartData[idx];
        if (pats.length === 1) {
          const p = pats[0];
          let shape: 'arrowUp' | 'arrowDown' | 'circle' = 'circle';
          let color = '#4ADE80';
          let position: 'aboveBar' | 'belowBar' = 'aboveBar';
          if (p.direction === 'bullish') {
            shape = 'arrowUp'; color = COLORS.candleUp; position = 'belowBar';
          } else if (p.direction === 'bearish') {
            shape = 'arrowDown'; color = COLORS.candleDown; position = 'aboveBar';
          }
          patternMarkers.push({
            time: toTime(bar.date), position, color, shape,
            text: p.type.replace(/_/g, ' '), size: 1,
          });
        } else {
          // Aggregate: show count with dominant direction
          const bullish = pats.filter((pat: IPatternV2) => pat.direction === 'bullish').length;
          const bearish = pats.filter((pat: IPatternV2) => pat.direction === 'bearish').length;
          const dominant = bullish > bearish ? 'bullish' : bearish > bullish ? 'bearish' : 'neutral';
          patternMarkers.push({
            time: toTime(bar.date),
            position: dominant === 'bullish' ? 'belowBar' : 'aboveBar',
            color: dominant === 'bullish' ? COLORS.candleUp : dominant === 'bearish' ? COLORS.candleDown : '#4ADE80',
            shape: dominant === 'bullish' ? 'arrowUp' : dominant === 'bearish' ? 'arrowDown' : 'circle',
            text: `${pats.length} patterns`,
            size: 1,
          });
        }
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

    // ── Crosshair OHLCV tooltip (Fix 3) ──
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point || param.point.x < 0) {
        setTooltipData(null);
        return;
      }
      const cData = param.seriesData.get(candleSeries);
      if (cData && 'open' in cData) {
        const vData = param.seriesData.get(volumeSeries);
        setTooltipData({
          open: (cData as { open: number }).open,
          high: (cData as { high: number }).high,
          low: (cData as { low: number }).low,
          close: (cData as { close: number }).close,
          volume: vData && 'value' in vData ? (vData as { value: number }).value : 0,
          date: String(param.time),
        });
      } else {
        setTooltipData(null);
      }
    });

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

    // ── Supertrend overlay ──
    if (supertrend && supertrend.series?.length > 0 && chartData.length > 0) {
      const stLen = Math.min(supertrend.series.length, supertrend.direction.length, chartData.length);
      const offset = chartData.length - stLen;

      const upData: { time: Time; value: number }[] = [];
      const downData: { time: Time; value: number }[] = [];

      for (let i = 0; i < stLen; i++) {
        const val = supertrend.series[i];
        if (val == null) continue;
        const time = toTime(chartData[offset + i].date);
        const dir = supertrend.direction[i];
        if (dir === 1) {
          upData.push({ time, value: val });
          if (i > 0 && supertrend.direction[i - 1] === -1) {
            downData.push({ time, value: val });
          }
        } else {
          downData.push({ time, value: val });
          if (i > 0 && supertrend.direction[i - 1] === 1) {
            upData.push({ time, value: val });
          }
        }
      }

      const stUpSeries = chart.addSeries(LineSeries, {
        color: COLORS.stUp, lineWidth: 2, lineStyle: LineStyle.Solid,
        priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        visible: overlays.has('st'),
      });
      stUpSeries.setData(upData);
      seriesRefs.current.stUp = stUpSeries;

      const stDownSeries = chart.addSeries(LineSeries, {
        color: COLORS.stDown, lineWidth: 2, lineStyle: LineStyle.Solid,
        priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        visible: overlays.has('st'),
      });
      stDownSeries.setData(downData);
      seriesRefs.current.stDown = stDownSeries;
    }

    // ── Auto Trendlines overlay (Fix 2: always create, toggle visibility) ──
    seriesRefs.current.trendlineSeries = [];
    if (trendlines) {
      const allTls = [
        ...(trendlines.support || []).map((tl) => ({ ...tl, color: '#34D399' })),
        ...(trendlines.resistance || []).map((tl) => ({ ...tl, color: '#FB7185' })),
      ];
      for (const tl of allTls) {
        if (tl.start_idx >= 0 && tl.end_idx < chartData.length && chartData.length > 0) {
          const tlSeries = chart.addSeries(LineSeries, {
            color: tl.color,
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
            visible: overlays.has('tl'),
          });
          const startIdx = Math.max(0, tl.start_idx);
          const endIdx = Math.min(chartData.length - 1, tl.end_idx);
          tlSeries.setData([
            { time: toTime(chartData[startIdx].date), value: tl.start_price },
            { time: toTime(chartData[endIdx].date), value: tl.end_price },
          ]);
          seriesRefs.current.trendlineSeries.push(tlSeries);
        }
      }
    }

    // ── Support / Resistance price lines ──
    srPriceLinesRef.current = [];
    if (overlays.has('sr')) {
      supportLevels.forEach((level) => {
        const pl = candleSeries.createPriceLine({
          price: level, color: COLORS.support, lineWidth: 1, lineStyle: LineStyle.Dashed,
          axisLabelVisible: true, title: `S ${formatPrice(level)}`,
        });
        srPriceLinesRef.current.push(pl);
      });
      resistanceLevels.forEach((level) => {
        const pl = candleSeries.createPriceLine({
          price: level, color: COLORS.resistance, lineWidth: 1, lineStyle: LineStyle.Dashed,
          axisLabelVisible: true, title: `R ${formatPrice(level)}`,
        });
        srPriceLinesRef.current.push(pl);
      });
    }

    // ── Auto Fibonacci retracement (Fix 2: always create, toggle via dedicated effect) ──
    fibPriceLinesRef.current = [];
    if (fibonacci && overlays.has('fib')) {
      for (const level of fibonacci.levels) {
        const pl = candleSeries.createPriceLine({
          price: level.price, color: 'rgba(34, 211, 238, 0.5)', lineWidth: 1,
          lineStyle: LineStyle.Dotted, axisLabelVisible: true, title: `Fib ${level.label}`,
        });
        fibPriceLinesRef.current.push(pl);
      }
    }

    // ── Chart pattern price target + stop loss lines ──
    {
      const chartPatterns = patterns.filter((p) => p.category === 'chart');
      for (const p of chartPatterns) {
        if (p.price_target != null) {
          candleSeries.createPriceLine({
            price: p.price_target,
            color: p.direction === 'bearish' ? '#FB7185' : '#34D399',
            lineWidth: 1, lineStyle: LineStyle.SparseDotted,
            axisLabelVisible: true, title: `T ${formatPrice(p.price_target)}`,
          });
        }
        if (p.stop_loss != null) {
          candleSeries.createPriceLine({
            price: p.stop_loss, color: '#FBBF24', lineWidth: 1,
            lineStyle: LineStyle.SparseDotted, axisLabelVisible: true,
            title: `SL ${formatPrice(p.stop_loss)}`,
          });
        }
        if (p.annotations) {
          for (const ann of p.annotations) {
            if (ann.type === 'target' && ann.price != null) {
              candleSeries.createPriceLine({
                price: ann.price, color: ann.color || '#4ADE80', lineWidth: 1,
                lineStyle: LineStyle.Dotted, axisLabelVisible: true, title: ann.label || '',
              });
            }
            if (ann.type === 'line' && ann.price != null) {
              candleSeries.createPriceLine({
                price: ann.price, color: ann.color || '#A78BFA', lineWidth: 1,
                lineStyle: ann.style === 'dashed' ? LineStyle.Dashed : LineStyle.Solid,
                axisLabelVisible: false, title: ann.label || '',
              });
            }
          }
        }
      }
    }

    // ── Regime zone background markers ──
    if (regimeZones.length > 0) {
      const regimeSeries = chart.addSeries(HistogramSeries, {
        priceScaleId: 'regime', priceFormat: { type: 'price' },
        lastValueVisible: false, priceLineVisible: false,
      });
      chart.priceScale('regime').applyOptions({
        scaleMargins: { top: 0, bottom: 0 }, visible: false,
      });
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
        return { time: toTime(bar.date), value: maxHigh, color };
      });
      regimeSeries.setData(regimeData);
    }

    // Fit content
    chart.timeScale().fitContent();

    // Track initial dimensions for drawing canvas
    setChartDimensions({ width: container.clientWidth, height: chartHeight });

    // ── ResizeObserver ──
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          const newHeight = window.innerWidth < 768 ? 280 : 400;
          chart.applyOptions({ width, height: newHeight });
          setChartDimensions({ width, height: newHeight });
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
        candle: null, volume: null,
        bbUpper: null, bbMiddle: null, bbLower: null,
        sma20: null, sma50: null, stUp: null, stDown: null,
        trendlineSeries: [],
      };
      setTooltipData(null);
    };
    // We intentionally only re-create the chart when data changes, not on overlay toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData, overlayData, patterns, regimeZones, changepointIndices, supportLevels, resistanceLevels, supertrend, trendlines, fibonacci]);

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

    // Supertrend visibility
    refs.stUp?.applyOptions({ visible: overlays.has('st') });
    refs.stDown?.applyOptions({ visible: overlays.has('st') });

    // Trendline visibility (Fix 2)
    for (const tls of refs.trendlineSeries) {
      tls.applyOptions({ visible: overlays.has('tl') });
    }
  }, [overlays]);

  // ── S/R toggle via removePriceLine (no chart re-creation needed) ──
  useEffect(() => {
    const candleSeries = seriesRefs.current.candle;
    if (!candleSeries) return;

    for (const pl of srPriceLinesRef.current) {
      try { candleSeries.removePriceLine(pl); } catch { /* already removed */ }
    }
    srPriceLinesRef.current = [];

    if (overlays.has('sr')) {
      supportLevels.forEach((level) => {
        const pl = candleSeries.createPriceLine({
          price: level, color: COLORS.support, lineWidth: 1, lineStyle: LineStyle.Dashed,
          axisLabelVisible: true, title: `S ${formatPrice(level)}`,
        });
        srPriceLinesRef.current.push(pl);
      });
      resistanceLevels.forEach((level) => {
        const pl = candleSeries.createPriceLine({
          price: level, color: COLORS.resistance, lineWidth: 1, lineStyle: LineStyle.Dashed,
          axisLabelVisible: true, title: `R ${formatPrice(level)}`,
        });
        srPriceLinesRef.current.push(pl);
      });
    }
  }, [overlays, supportLevels, resistanceLevels]);

  // ── Fib toggle via removePriceLine (Fix 2) ──
  useEffect(() => {
    const candleSeries = seriesRefs.current.candle;
    if (!candleSeries) return;

    for (const pl of fibPriceLinesRef.current) {
      try { candleSeries.removePriceLine(pl); } catch { /* already removed */ }
    }
    fibPriceLinesRef.current = [];

    if (overlays.has('fib') && fibonacci) {
      for (const level of fibonacci.levels) {
        const pl = candleSeries.createPriceLine({
          price: level.price, color: 'rgba(34, 211, 238, 0.5)', lineWidth: 1,
          lineStyle: LineStyle.Dotted, axisLabelVisible: true, title: `Fib ${level.label}`,
        });
        fibPriceLinesRef.current.push(pl);
      }
    }
  }, [overlays, fibonacci]);

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
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 md:px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 md:gap-3">
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

        <div className="flex items-center gap-1">
          {/* ── Overlay Toggle Pills ── */}
          {OVERLAY_CONFIG.map((o) => (
            <button
              key={o.id}
              onClick={() => toggleOverlay(o.id)}
              title={o.tip}
              className={cn(
                'px-2.5 py-1 text-[10px] font-semibold rounded-full transition-all border',
                overlays.has(o.id)
                  ? `${o.activeColor} bg-white/[0.12] border-white/20 shadow-sm shadow-white/5`
                  : 'text-muted-foreground border-transparent hover:text-white hover:bg-white/5'
              )}
            >
              {o.label}
            </button>
          ))}

          {/* ── Zoom Controls (Fix 15) ── */}
          <div className="flex items-center gap-0.5 ml-1.5 border-l border-white/10 pl-1.5">
            <button onClick={zoomIn} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-white transition-colors" title="Zoom in">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button onClick={zoomOut} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-white transition-colors" title="Zoom out">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button onClick={resetZoom} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-white transition-colors" title="Fit to screen">
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Chart Container with Drawing Overlay ── */}
      <div className="relative">
        {/* ── Crosshair OHLCV Tooltip (Fix 3) ── */}
        {tooltipData && (
          <div className="absolute top-2 left-2 z-20 pointer-events-none bg-[#111827]/90 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono space-y-0.5 backdrop-blur-sm">
            <div className="text-gray-400 text-[10px] mb-1">{tooltipData.date}</div>
            <div className="flex gap-3">
              <span className="text-gray-500 w-3">O</span>
              <span className="text-white">{formatPrice(tooltipData.open)}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-500 w-3">H</span>
              <span className="text-white">{formatPrice(tooltipData.high)}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-500 w-3">L</span>
              <span className="text-white">{formatPrice(tooltipData.low)}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-500 w-3">C</span>
              <span className={tooltipData.close >= tooltipData.open ? 'text-emerald-400' : 'text-rose-400'}>
                {formatPrice(tooltipData.close)}
              </span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-500 w-3">V</span>
              <span className="text-white">{tooltipData.volume.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        <DrawingToolbar
          activeTool={activeTool}
          onSelectTool={safeSetActiveTool}
          onClearAll={() => {
            setDrawings([]);
            undoStackRef.current = [];
            if (storageKey) localStorage.removeItem(storageKey);
          }}
          hasDrawings={drawings.length > 0}
        />
        <div ref={containerRef} className="w-full" />
        <DrawingCanvas
          chartApi={chartRef.current}
          candleSeries={seriesRefs.current.candle}
          width={chartDimensions.width}
          height={chartDimensions.height}
          activeTool={activeTool}
          drawings={drawings}
          onDrawingComplete={(d) => {
            undoStackRef.current = []; // Clear undo stack on new drawing
            setDrawings((prev) => [...prev, d]);
          }}
          onDrawingDelete={handleDrawingDelete}
        />
      </div>

      {/* ── Legend row ── */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3 px-3 md:px-4 pb-3 pt-1">
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
        {overlays.has('st') && supertrend && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-[2px] bg-teal-400 inline-block rounded-full" />
            <span className="text-[10px] text-teal-400/80">
              ST({supertrend.atr_period},{supertrend.multiplier})
              {supertrend.current_direction === 'bullish' ? ' ▲' : supertrend.current_direction === 'bearish' ? ' ▼' : ''}
            </span>
          </div>
        )}
        {overlays.has('tl') && trendlines && (trendlines.support.length > 0 || trendlines.resistance.length > 0) && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-[2px] border-t border-dashed border-violet-400 inline-block" />
            <span className="text-[10px] text-violet-400/80">Trendlines</span>
          </div>
        )}
        {overlays.has('fib') && fibonacci && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-[2px] border-t border-dotted border-cyan-400 inline-block" />
            <span className="text-[10px] text-cyan-400/80">Fibonacci</span>
          </div>
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
