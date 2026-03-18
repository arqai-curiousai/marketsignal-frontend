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
import { ZoomIn, ZoomOut, Maximize2, Minimize2, ScanLine } from 'lucide-react';
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
  focusedPattern?: IPatternV2 | null;
  onChartPatternClick?: (pattern: IPatternV2) => void;
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

function formatVolume(vol: number): string {
  if (vol >= 10_000_000) return `${(vol / 10_000_000).toFixed(1)}Cr`;
  if (vol >= 100_000) return `${(vol / 100_000).toFixed(1)}L`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toLocaleString('en-IN');
}

/** Compute marker color based on direction + confidence */
function markerColor(direction: string, confidence: number): string {
  if (direction === 'bullish') {
    if (confidence > 0.8) return '#34D399';
    if (confidence > 0.6) return 'rgba(52,211,153,0.65)';
    return 'rgba(52,211,153,0.35)';
  }
  if (direction === 'bearish') {
    if (confidence > 0.8) return '#FB7185';
    if (confidence > 0.6) return 'rgba(251,113,133,0.65)';
    return 'rgba(251,113,133,0.35)';
  }
  // neutral
  if (confidence > 0.8) return '#FBBF24';
  if (confidence > 0.6) return 'rgba(251,191,36,0.65)';
  return 'rgba(251,191,36,0.35)';
}

/** Map quality grade to marker size */
function gradeSize(grade: string): number {
  if (grade === 'A+') return 2;
  if (grade === 'A') return 1.5;
  if (grade === 'B') return 1;
  return 0.6;
}

const GRADE_STYLES: Record<string, string> = {
  'A+': 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30',
  'A': 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20',
  'B': 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20',
  'C': 'bg-gray-500/15 text-gray-400 ring-1 ring-gray-500/20',
};

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
  focusedPattern,
  onChartPatternClick,
}: PatternChartProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
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

  // ── Pattern Pulse Strip canvas ref ──
  const pulseCanvasRef = useRef<HTMLCanvasElement>(null);

  // ── Highlight overlay canvas ref (for chart-table connection) ──
  const highlightCanvasRef = useRef<HTMLCanvasElement>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fullscreen state ──
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Drawing tools state ──
  const [activeTool, setActiveTool] = useState<DrawingTool | null>(null);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });

  // ── Undo stack for drawings (Fix 18) ──
  const undoStackRef = useRef<Drawing[]>([]);

  // ── Crosshair tooltip state (enriched with pattern data) ──
  const [tooltipData, setTooltipData] = useState<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    date: string;
    patterns: IPatternV2[];
    cursorX: number;
  } | null>(null);

  // ── Precompute pattern lookup by date for O(1) tooltip access ──
  const patternsByDate = useMemo(() => {
    const map = new Map<string, IPatternV2[]>();
    for (const p of patterns) {
      if (p.pattern_end_index >= 0 && p.pattern_end_index < chartData.length) {
        const date = chartData[p.pattern_end_index].date;
        const arr = map.get(date) || [];
        arr.push(p);
        map.set(date, arr);
      }
    }
    // Sort each bar's patterns by quality
    map.forEach((arr, key) => {
      map.set(key, arr.sort((a: IPatternV2, b: IPatternV2) => (b.quality_score ?? 0) - (a.quality_score ?? 0)));
    });
    return map;
  }, [patterns, chartData]);

  // ── Precompute per-bar pulse data for the pattern heatmap strip ──
  const barPulseData = useMemo(() => {
    const data: { bullish: number; bearish: number; neutral: number; maxQuality: number }[] =
      new Array(chartData.length).fill(null).map(() => ({ bullish: 0, bearish: 0, neutral: 0, maxQuality: 0 }));
    for (const p of patterns) {
      const idx = p.pattern_end_index;
      if (idx >= 0 && idx < chartData.length) {
        if (p.direction === 'bullish') data[idx].bullish++;
        else if (p.direction === 'bearish') data[idx].bearish++;
        else data[idx].neutral++;
        data[idx].maxQuality = Math.max(data[idx].maxQuality, p.quality_score ?? 0);
      }
    }
    return data;
  }, [patterns, chartData]);

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

  // ── Fullscreen toggle ──
  const toggleFullscreen = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
        // Fallback: browser blocked fullscreen
      });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Listen for fullscreen changes and resize chart accordingly
  useEffect(() => {
    const handler = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      // Wait for DOM reflow before reading new dimensions
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const chart = chartRef.current;
          const wrapper = wrapperRef.current;
          if (!chart || !wrapper) return;
          const w = wrapper.clientWidth;
          const h = isFs
            ? window.innerHeight - 56
            : window.innerWidth < 768 ? 320 : 500;
          chart.applyOptions({ width: w, height: h });
          setChartDimensions({ width: w, height: h });
          chart.timeScale().fitContent();
        });
      });
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ── Chart creation & data binding ──
  useEffect(() => {
    if (!containerRef.current || !chartData.length) return;

    const container = containerRef.current;

    // Determine dimensions
    const isMobile = window.innerWidth < 768;
    const chartHeight = isMobile ? 320 : 500;

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

    // ── Smart Semantic Markers — encode info via size/color/shape, no text ──
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
        // Sort by quality so we pick the best pattern for the primary marker
        const sorted = [...pats].sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0));
        const best = sorted[0];

        if (pats.length === 1) {
          // Single pattern — shape=direction, size=grade, color=confidence
          const p = best;
          let shape: 'arrowUp' | 'arrowDown' | 'circle' = 'circle';
          let position: 'aboveBar' | 'belowBar' = 'aboveBar';
          if (p.direction === 'bullish') {
            shape = 'arrowUp'; position = 'belowBar';
          } else if (p.direction === 'bearish') {
            shape = 'arrowDown'; position = 'aboveBar';
          }
          patternMarkers.push({
            time: toTime(bar.date), position, shape,
            color: markerColor(p.direction, p.confidence ?? 0.5),
            text: '',
            size: gradeSize(p.quality_grade ?? 'C'),
          });
        } else {
          // Multi-pattern bar — show count, use dominant direction, best pattern's grade for size
          const bullish = pats.filter((pat: IPatternV2) => pat.direction === 'bullish').length;
          const bearish = pats.filter((pat: IPatternV2) => pat.direction === 'bearish').length;
          const dominant = bullish > bearish ? 'bullish' : bearish > bullish ? 'bearish' : 'neutral';
          patternMarkers.push({
            time: toTime(bar.date),
            position: dominant === 'bullish' ? 'belowBar' : 'aboveBar',
            color: markerColor(dominant, best.confidence ?? 0.5),
            shape: dominant === 'bullish' ? 'arrowUp' : dominant === 'bearish' ? 'arrowDown' : 'circle',
            text: `${pats.length}`,
            size: Math.max(1, gradeSize(best.quality_grade ?? 'C')),
          });
        }

        // Triple-confirmed gold accent — second marker on opposite side
        const tripleConfirmed = sorted.find(
          (p) => p.volume_confirmed && p.trend_aligned && p.multi_tf_aligned,
        );
        if (tripleConfirmed) {
          const mainPosition = tripleConfirmed.direction === 'bullish' ? 'belowBar' : 'aboveBar';
          patternMarkers.push({
            time: toTime(bar.date),
            position: mainPosition === 'aboveBar' ? 'belowBar' : 'aboveBar',
            color: '#FBBF24',
            shape: 'circle' as const,
            text: '',
            size: 0.3,
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

    // ── Crosshair tooltip with pattern insight ──
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point || param.point.x < 0) {
        setTooltipData(null);
        return;
      }
      const cData = param.seriesData.get(candleSeries);
      if (cData && 'open' in cData) {
        const vData = param.seriesData.get(volumeSeries);
        const dateKey = String(param.time);
        const barPatterns = patternsByDate.get(dateKey) || [];
        setTooltipData({
          open: (cData as { open: number }).open,
          high: (cData as { high: number }).high,
          low: (cData as { low: number }).low,
          close: (cData as { close: number }).close,
          volume: vData && 'value' in vData ? (vData as { value: number }).value : 0,
          date: dateKey,
          patterns: barPatterns,
          cursorX: param.point.x,
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
    const resizeObserver = new ResizeObserver(() => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const w = wrapper.clientWidth;
      if (w > 0) {
        const isFs = !!document.fullscreenElement;
        const newHeight = isFs
          ? window.innerHeight - 56
          : window.innerWidth < 768 ? 320 : 500;
        chart.applyOptions({ width: w, height: newHeight });
        setChartDimensions({ width: w, height: newHeight });
      }
    });
    resizeObserver.observe(container);
    // Also observe the wrapper for fullscreen dimension changes
    if (wrapperRef.current) resizeObserver.observe(wrapperRef.current);

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

  // ── Pattern Pulse Strip — paint heatmap between candles and volume ──
  const paintPulseStrip = useCallback(() => {
    const canvas = pulseCanvasRef.current;
    const chart = chartRef.current;
    if (!canvas || !chart || !chartData.length) return;

    const dpr = window.devicePixelRatio || 1;
    const stripH = window.innerWidth < 768 ? 14 : 18;
    const rect = canvas.parentElement?.getBoundingClientRect();
    const w = rect?.width || chartDimensions.width;

    canvas.width = w * dpr;
    canvas.height = stripH * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${stripH}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, stripH);

    // Top border line
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, 0, w, 1);

    const ts = chart.timeScale();
    const visibleRange = ts.getVisibleLogicalRange();
    if (!visibleRange) return;

    const from = Math.max(0, Math.floor(visibleRange.from));
    const to = Math.min(chartData.length - 1, Math.ceil(visibleRange.to));

    for (let i = from; i <= to; i++) {
      const pulse = barPulseData[i];
      if (!pulse || (pulse.bullish === 0 && pulse.bearish === 0 && pulse.neutral === 0)) continue;

      const x = ts.timeToCoordinate(toTime(chartData[i].date));
      if (x === null || x < 0 || x > w) continue;

      // Determine cell color and intensity
      const totalCount = pulse.bullish + pulse.bearish + pulse.neutral;
      const countFactor = Math.min(1, totalCount / 3); // 3+ patterns = max intensity
      const qualityFactor = Math.max(0.3, pulse.maxQuality);
      const alpha = 0.15 + 0.45 * countFactor * qualityFactor;

      let r: number, g: number, b: number;
      if (pulse.bullish > 0 && pulse.bearish > 0) {
        // Mixed/conflict: amber
        r = 251; g = 191; b = 36;
      } else if (pulse.bullish > pulse.bearish) {
        // Bullish: emerald
        r = 52; g = 211; b = 153;
      } else if (pulse.bearish > pulse.bullish) {
        // Bearish: rose
        r = 251; g = 113; b = 133;
      } else {
        // Neutral: gray
        r = 156; g = 163; b = 175;
      }

      // Compute bar width from neighboring bars
      let barW = 6;
      if (i + 1 < chartData.length) {
        const nextX = ts.timeToCoordinate(toTime(chartData[i + 1].date));
        if (nextX !== null) barW = Math.max(3, (nextX - x) * 0.8);
      }

      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      // Rounded rect for each cell
      const cellX = x - barW / 2;
      const cellY = 2;
      const cellH = stripH - 4;
      const radius = 2;
      ctx.beginPath();
      ctx.moveTo(cellX + radius, cellY);
      ctx.lineTo(cellX + barW - radius, cellY);
      ctx.quadraticCurveTo(cellX + barW, cellY, cellX + barW, cellY + radius);
      ctx.lineTo(cellX + barW, cellY + cellH - radius);
      ctx.quadraticCurveTo(cellX + barW, cellY + cellH, cellX + barW - radius, cellY + cellH);
      ctx.lineTo(cellX + radius, cellY + cellH);
      ctx.quadraticCurveTo(cellX, cellY + cellH, cellX, cellY + cellH - radius);
      ctx.lineTo(cellX, cellY + radius);
      ctx.quadraticCurveTo(cellX, cellY, cellX + radius, cellY);
      ctx.closePath();
      ctx.fill();
    }
  }, [chartData, barPulseData, chartDimensions.width]);

  // Subscribe to visible range changes to repaint pulse strip
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    paintPulseStrip();
    chart.timeScale().subscribeVisibleLogicalRangeChange(paintPulseStrip);
    return () => {
      try { chart.timeScale().unsubscribeVisibleLogicalRangeChange(paintPulseStrip); } catch { /* chart may be disposed */ }
    };
  }, [paintPulseStrip]);

  // Repaint pulse strip on resize
  useEffect(() => {
    paintPulseStrip();
  }, [chartDimensions, paintPulseStrip]);

  // ── Chart-Table Connection: scroll + highlight on focusedPattern ──
  useEffect(() => {
    if (!focusedPattern || !chartRef.current || !chartData.length) return;
    const chart = chartRef.current;
    const endIdx = focusedPattern.pattern_end_index;
    const startIdx = focusedPattern.pattern_start_index ?? endIdx;
    if (endIdx < 0 || endIdx >= chartData.length) return;

    // Scroll to center the pattern
    const ts = chart.timeScale();
    const range = ts.getVisibleLogicalRange();
    if (range) {
      const span = range.to - range.from;
      const patternCenter = (startIdx + endIdx) / 2;
      ts.setVisibleLogicalRange({
        from: patternCenter - span / 2,
        to: patternCenter + span / 2,
      });
    }

    // Draw highlight overlay
    const canvas = highlightCanvasRef.current;
    const candle = seriesRefs.current.candle;
    if (!canvas || !candle) return;

    // Clear previous timer
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);

    const dpr = window.devicePixelRatio || 1;
    const w = chartDimensions.width;
    const h = chartDimensions.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Wait a tick for scroll to settle, then paint
    requestAnimationFrame(() => {
      const safeStart = Math.max(0, startIdx);
      const safeEnd = Math.min(chartData.length - 1, endIdx);

      const x1 = ts.timeToCoordinate(toTime(chartData[safeStart].date));
      const x2 = ts.timeToCoordinate(toTime(chartData[safeEnd].date));
      if (x1 === null || x2 === null) return;

      // Use approximate mapping — highlight a generous vertical zone
      const padding = 20;
      const leftX = Math.min(x1, x2) - padding;
      const rightX = Math.max(x1, x2) + padding;
      const topY = h * 0.02;
      const bottomY = h * 0.78;

      // Fade-in animation
      let opacity = 0;
      const fadeIn = () => {
        opacity = Math.min(1, opacity + 0.08);
        ctx.clearRect(0, 0, w, h);

        // Fill
        ctx.fillStyle = `rgba(59,130,246,${0.08 * opacity})`;
        ctx.beginPath();
        const radius = 6;
        const rectW = rightX - leftX;
        const rectH = bottomY - topY;
        ctx.moveTo(leftX + radius, topY);
        ctx.lineTo(leftX + rectW - radius, topY);
        ctx.quadraticCurveTo(leftX + rectW, topY, leftX + rectW, topY + radius);
        ctx.lineTo(leftX + rectW, topY + rectH - radius);
        ctx.quadraticCurveTo(leftX + rectW, topY + rectH, leftX + rectW - radius, topY + rectH);
        ctx.lineTo(leftX + radius, topY + rectH);
        ctx.quadraticCurveTo(leftX, topY + rectH, leftX, topY + rectH - radius);
        ctx.lineTo(leftX, topY + radius);
        ctx.quadraticCurveTo(leftX, topY, leftX + radius, topY);
        ctx.closePath();
        ctx.fill();

        // Border
        ctx.strokeStyle = `rgba(59,130,246,${0.35 * opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (opacity < 1) {
          requestAnimationFrame(fadeIn);
        }
      };
      fadeIn();

      // Fade out after 3s
      highlightTimerRef.current = setTimeout(() => {
        let fadeOpacity = 1;
        const fadeOut = () => {
          fadeOpacity = Math.max(0, fadeOpacity - 0.04);
          ctx.clearRect(0, 0, w, h);
          if (fadeOpacity > 0) {
            ctx.fillStyle = `rgba(59,130,246,${0.08 * fadeOpacity})`;
            ctx.beginPath();
            const rr = 6;
            const rw = rightX - leftX;
            const rh = bottomY - topY;
            ctx.moveTo(leftX + rr, topY);
            ctx.lineTo(leftX + rw - rr, topY);
            ctx.quadraticCurveTo(leftX + rw, topY, leftX + rw, topY + rr);
            ctx.lineTo(leftX + rw, topY + rh - rr);
            ctx.quadraticCurveTo(leftX + rw, topY + rh, leftX + rw - rr, topY + rh);
            ctx.lineTo(leftX + rr, topY + rh);
            ctx.quadraticCurveTo(leftX, topY + rh, leftX, topY + rh - rr);
            ctx.lineTo(leftX, topY + rr);
            ctx.quadraticCurveTo(leftX, topY, leftX + rr, topY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = `rgba(59,130,246,${0.35 * fadeOpacity})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            requestAnimationFrame(fadeOut);
          }
        };
        fadeOut();
      }, 3000);
    });

    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, [focusedPattern, chartData, chartDimensions]);

  // ── Chart click → table connection ──
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !onChartPatternClick) return;

    const handler = (param: { time?: Time; point?: { x: number; y: number } }) => {
      if (!param.time) return;
      const dateKey = String(param.time);
      const barPatterns = patternsByDate.get(dateKey);
      if (barPatterns && barPatterns.length > 0) {
        // Click selects the highest-quality pattern on that bar
        onChartPatternClick(barPatterns[0]);
      }
    };

    chart.subscribeClick(handler);
    return () => { chart.unsubscribeClick(handler); };
  }, [onChartPatternClick, patternsByDate]);

  // ── Render ──

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-[320px] md:h-[500px] bg-[#0B0F19] rounded-xl border border-white/[0.06]">
        <p className="text-sm text-muted-foreground">No chart data available</p>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'rounded-xl border border-white/[0.06] bg-[#0B0F19] overflow-hidden shadow-lg shadow-black/20',
        isFullscreen && 'rounded-none border-0',
      )}
    >
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
            <button onClick={resetZoom} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-white transition-colors" title="Fit all data">
              <ScanLine className="h-3.5 w-3.5" />
            </button>
            <button onClick={toggleFullscreen} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-white transition-colors" title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Chart Container with Drawing Overlay ── */}
      <div className="relative">
        {/* ── Pattern Insight Tooltip ── */}
        {tooltipData && (
          <div
            className={cn(
              'absolute top-2 z-20 pointer-events-none transition-all duration-150 ease-out',
              'bg-[#111827]/92 border border-white/10 rounded-xl px-3 py-2.5 backdrop-blur-xl',
              'shadow-2xl shadow-black/40 max-w-[280px] md:max-w-[300px]',
              tooltipData.cursorX < (chartDimensions.width * 0.35) ? 'right-2' : 'left-2',
            )}
          >
            {/* OHLCV Section */}
            <div className="text-[10px] text-gray-500 mb-1.5 font-mono">{tooltipData.date}</div>
            <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums mb-0.5">
              <span><span className="text-gray-600">O</span> <span className="text-white">{formatPrice(tooltipData.open)}</span></span>
              <span><span className="text-gray-600">H</span> <span className="text-white">{formatPrice(tooltipData.high)}</span></span>
              <span><span className="text-gray-600">L</span> <span className="text-white">{formatPrice(tooltipData.low)}</span></span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums">
              <span>
                <span className="text-gray-600">C</span>{' '}
                <span className={tooltipData.close >= tooltipData.open ? 'text-emerald-400' : 'text-rose-400'}>
                  {formatPrice(tooltipData.close)}
                </span>
              </span>
              <span><span className="text-gray-600">V</span> <span className="text-white">{formatVolume(tooltipData.volume)}</span></span>
            </div>

            {/* Pattern Section */}
            {tooltipData.patterns.length > 0 && (
              <>
                <div className="border-t border-white/[0.06] my-2" />
                <div className="space-y-1.5">
                  {tooltipData.patterns.slice(0, 4).map((p, i) => (
                    <div key={p.id || i}>
                      {/* Pattern header: direction arrow + name + grade */}
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          'text-[10px]',
                          p.direction === 'bullish' ? 'text-emerald-400' : p.direction === 'bearish' ? 'text-rose-400' : 'text-amber-400',
                        )}>
                          {p.direction === 'bullish' ? '▲' : p.direction === 'bearish' ? '▼' : '◆'}
                        </span>
                        <span className="text-[11px] font-medium text-white truncate flex-1">
                          {p.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                        <span className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                          GRADE_STYLES[p.quality_grade ?? 'C'] || GRADE_STYLES['C'],
                        )}>
                          {p.quality_grade ?? 'C'}
                        </span>
                      </div>
                      {/* Metrics row: confidence, win rate, validation dots */}
                      <div className="flex items-center gap-1.5 mt-0.5 ml-4">
                        <span className="text-[9px] text-gray-500">
                          {Math.round((p.confidence ?? 0) * 100)}% conf
                        </span>
                        <span className="text-[9px] text-gray-600">·</span>
                        <span className="text-[9px] text-gray-500">
                          {Math.round((p.historical_win_rate ?? 0) * 100)}% win
                        </span>
                        <span className="text-[9px] text-gray-600">·</span>
                        {/* Validation dots: volume, trend, multi-TF */}
                        <div className="hidden md:flex items-center gap-0.5">
                          <span className={cn('w-1.5 h-1.5 rounded-full', p.volume_confirmed ? 'bg-emerald-400' : 'bg-gray-700')} title="Volume" />
                          <span className={cn('w-1.5 h-1.5 rounded-full', p.trend_aligned ? 'bg-emerald-400' : 'bg-gray-700')} title="Trend" />
                          <span className={cn('w-1.5 h-1.5 rounded-full', p.multi_tf_aligned ? 'bg-emerald-400' : 'bg-gray-700')} title="MTF" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {tooltipData.patterns.length > 4 && (
                    <div className="text-[9px] text-gray-600 ml-4">
                      +{tooltipData.patterns.length - 4} more
                    </div>
                  )}
                </div>

                {/* Target / Stop Loss from best pattern */}
                {(() => {
                  const best = tooltipData.patterns[0];
                  if (!best?.price_target && !best?.stop_loss) return null;
                  return (
                    <>
                      <div className="border-t border-dashed border-white/[0.04] my-1.5" />
                      <div className="flex items-center gap-3 text-[10px] font-mono">
                        {best.price_target != null && (
                          <span className="text-emerald-400/80">
                            Target {'\u20B9'}{formatPrice(best.price_target)}
                            {tooltipData.close > 0 && (
                              <span className="text-emerald-400/50 ml-0.5">
                                ({((best.price_target - tooltipData.close) / tooltipData.close * 100).toFixed(1)}%)
                              </span>
                            )}
                          </span>
                        )}
                        {best.stop_loss != null && (
                          <span className="text-rose-400/80">
                            Stop {'\u20B9'}{formatPrice(best.stop_loss)}
                            {tooltipData.close > 0 && (
                              <span className="text-rose-400/50 ml-0.5">
                                ({((best.stop_loss - tooltipData.close) / tooltipData.close * 100).toFixed(1)}%)
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </>
                  );
                })()}
              </>
            )}
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
        {/* ── Pattern Pulse Strip — heatmap between candles and volume ── */}
        <canvas
          ref={pulseCanvasRef}
          className="absolute left-0 pointer-events-none z-[5]"
          style={{ bottom: `${chartDimensions.height * 0.2 + 2}px` }}
        />
        {/* ── Pattern Highlight Overlay (chart-table connection) ── */}
        <canvas
          ref={highlightCanvasRef}
          className="absolute top-0 left-0 pointer-events-none z-[6]"
        />
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
