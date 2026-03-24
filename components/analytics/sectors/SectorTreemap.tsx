'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { hierarchy, treemap, treemapSquarify, HierarchyRectangularNode } from 'd3-hierarchy';
import { SECTOR_COLORS, perfColor, formatMarketCap } from './constants';
import type { ISectorAnalytics, SectorTimeframe } from '@/types/analytics';

interface SectorTreemapProps {
  sectors: ISectorAnalytics[];
  timeframe: SectorTimeframe;
  selectedSector?: string | null;
  onSectorClick: (sector: ISectorAnalytics) => void;
}

interface TreemapNode {
  name: string;
  value: number;
  pct: number;
  sector?: string;
  ticker?: string;
  children?: TreemapNode[];
  sectorData?: ISectorAnalytics;
}

export function SectorTreemap({ sectors, timeframe, selectedSector, onSectorClick }: SectorTreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 500 });
  const [drilledSector, setDrilledSector] = useState<ISectorAnalytics | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDims({ width: Math.max(width, 300), height: Math.max(width * 0.55, 350) });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Build hierarchy data
  const treeData = useMemo((): TreemapNode => {
    if (drilledSector) {
      if (!drilledSector.stocks || drilledSector.stocks.length === 0) {
        return { name: 'root', value: 0, pct: 0, children: [] };
      }
      const children: TreemapNode[] = drilledSector.stocks.map((s) => ({
        name: s.ticker,
        value: Math.max(s.market_cap ?? 1, 1),
        pct: s.change_pct ?? 0,
        ticker: s.ticker,
        sector: drilledSector.sector,
      }));
      return { name: 'root', value: 0, pct: 0, children };
    }

    const children: TreemapNode[] = sectors.map((s) => ({
      name: s.sector,
      value: Math.max(s.total_market_cap ?? 1, 1),
      pct: s.performance[timeframe] ?? 0,
      sector: s.sector,
      sectorData: s,
    }));
    return { name: 'root', value: 0, pct: 0, children };
  }, [sectors, timeframe, drilledSector]);

  // Compute treemap layout
  const nodes = useMemo((): HierarchyRectangularNode<TreemapNode>[] => {
    const root = hierarchy<TreemapNode>(treeData)
      .sum((d) => d.children ? 0 : d.value)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const layout = treemap<TreemapNode>()
      .size([dims.width, dims.height])
      .tile(treemapSquarify)
      .padding(3)
      .round(true);

    layout(root);

    return root.leaves() as HierarchyRectangularNode<TreemapNode>[];
  }, [treeData, dims]);

  // Single-click selects sector in detail panel; double-click drills into stocks
  const handleNodeClick = useCallback(
    (node: HierarchyRectangularNode<TreemapNode>) => {
      if (drilledSector) {
        // Already drilled — clicks on stocks just re-select parent sector
        onSectorClick(drilledSector);
      } else {
        const sd = node.data.sectorData;
        if (sd) {
          onSectorClick(sd);
        }
      }
    },
    [drilledSector, onSectorClick],
  );

  const handleDrillIn = useCallback(
    (e: React.MouseEvent, node: HierarchyRectangularNode<TreemapNode>) => {
      e.stopPropagation();
      if (!drilledSector) {
        const sd = node.data.sectorData;
        if (sd) {
          setDrilledSector(sd);
          onSectorClick(sd);
        }
      }
    },
    [drilledSector, onSectorClick],
  );

  // Find hovered node data for portal tooltip
  const hoveredNodeData = useMemo(() => {
    if (!hoveredNode) return null;
    return nodes.find((n) => n.data.name === hoveredNode) ?? null;
  }, [hoveredNode, nodes]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Back button when drilled */}
      <AnimatePresence>
        {drilledSector && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={() => setDrilledSector(null)}
            className="absolute top-2 left-2 z-10 flex items-center gap-1.5 rounded-lg border border-white/10 bg-brand-slate/90 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {drilledSector.sector}
          </motion.button>
        )}
      </AnimatePresence>

      {drilledSector && nodes.length === 0 && (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          No stock data available for {drilledSector.sector}
        </div>
      )}

      <svg width={dims.width} height={dims.height} className="rounded-xl overflow-hidden" role="img" aria-label="Sector treemap sized by market capitalisation and coloured by performance." style={drilledSector && nodes.length === 0 ? { display: 'none' } : undefined}>
        <rect width={dims.width} height={dims.height} fill="transparent" rx={12} />

        {nodes.map((node) => {
          const x = node.x0;
          const y = node.y0;
          const w = node.x1 - x;
          const h = node.y1 - y;
          if (w < 2 || h < 2) return null;

          const d = node.data;
          const isHovered = hoveredNode === d.name;
          const isSelected = !drilledSector && selectedSector === d.sector;
          const bgColor = perfColor(d.pct);
          const sectorColor = SECTOR_COLORS[d.sector ?? ''] ?? '#64748B';
          const showLabel = w > 50 && h > 30;
          const showPct = w > 40 && h > 20;

          return (
            <g
              key={d.name}
              onMouseEnter={(e) => {
                setHoveredNode(d.name);
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseMove={(e) => {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => handleNodeClick(node)}
              className="cursor-pointer"
            >
              <motion.rect
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, x, y, width: w, height: h }}
                transition={{ duration: 0.3 }}
                rx={4}
                fill={bgColor}
                stroke={isSelected ? sectorColor : isHovered ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}
                strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 0.5}
              />
              {/* Selected glow effect */}
              {isSelected && (
                <rect
                  x={x + 1}
                  y={y + 1}
                  width={w - 2}
                  height={h - 2}
                  rx={3}
                  fill="none"
                  stroke={sectorColor}
                  strokeWidth={1}
                  opacity={0.3}
                />
              )}

              {/* Sector color accent bar */}
              {!drilledSector && h > 20 && (
                <rect
                  x={x + 1}
                  y={y + 1}
                  width={3}
                  height={Math.min(h - 2, 24)}
                  rx={1.5}
                  fill={sectorColor}
                  opacity={0.8}
                />
              )}

              {/* Label */}
              {showLabel && (
                <text
                  x={x + (drilledSector ? 6 : 10)}
                  y={y + 16}
                  fill="white"
                  fontSize={w > 100 ? 12 : 10}
                  fontWeight={600}
                  opacity={0.95}
                >
                  {w > 80 ? d.name : d.name.slice(0, 6)}
                </text>
              )}

              {/* Performance % */}
              {showPct && (
                <text
                  x={x + (drilledSector ? 6 : 10)}
                  y={y + (showLabel ? 30 : 16)}
                  fill={d.pct >= 0 ? '#6EE7B7' : '#FCA5A5'}
                  fontSize={10}
                  fontWeight={500}
                >
                  {d.pct >= 0 ? '+' : ''}
                  {d.pct.toFixed(2)}%
                </text>
              )}

              {/* Momentum badge (sector view only) */}
              {!drilledSector && d.sectorData && w > 100 && h > 50 && (
                <text x={x + 10} y={y + 44} fill="rgba(255,255,255,0.5)" fontSize={9}>
                  M: {d.sectorData.momentum_score.toFixed(0)}
                </text>
              )}

              {/* Hover highlight stroke */}
              {isHovered && !isSelected && (
                <rect
                  x={x} y={y} width={w} height={h}
                  rx={4} fill="none"
                  stroke="rgba(255,255,255,0.2)" strokeWidth={1}
                  className="pointer-events-none"
                />
              )}

              {/* Drill-in button — visible on hover for sector tiles */}
              {isHovered && !drilledSector && d.sectorData && w > 60 && h > 30 && (
                <g
                  onClick={(e) => handleDrillIn(e as unknown as React.MouseEvent, node)}
                  className="cursor-pointer"
                >
                  <rect
                    x={x + w - 26}
                    y={y + 4}
                    width={22}
                    height={18}
                    rx={4}
                    fill="rgba(255,255,255,0.15)"
                  />
                  <text
                    x={x + w - 15}
                    y={y + 16}
                    textAnchor="middle"
                    fill="white"
                    fontSize={10}
                    fontWeight={600}
                  >
                    ▸
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Portal-based tooltip — positioned outside SVG to avoid clipping */}
      {hoveredNodeData && (
        <div
          className="absolute z-50 rounded-lg bg-brand-slate/95 backdrop-blur-sm px-3 py-2 text-[10px] text-white shadow-xl border border-white/10 pointer-events-none"
          style={{
            left: tooltipPos.x + 160 > dims.width ? tooltipPos.x - 140 : tooltipPos.x + 12,
            top: tooltipPos.y + 80 > dims.height ? tooltipPos.y - 70 : tooltipPos.y + 12,
          }}
        >
          {drilledSector ? (
            <>
              <div className="font-semibold text-xs">{hoveredNodeData.data.name}</div>
              <div className="text-muted-foreground">
                {formatMarketCap(hoveredNodeData.value ?? null)}
              </div>
            </>
          ) : hoveredNodeData.data.sectorData ? (
            <>
              <div className="font-semibold text-xs">{hoveredNodeData.data.sectorData.sector}</div>
              <div className="text-muted-foreground">
                {formatMarketCap(hoveredNodeData.data.sectorData.total_market_cap)} | {hoveredNodeData.data.sectorData.stock_count} stocks
              </div>
              <div className="text-muted-foreground">
                Breadth: {hoveredNodeData.data.sectorData.breadth.above_50dma_pct.toFixed(0)}% &gt; 50 DMA
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">Click ▸ to drill into stocks</div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
