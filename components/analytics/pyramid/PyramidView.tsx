'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  IPyramidSector,
  IPyramidStock,
  PyramidColorMode,
  PyramidTimeframe,
} from './constants';
import { PYRAMID, SECTOR_COLORS, perfColor, momentumColor } from './constants';

interface PyramidViewProps {
  sectors: IPyramidSector[];
  timeframe: PyramidTimeframe;
  colorMode: PyramidColorMode;
  selectedSector: string | null;
  selectedStock: string | null;
  onSectorClick: (sector: string) => void;
  onStockClick: (ticker: string, sector: string) => void;
}

interface TooltipState {
  x: number;
  y: number;
  ticker: string;
  name: string;
  sector: string;
  change_pct: number;
  last_price: number;
  weight: number;
}

export function PyramidView({
  sectors,
  timeframe,
  colorMode,
  selectedSector,
  selectedStock,
  onSectorClick,
  onStockClick,
}: PyramidViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width } = entry.contentRect;
        // Height proportional to width, capped
        const height = Math.min(Math.max(width * 0.7, 400), 700);
        setDimensions({ width, height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { width, height } = dimensions;

  // Sorted sectors: largest at bottom (reversed for rendering top→bottom)
  const sortedSectors = useMemo(
    () => [...sectors].sort((a, b) => a.total_market_cap - b.total_market_cap),
    [sectors],
  );

  // Compute layer layout
  const layers = useMemo(() => {
    const N = sortedSectors.length;
    if (N === 0) return [];

    const totalMcap = sortedSectors.reduce((s, sec) => s + sec.total_market_cap, 0);
    const availableHeight = height - 20; // padding

    // Min height per layer
    const minH = PYRAMID.MIN_LAYER_HEIGHT;
    const totalMinH = N * minH;

    // Distribute remaining height proportionally
    const extraHeight = Math.max(availableHeight - totalMinH, 0);

    let yOffset = 10; // top padding
    return sortedSectors.map((sector, i) => {
      const progress = N > 1 ? i / (N - 1) : 0.5;
      const layerWidth =
        (PYRAMID.MIN_WIDTH_PCT + (PYRAMID.MAX_WIDTH_PCT - PYRAMID.MIN_WIDTH_PCT) * progress) /
        100 *
        width;
      const layerX = (width - layerWidth) / 2;

      // Height proportional to market cap weight
      const weight = totalMcap > 0 ? sector.total_market_cap / totalMcap : 1 / N;
      const layerHeight = minH + extraHeight * weight;

      // Trapezoid: top edge is narrower than bottom edge
      const nextProgress = N > 1 ? (i + 1) / (N - 1) : 0.5;
      const nextWidth =
        i < N - 1
          ? ((PYRAMID.MIN_WIDTH_PCT +
              (PYRAMID.MAX_WIDTH_PCT - PYRAMID.MIN_WIDTH_PCT) * nextProgress) /
              100) *
            width
          : layerWidth;

      const topLeft = layerX;
      const topRight = layerX + layerWidth;
      const bottomLeft = (width - nextWidth) / 2;
      const bottomRight = (width + nextWidth) / 2;

      const y = yOffset;
      yOffset += layerHeight + PYRAMID.PADDING;

      // Compute stock segments within the layer (rounded to prevent sub-pixel gaps)
      const sectorMcap = sector.total_market_cap || 1;
      let segX = 0;
      const segments = sector.stocks.map((stock) => {
        const stockWeight = stock.market_cap / sectorMcap;
        const startX = Math.round(segX);
        segX += layerWidth * stockWeight;
        const endX = Math.round(segX);
        return { stock, x: startX, width: endX - startX, weight: stockWeight };
      });

      return {
        sector,
        y,
        height: layerHeight,
        topLeft,
        topRight,
        bottomLeft,
        bottomRight,
        layerWidth,
        layerX,
        segments,
      };
    });
  }, [sortedSectors, width, height]);

  const getSegmentFill = useCallback(
    (stock: IPyramidStock, sector: IPyramidSector): string => {
      switch (colorMode) {
        case 'performance': {
          // Use timeframe-aware performance when available, fall back to 1d change
          const perfVal = timeframe !== '1d' && sector.performance?.[timeframe] != null
            ? sector.performance[timeframe]
            : stock.change_pct;
          return perfColor(perfVal, 0.85);
        }
        case 'sector':
          return SECTOR_COLORS[sector.sector] || '#94A3B8';
        case 'momentum':
          return momentumColor(sector.momentum_score);
        default:
          return perfColor(stock.change_pct, 0.85);
      }
    },
    [colorMode, timeframe],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, stock: IPyramidStock, weight: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        ticker: stock.ticker,
        name: stock.name,
        sector: stock.sector,
        change_pct: stock.change_pct,
        last_price: stock.last_price,
        weight: weight * 100,
      });
    },
    [],
  );

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        ref={svgRef}
        width={width}
        height={Math.min(dimensions.height, layers.length > 0 ? layers[layers.length - 1].y + layers[layers.length - 1].height + 10 : 600)}
        className="select-none"
      >
        <defs>
          {/* Gradient overlay for depth */}
          <linearGradient id="pyramidDepth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
          </linearGradient>
          {/* Clip paths for each layer */}
          {layers.map((layer, i) => (
            <clipPath key={`clip-${i}`} id={`clip-layer-${i}`}>
              <path
                d={`M${layer.topLeft},${layer.y} L${layer.topRight},${layer.y} L${layer.bottomRight},${layer.y + layer.height} L${layer.bottomLeft},${layer.y + layer.height} Z`}
              />
            </clipPath>
          ))}
        </defs>

        {layers.map((layer, layerIdx) => {
          const isSelectedSector = selectedSector === layer.sector.sector;

          return (
            <g key={layer.sector.sector}>
              {/* Layer background (trapezoid) */}
              <path
                d={`M${layer.topLeft},${layer.y} L${layer.topRight},${layer.y} L${layer.bottomRight},${layer.y + layer.height} L${layer.bottomLeft},${layer.y + layer.height} Z`}
                fill="rgba(255,255,255,0.02)"
                stroke={isSelectedSector ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.06)'}
                strokeWidth={isSelectedSector ? 1.5 : 0.5}
                className="cursor-pointer"
                onClick={() => onSectorClick(layer.sector.sector)}
              />

              {/* Stock segments clipped to trapezoid */}
              <g clipPath={`url(#clip-layer-${layerIdx})`}>
                {layer.segments.map((seg) => {
                  const isSelectedStock = selectedStock === seg.stock.ticker;
                  const fill = getSegmentFill(seg.stock, layer.sector);

                  return (
                    <g key={seg.stock.ticker}>
                      <rect
                        x={layer.layerX + seg.x}
                        y={layer.y}
                        width={Math.max(seg.width - 1, 0)}
                        height={layer.height}
                        fill={fill}
                        opacity={colorMode === 'sector' ? 0.6 : 0.75}
                        stroke={
                          isSelectedStock
                            ? '#3B82F6'
                            : 'rgba(255,255,255,0.08)'
                        }
                        strokeWidth={isSelectedStock ? 2 : 0.5}
                        className="cursor-pointer transition-opacity duration-200 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStockClick(seg.stock.ticker, layer.sector.sector);
                        }}
                        onMouseMove={(e) => handleMouseMove(e, seg.stock, seg.weight)}
                        onMouseLeave={handleMouseLeave}
                      />
                      {/* Depth gradient overlay */}
                      <rect
                        x={layer.layerX + seg.x}
                        y={layer.y}
                        width={Math.max(seg.width - 1, 0)}
                        height={layer.height}
                        fill="url(#pyramidDepth)"
                        pointerEvents="none"
                      />
                      {/* Ticker label */}
                      {seg.width > PYRAMID.LABEL_MIN_WIDTH && layer.height > 18 && (
                        <text
                          x={layer.layerX + seg.x + seg.width / 2}
                          y={layer.y + layer.height / 2}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="pointer-events-none select-none"
                          fill="rgba(255,255,255,0.9)"
                          fontSize={seg.width > 80 ? 10 : 8}
                          fontWeight={500}
                        >
                          {seg.stock.ticker}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* Sector label (left side) */}
              <text
                x={Math.max(layer.topLeft - 8, 4)}
                y={layer.y + layer.height / 2}
                textAnchor="end"
                dominantBaseline="central"
                fill="rgba(255,255,255,0.5)"
                fontSize={9}
                className="pointer-events-none select-none"
              >
                {layer.sector.sector.length > 12
                  ? layer.sector.sector.slice(0, 10) + '…'
                  : layer.sector.sector}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none rounded-lg border border-white/10 bg-[#0B1A12]/95 px-3 py-2 shadow-xl backdrop-blur-sm"
          style={{
            left: Math.min(tooltip.x + 12, width - 180),
            top: tooltip.y - 60,
          }}
        >
          <p className="text-xs font-semibold text-foreground">{tooltip.ticker}</p>
          <p className="text-[10px] text-muted-foreground">{tooltip.name}</p>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-xs tabular-nums text-foreground">
              ₹{tooltip.last_price.toLocaleString()}
            </span>
            <span
              className={`text-xs font-medium tabular-nums ${
                tooltip.change_pct >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {tooltip.change_pct >= 0 ? '+' : ''}
              {tooltip.change_pct.toFixed(2)}%
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {tooltip.sector} · {tooltip.weight.toFixed(1)}% weight
          </p>
        </div>
      )}
    </div>
  );
}
