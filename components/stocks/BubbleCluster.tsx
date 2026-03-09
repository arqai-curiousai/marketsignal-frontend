'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

interface BubbleNode {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  lastPrice: number | null;
  change: number | null;
  changePercent: number | null;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  color: string;
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
  const animationRef = useRef<number>(0);
  const [stocks, setStocks] = useState<IStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, ticker: '', name: '', sector: '',
    lastPrice: null, changePercent: null, x: 0, y: 0,
  });
  const [nodes, setNodes] = useState<BubbleNode[]>([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

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

  // Unique sectors
  const sectors = useMemo(() => {
    const s = new Set(stocks.map((st) => st.sector).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [stocks]);

  // Compute sector centroids (radial layout)
  const sectorCentroids = useMemo(() => {
    const { width, height } = dimensions;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.28;
    const centroids: Record<string, { x: number; y: number }> = {};

    sectors.forEach((sector, i) => {
      const angle = (i / sectors.length) * Math.PI * 2 - Math.PI / 2;
      centroids[sector] = {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      };
    });

    return centroids;
  }, [sectors, dimensions]);

  // Initialize nodes from stocks
  useEffect(() => {
    if (stocks.length === 0) return;
    const { width, height } = dimensions;

    const newNodes: BubbleNode[] = stocks.map((stock) => {
      const weight = MARKET_CAP_WEIGHTS[stock.ticker] ?? 1;
      const baseRadius = Math.sqrt(weight) * (Math.min(width, height) < 500 ? 8 : 12);
      const radius = Math.max(baseRadius, 10);
      const sector = stock.sector || 'Other';
      const centroid = sectorCentroids[sector] || { x: width / 2, y: height / 2 };
      const color = SECTOR_COLORS[sector] || '#64748B';

      return {
        id: stock.ticker,
        ticker: stock.ticker,
        name: stock.name,
        sector,
        lastPrice: stock.lastPrice ?? null,
        change: stock.change ?? null,
        changePercent: stock.changePercent ?? null,
        radius,
        x: centroid.x + (Math.random() - 0.5) * 60,
        y: centroid.y + (Math.random() - 0.5) * 60,
        vx: 0,
        vy: 0,
        targetX: centroid.x,
        targetY: centroid.y,
        color,
      };
    });

    setNodes(newNodes);
  }, [stocks, dimensions, sectorCentroids]);

  // Physics simulation (simple force-directed)
  useEffect(() => {
    if (nodes.length === 0) return;

    const localNodes = nodes.map((n) => ({ ...n }));
    let running = true;
    let frameCount = 0;

    const tick = () => {
      if (!running) return;
      frameCount++;

      const alpha = Math.max(0.01, 0.3 * Math.pow(0.995, frameCount));

      for (const node of localNodes) {
        // Attraction to sector centroid
        const dx = node.targetX - node.x;
        const dy = node.targetY - node.y;
        node.vx += dx * 0.008 * alpha;
        node.vy += dy * 0.008 * alpha;
      }

      // Collision avoidance
      for (let i = 0; i < localNodes.length; i++) {
        for (let j = i + 1; j < localNodes.length; j++) {
          const a = localNodes[i];
          const b = localNodes[j];
          const ddx = b.x - a.x;
          const ddy = b.y - a.y;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
          const minDist = a.radius + b.radius + 3;

          if (dist < minDist) {
            const force = (minDist - dist) / dist * 0.3;
            const fx = ddx * force;
            const fy = ddy * force;
            a.vx -= fx;
            a.vy -= fy;
            b.vx += fx;
            b.vy += fy;
          }
        }
      }

      // Update positions with damping
      const { width, height } = dimensions;
      for (const node of localNodes) {
        node.vx *= 0.85;
        node.vy *= 0.85;
        node.x += node.vx;
        node.y += node.vy;

        // Boundary containment
        node.x = Math.max(node.radius, Math.min(width - node.radius, node.x));
        node.y = Math.max(node.radius, Math.min(height - node.radius, node.y));
      }

      // Update state every 2 frames for performance
      if (frameCount % 2 === 0) {
        setNodes([...localNodes]);
      }

      // Slow down after settling (stop after ~300 frames)
      if (frameCount < 300) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        setNodes([...localNodes]);
      }
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(animationRef.current);
    };
    // Only run on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length > 0 ? 'initialized' : 'waiting', dimensions.width, dimensions.height]);

  // Filter logic
  const filteredIds = useMemo(() => {
    const searchLower = search.toLowerCase();
    return new Set(
      nodes
        .filter((n) => {
          const matchSector = activeSector === null || n.sector === activeSector;
          const matchSearch = !search || n.ticker.toLowerCase().includes(searchLower) || n.name.toLowerCase().includes(searchLower);
          return matchSector && matchSearch;
        })
        .map((n) => n.id),
    );
  }, [nodes, search, activeSector]);

  const handleBubbleHover = useCallback(
    (node: BubbleNode, event: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setHoveredId(node.id);
      setTooltip({
        visible: true,
        ticker: node.ticker,
        name: node.name,
        sector: node.sector,
        lastPrice: node.lastPrice,
        changePercent: node.changePercent,
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
        {/* SVG glow filter definition */}
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

          {nodes.map((node) => {
            const isFiltered = filteredIds.has(node.id);
            const isHovered = hoveredId === node.id;
            const changeMag = Math.min(Math.abs(node.changePercent ?? 0) / 3, 1);
            const isPositive = (node.changePercent ?? 0) >= 0;
            const glowColor = isPositive
              ? `rgba(110,231,183,${changeMag * 0.6})`
              : `rgba(252,165,165,${changeMag * 0.6})`;

            return (
              <g
                key={node.id}
                style={{
                  cursor: 'pointer',
                  opacity: isFiltered ? 1 : 0.12,
                  transition: 'opacity 0.3s ease',
                }}
                onMouseEnter={(e) => handleBubbleHover(node, e)}
                onMouseLeave={handleBubbleLeave}
                onClick={() => handleBubbleClick(node.ticker)}
              >
                {/* Glow circle (behind) */}
                {changeMag > 0.1 && isFiltered && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.radius + 4 + changeMag * 6}
                    fill="none"
                    stroke={glowColor}
                    strokeWidth={1 + changeMag * 2}
                    filter="url(#bubble-glow)"
                  />
                )}

                {/* Main bubble */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? node.radius * 1.15 : node.radius}
                  fill={node.color}
                  fillOpacity={isHovered ? 0.35 : 0.2}
                  stroke={node.color}
                  strokeWidth={isHovered ? 2 : 1}
                  strokeOpacity={isHovered ? 0.8 : 0.4}
                  style={{ transition: 'r 0.2s ease, fill-opacity 0.2s ease, stroke-width 0.2s ease' }}
                />

                {/* Glass highlight */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? node.radius * 1.15 : node.radius}
                  fill="url(#bubble-gradient)"
                  style={{ transition: 'r 0.2s ease' }}
                />

                {/* Ticker label */}
                {node.radius > 14 && (
                  <text
                    x={node.x}
                    y={node.y - 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={Math.min(node.radius * 0.5, 11)}
                    fontWeight="700"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.ticker.length > 8 ? node.ticker.slice(0, 7) : node.ticker}
                  </text>
                )}

                {/* Change percent label */}
                {node.radius > 18 && node.changePercent != null && (
                  <text
                    x={node.x}
                    y={node.y + 10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isPositive ? '#6EE7B7' : '#FCA5A5'}
                    fontSize={Math.min(node.radius * 0.35, 9)}
                    fontWeight="600"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.changePercent >= 0 ? '+' : ''}
                    {node.changePercent.toFixed(1)}%
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
