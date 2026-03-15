'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { hierarchy, pack, type HierarchyCircularNode } from 'd3-hierarchy';
import { getStocks } from '@/src/lib/api/stockApi';
import type { IStock } from '@/types/stock';
import { SECTOR_COLORS } from '@/types/analytics';
import { BubbleTooltip } from './BubbleTooltip';
import { SectorLegend } from './SectorLegend';

// Relative market cap weights for NIFTY 50 (approximate, used for bubble sizing)
const MARKET_CAP_WEIGHTS: Record<string, number> = {
  RELIANCE: 18, HDFCBANK: 12, TCS: 13, ICICIBANK: 8, INFY: 7,
  HINDUNILVR: 6, SBIN: 6, BHARTIARTL: 5, ITC: 5, KOTAKBANK: 4,
  LT: 4, AXISBANK: 4, BAJFINANCE: 4, MARUTI: 3, HCLTECH: 3,
  ASIANPAINT: 3, TITAN: 3, SUNPHARMA: 3, TATAMOTORS: 3, WIPRO: 3,
  ULTRACEMCO: 2, NESTLEIND: 2, BAJAJFINSV: 2, TECHM: 2, POWERGRID: 2,
  NTPC: 2, ONGC: 2, JSWSTEEL: 2, TATASTEEL: 2, M_M: 2,
  ADANIENT: 2, ADANIPORTS: 2, INDUSINDBK: 2, GRASIM: 2, DIVISLAB: 2,
  CIPLA: 2, DRREDDY: 2, BAJAJ_AUTO: 2, EICHERMOT: 2, APOLLOHOSP: 2,
  BPCL: 1.5, COALINDIA: 1.5, SBILIFE: 1.5, HDFCLIFE: 1.5, TATACONSUM: 1.5,
  HEROMOTOCO: 1.5, UPL: 1, BRITANNIA: 1.5, HINDALCO: 1.5, SHRIRAMFIN: 1,
};

interface HierarchyDatum {
  name: string;
  sector?: string;
  ticker?: string;
  stock?: IStock;
  weight?: number;
  children?: HierarchyDatum[];
}

interface TooltipState {
  visible: boolean;
  ticker: string;
  name: string;
  sector: string;
  lastPrice: number | null;
  changePercent: number | null;
  x: number;
  y: number;
}

export function BubbleCluster() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [stocks, setStocks] = useState<IStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, ticker: '', name: '', sector: '',
    lastPrice: null, changePercent: null, x: 0, y: 0,
  });
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [mounted, setMounted] = useState(false);

  // Fetch stocks
  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getStocks({ exchange: 'NSE', pageSize: 50 });
      if (res.success && res.data) {
        setStocks(res.data.items);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width: Math.max(width, 300), height: Math.max(height, 300) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Trigger entrance animation after pack layout is computed
  useEffect(() => {
    if (stocks.length > 0) {
      const timer = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(timer);
    }
  }, [stocks.length]);

  // Unique sectors
  const sectors = useMemo(() => {
    const s = new Set(stocks.map((st) => st.sector).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [stocks]);

  // Build hierarchy data for d3 circle packing
  const hierarchyData = useMemo((): HierarchyDatum => {
    const grouped = new Map<string, IStock[]>();
    for (const stock of stocks) {
      const sector = stock.sector || 'Other';
      if (!grouped.has(sector)) grouped.set(sector, []);
      grouped.get(sector)!.push(stock);
    }

    return {
      name: 'root',
      children: Array.from(grouped.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([sector, sectorStocks]) => ({
          name: sector,
          sector,
          children: sectorStocks.map((stock) => ({
            name: stock.ticker,
            ticker: stock.ticker,
            sector,
            stock,
            // Use sqrt to compress range so RELIANCE doesn't overwhelm
            weight: Math.sqrt(MARKET_CAP_WEIGHTS[stock.ticker] ?? 1),
          })),
        })),
    };
  }, [stocks]);

  // Compute circle packing layout
  const packedRoot = useMemo(() => {
    if (stocks.length === 0) return null;
    const { width, height } = dimensions;
    const padding = width < 500 ? 8 : 14;
    const innerPadding = width < 500 ? 1 : 3;

    const root = hierarchy(hierarchyData)
      .sum((d) => d.weight ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const packLayout = pack<HierarchyDatum>()
      .size([width - 10, height - 10])
      .padding((node) => (node.depth === 0 ? padding : innerPadding));

    return packLayout(root);
  }, [hierarchyData, dimensions, stocks.length]);

  // Extract sector nodes (depth 1) and stock nodes (leaves)
  const { sectorNodes, stockNodes } = useMemo(() => {
    if (!packedRoot) return { sectorNodes: [] as HierarchyCircularNode<HierarchyDatum>[], stockNodes: [] as HierarchyCircularNode<HierarchyDatum>[] };
    const sectorNodes: HierarchyCircularNode<HierarchyDatum>[] = [];
    const stockNodes: HierarchyCircularNode<HierarchyDatum>[] = [];

    for (const node of packedRoot.descendants()) {
      if (node.depth === 1) sectorNodes.push(node);
      else if (node.depth === 2) stockNodes.push(node);
    }

    return { sectorNodes, stockNodes };
  }, [packedRoot]);

  // Filter logic
  const filteredIds = useMemo(() => {
    const searchLower = search.toLowerCase();
    return new Set(
      stockNodes
        .filter((n) => {
          const matchSector = activeSector === null || n.data.sector === activeSector;
          const matchSearch = !search ||
            (n.data.ticker?.toLowerCase().includes(searchLower) ?? false) ||
            (n.data.stock?.name.toLowerCase().includes(searchLower) ?? false);
          return matchSector && matchSearch;
        })
        .map((n) => n.data.ticker),
    );
  }, [stockNodes, search, activeSector]);

  // Sector index map for staggered animation
  const sectorIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    sectorNodes.forEach((n, i) => {
      if (n.data.sector) map.set(n.data.sector, i);
    });
    return map;
  }, [sectorNodes]);

  const handleBubbleHover = useCallback(
    (node: HierarchyCircularNode<HierarchyDatum>, event: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || !node.data.stock) return;
      setHoveredId(node.data.ticker ?? null);
      setTooltip({
        visible: true,
        ticker: node.data.ticker ?? '',
        name: node.data.stock.name,
        sector: node.data.sector ?? '',
        lastPrice: node.data.stock.lastPrice ?? null,
        changePercent: node.data.stock.changePercent ?? null,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    },
    [],
  );

  const handleBubbleLeave = useCallback(() => {
    setHoveredId(null);
    setTooltip((t) => ({ ...t, visible: false }));
  }, []);

  const handleBubbleClick = useCallback(
    (ticker: string) => {
      router.push(`/stocks/${ticker}`);
    },
    [router],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + Sector Legend */}
      <div className="flex flex-col gap-3">
        <div className="relative max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stocks..."
            className="w-full px-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-blue/50"
          />
        </div>
        <SectorLegend
          sectors={sectors}
          activeSector={activeSector}
          onSectorClick={setActiveSector}
        />
      </div>

      {/* Bubble SVG Container */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent overflow-hidden"
        style={{ height: 'clamp(350px, 55vh, 600px)' }}
      >
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <filter id="bubble-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="bubble-gradient" cx="35%" cy="35%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>

          {/* Layer 1: Sector background circles */}
          {sectorNodes.map((node) => {
            const color = SECTOR_COLORS[node.data.sector ?? ''] || '#64748B';
            const sectorIdx = sectorIndexMap.get(node.data.sector ?? '') ?? 0;
            const hasFilteredStocks = activeSector === null || activeSector === node.data.sector;

            return (
              <g key={`sector-${node.data.sector}`}
                style={{
                  opacity: hasFilteredStocks ? 1 : 0.08,
                  transition: 'opacity 0.4s ease',
                }}
              >
                {/* Sector boundary */}
                <circle
                  cx={node.x + 5}
                  cy={node.y + 5}
                  r={mounted ? node.r : 0}
                  fill={color}
                  fillOpacity={0.04}
                  stroke={color}
                  strokeWidth={1}
                  strokeOpacity={0.12}
                  strokeDasharray="4 3"
                  style={{
                    transition: `r 0.6s ease-out ${sectorIdx * 60}ms`,
                  }}
                />

                {/* Sector label */}
                {node.r > 40 && (
                  <text
                    x={node.x + 5}
                    y={node.y - node.r + 14 + 5}
                    textAnchor="middle"
                    fill={color}
                    fillOpacity={mounted ? 0.7 : 0}
                    fontSize={Math.max(7, Math.min(10, node.r * 0.15))}
                    fontWeight="600"
                    letterSpacing="0.06em"
                    style={{
                      textTransform: 'uppercase' as const,
                      pointerEvents: 'none',
                      userSelect: 'none',
                      transition: `fill-opacity 0.5s ease ${sectorIdx * 60 + 300}ms`,
                    }}
                  >
                    {(node.data.sector ?? '').length > 18
                      ? (node.data.sector ?? '').slice(0, 16) + '…'
                      : node.data.sector}
                  </text>
                )}
              </g>
            );
          })}

          {/* Layer 2: Stock bubbles */}
          {stockNodes.map((node) => {
            const stock = node.data.stock;
            if (!stock) return null;

            const ticker = node.data.ticker ?? '';
            const color = SECTOR_COLORS[node.data.sector ?? ''] || '#64748B';
            const isFiltered = filteredIds.has(ticker);
            const isHovered = hoveredId === ticker;
            const changePercent = stock.changePercent ?? 0;
            const changeMag = Math.min(Math.abs(changePercent) / 3, 1);
            const isPositive = changePercent >= 0;
            const glowColor = isPositive
              ? `rgba(110,231,183,${changeMag * 0.6})`
              : `rgba(252,165,165,${changeMag * 0.6})`;
            const sectorIdx = sectorIndexMap.get(node.data.sector ?? '') ?? 0;
            const r = node.r;

            return (
              <g
                key={ticker}
                style={{
                  cursor: 'pointer',
                  opacity: isFiltered ? (mounted ? 1 : 0) : 0.12,
                  transition: `opacity 0.4s ease ${sectorIdx * 60 + 100}ms`,
                }}
                onMouseEnter={(e) => handleBubbleHover(node, e)}
                onMouseLeave={handleBubbleLeave}
                onClick={() => handleBubbleClick(ticker)}
              >
                {/* Glow circle */}
                {changeMag > 0.1 && isFiltered && (
                  <circle
                    cx={node.x + 5}
                    cy={node.y + 5}
                    r={mounted ? r + 4 + changeMag * 4 : 0}
                    fill="none"
                    stroke={glowColor}
                    strokeWidth={1 + changeMag * 1.5}
                    filter="url(#bubble-glow)"
                    style={{ transition: `r 0.6s ease-out ${sectorIdx * 60}ms` }}
                  />
                )}

                {/* Main bubble */}
                <circle
                  cx={node.x + 5}
                  cy={node.y + 5}
                  r={mounted ? (isHovered ? r * 1.12 : r) : 0}
                  fill={color}
                  fillOpacity={isHovered ? 0.35 : 0.2}
                  stroke={color}
                  strokeWidth={isHovered ? 2 : 1}
                  strokeOpacity={isHovered ? 0.8 : 0.4}
                  style={{
                    transition: `r 0.6s ease-out ${sectorIdx * 60}ms, fill-opacity 0.2s ease, stroke-width 0.2s ease`,
                  }}
                />

                {/* Glass highlight */}
                <circle
                  cx={node.x + 5}
                  cy={node.y + 5}
                  r={mounted ? (isHovered ? r * 1.12 : r) : 0}
                  fill="url(#bubble-gradient)"
                  style={{ transition: `r 0.6s ease-out ${sectorIdx * 60}ms` }}
                />

                {/* Ticker label */}
                {r > 12 && (
                  <text
                    x={node.x + 5}
                    y={node.y + 5 - (r > 16 ? 2 : 0)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fillOpacity={mounted ? 1 : 0}
                    fontSize={Math.min(r * 0.55, 11)}
                    fontWeight="700"
                    style={{
                      pointerEvents: 'none',
                      userSelect: 'none',
                      transition: `fill-opacity 0.4s ease ${sectorIdx * 60 + 200}ms`,
                    }}
                  >
                    {ticker.length > 8 ? ticker.slice(0, 7) : ticker}
                  </text>
                )}

                {/* Change percent label */}
                {r > 16 && stock.changePercent != null && (
                  <text
                    x={node.x + 5}
                    y={node.y + 5 + Math.min(r * 0.4, 10)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isPositive ? '#6EE7B7' : '#FCA5A5'}
                    fillOpacity={mounted ? 1 : 0}
                    fontSize={Math.min(r * 0.38, 9)}
                    fontWeight="600"
                    style={{
                      pointerEvents: 'none',
                      userSelect: 'none',
                      transition: `fill-opacity 0.4s ease ${sectorIdx * 60 + 250}ms`,
                    }}
                  >
                    {stock.changePercent >= 0 ? '+' : ''}
                    {stock.changePercent.toFixed(1)}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip overlay */}
        <BubbleTooltip
          ticker={tooltip.ticker}
          name={tooltip.name}
          sector={tooltip.sector}
          lastPrice={tooltip.lastPrice}
          changePercent={tooltip.changePercent}
          x={tooltip.x}
          y={tooltip.y}
          visible={tooltip.visible}
        />
      </div>
    </div>
  );
}
