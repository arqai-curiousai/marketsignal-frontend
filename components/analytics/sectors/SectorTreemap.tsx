'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { hierarchy, treemap, treemapSquarify, HierarchyRectangularNode } from 'd3-hierarchy';
import { cn } from '@/lib/utils';
import { SECTOR_COLORS, perfColor, formatMarketCap } from './constants';
import type { ISectorAnalytics, SectorTimeframe } from '@/types/analytics';

interface SectorTreemapProps {
  sectors: ISectorAnalytics[];
  timeframe: SectorTimeframe;
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

export function SectorTreemap({ sectors, timeframe, onSectorClick }: SectorTreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 500 });
  const [drilledSector, setDrilledSector] = useState<ISectorAnalytics | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

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

  const handleNodeClick = useCallback(
    (node: HierarchyRectangularNode<TreemapNode>) => {
      if (drilledSector) {
        onSectorClick(drilledSector);
      } else {
        const sd = node.data.sectorData;
        if (sd) setDrilledSector(sd);
      }
    },
    [drilledSector, onSectorClick],
  );

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

      <svg width={dims.width} height={dims.height} className="rounded-xl overflow-hidden">
        <rect width={dims.width} height={dims.height} fill="transparent" rx={12} />

        {nodes.map((node, idx) => {
          const x = node.x0;
          const y = node.y0;
          const w = node.x1 - x;
          const h = node.y1 - y;
          if (w < 2 || h < 2) return null;

          const d = node.data;
          const isHovered = hoveredNode === d.name;
          const bgColor = perfColor(d.pct);
          const sectorColor = SECTOR_COLORS[d.sector ?? ''] ?? '#64748B';
          const showLabel = w > 50 && h > 30;
          const showPct = w > 40 && h > 20;

          return (
            <g
              key={d.name}
              onMouseEnter={() => setHoveredNode(d.name)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => handleNodeClick(node)}
              className="cursor-pointer"
            >
              <motion.rect
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, x, y, width: w, height: h }}
                transition={{ duration: 0.4, delay: idx * 0.02 }}
                rx={4}
                fill={bgColor}
                stroke={isHovered ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}
                strokeWidth={isHovered ? 1.5 : 0.5}
              />

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

              {/* Hover tooltip overlay */}
              {isHovered && (
                <foreignObject x={x} y={y} width={w} height={h} className="pointer-events-none">
                  <div className="flex h-full w-full items-end p-1.5">
                    <div className="rounded bg-brand-slate/95 px-2 py-1 text-[10px] text-white shadow-lg border border-white/10">
                      {drilledSector ? (
                        <>
                          <div className="font-semibold">{d.name}</div>
                          <div className="text-muted-foreground">
                            {formatMarketCap(node.value ?? null)}
                          </div>
                        </>
                      ) : d.sectorData ? (
                        <>
                          <div className="font-semibold">{d.sectorData.sector}</div>
                          <div className="text-muted-foreground">
                            {formatMarketCap(d.sectorData.total_market_cap)} | {d.sectorData.stock_count} stocks
                          </div>
                          <div className="text-muted-foreground">
                            Breadth: {d.sectorData.breadth.above_50dma_pct.toFixed(0)}% &gt; 50 DMA
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
