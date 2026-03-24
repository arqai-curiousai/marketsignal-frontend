'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ASSET_MAP, corrColor, corrStrength } from './constants';
import type { IEnhancedMatrix } from '@/types/analytics';

interface HeatmapMatrixProps {
  matrix: IEnhancedMatrix | null;
  selectedAssets: string[];
  selectedPair: [string, string] | null;
  onPairSelect: (pair: [string, string] | null) => void;
}

type SortMode = 'alpha' | 'sector' | 'correlation';

export function HeatmapMatrix({
  matrix,
  selectedAssets,
  selectedPair,
  onPairSelect,
}: HeatmapMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: string; col: string } | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('sector');
  const [sortTarget, setSortTarget] = useState<string | null>(null);
  const [halfMatrix, setHalfMatrix] = useState(false);
  const [showSectors, setShowSectors] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const prevMatrixRef = useRef(matrix);

  // SSR-safe responsive check
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Reset sort target when matrix changes (prevents stale sort on missing ticker)
  useEffect(() => {
    if (matrix !== prevMatrixRef.current) {
      prevMatrixRef.current = matrix;
      if (sortTarget && matrix && !matrix.tickers.includes(sortTarget)) {
        setSortTarget(null);
        setSortMode('sector');
      }
    }
  }, [matrix, sortTarget]);

  // Track mouse position via ref (zero re-renders for tooltip positioning)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (tooltipRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      tooltipRef.current.style.left = `${Math.min(x + 12, rect.width - 220)}px`;
      tooltipRef.current.style.top = `${Math.max(8, y - 48)}px`;
    }
  }, []);

  const getCorr = useCallback((a: string, b: string): number | null => {
    if (a === b) return 1;
    if (!matrix) return null;
    const key1 = `${a}:${b}`;
    const key2 = `${b}:${a}`;
    if (key1 in matrix.matrix_data) return matrix.matrix_data[key1];
    if (key2 in matrix.matrix_data) return matrix.matrix_data[key2];
    return null;
  }, [matrix]);

  // Determine which tickers to show (intersection of selectedAssets and matrix tickers)
  const tickers = useMemo(() => {
    if (!matrix) return [];
    const matrixSet = new Set(matrix.tickers);
    const available = selectedAssets.filter((t) => matrixSet.has(t));
    if (available.length === 0) return matrix.tickers.slice(0, 20);

    // Sort
    if (sortMode === 'alpha') {
      return [...available].sort();
    }
    if (sortMode === 'sector') {
      return [...available].sort((a, b) => {
        const sa = ASSET_MAP.get(a)?.sector || '';
        const sb = ASSET_MAP.get(b)?.sector || '';
        return sa.localeCompare(sb) || a.localeCompare(b);
      });
    }
    if (sortMode === 'correlation' && sortTarget) {
      return [...available].sort((a, b) => {
        const ca = getCorr(sortTarget, a) ?? 0;
        const cb = getCorr(sortTarget, b) ?? 0;
        return Math.abs(cb) - Math.abs(ca);
      });
    }
    return available;
  }, [selectedAssets, matrix, sortMode, sortTarget, getCorr]);

  function getPValue(a: string, b: string): number | null {
    if (a === b) return 0;
    if (!matrix?.p_values) return null;
    const key1 = `${a}:${b}`;
    const key2 = `${b}:${a}`;
    if (key1 in matrix.p_values) return matrix.p_values[key1];
    if (key2 in matrix.p_values) return matrix.p_values[key2];
    return null;
  }

  if (!matrix || tickers.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-8 flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
        <Search className="h-12 w-12 text-brand-blue/30 mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Add Assets to View Matrix</h3>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          Search for assets or use Quick Add to populate the heatmap.
        </p>
      </div>
    );
  }

  // Mobile: minimum 44px cells (WCAG touch targets), Desktop: compact for larger matrices
  const cellSize = isMobile ? 44 : tickers.length > 15 ? 28 : 36;
  const headerSize = isMobile ? 50 : 60;
  const showValues = tickers.length <= 15 && cellSize >= 36;
  const isHighlightedRow = hoveredCell?.row;
  const isHighlightedCol = hoveredCell?.col;

  return (
    <div ref={containerRef} className="relative rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden" style={{ minHeight: 400 }} onMouseMove={handleMouseMove}>
      {/* Sort controls */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <span className="text-[10px] text-muted-foreground">Sort:</span>
        {(['sector', 'alpha', 'correlation'] as SortMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => {
              setSortMode(mode);
              if (mode === 'sector') setShowSectors(true);
              if (mode === 'correlation' && !sortTarget && tickers.length > 0) {
                setSortTarget(tickers[0]);
              }
            }}
            className={cn(
              'px-2 py-1 text-[10px] rounded transition-colors capitalize',
              sortMode === mode ? 'bg-brand-blue/20 text-white' : 'text-muted-foreground hover:text-white',
            )}
          >
            {mode}
          </button>
        ))}

        {/* Half-matrix toggle */}
        <button
          onClick={() => setHalfMatrix(!halfMatrix)}
          className={cn(
            'px-2 py-1 text-[10px] rounded border transition-colors ml-1',
            halfMatrix
              ? 'bg-brand-blue/20 border-brand-blue/30 text-white'
              : 'border-white/10 text-muted-foreground hover:text-white',
          )}
        >
          Half
        </button>

        {/* Sort target badge */}
        {sortMode === 'correlation' && sortTarget && (
          <span className="px-1.5 py-0.5 text-[10px] rounded bg-brand-blue/10 text-brand-blue border border-brand-blue/20 ml-1">
            Sorted by: {sortTarget}
          </span>
        )}

        {matrix.p_values && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            {matrix.significant_pairs} significant pairs (FDR 5%)
          </span>
        )}
      </div>

      <ScrollArea className="max-h-[550px]">
        <div className="p-3">
          <div
            className="inline-grid gap-px"
            role="grid"
            style={{
              gridTemplateColumns: `${headerSize}px repeat(${tickers.length}, ${cellSize}px)`,
              gridTemplateRows: `${headerSize}px repeat(${tickers.length}, ${cellSize}px)`,
            }}
          >
            {/* Corner cell */}
            <div />

            {/* Column headers */}
            {tickers.map((col) => {
              const isSortTarget = sortMode === 'correlation' && sortTarget === col;
              const isColHovered = isHighlightedCol === col;
              return (
                <div
                  key={`col-${col}`}
                  className={cn(
                    'flex items-end justify-center pb-1 cursor-pointer transition-all',
                    isColHovered ? 'opacity-100 bg-white/[0.06] rounded-t' : isHighlightedCol ? 'opacity-40' : 'opacity-100',
                    isSortTarget && 'border-b-2 border-brand-blue',
                  )}
                  onClick={() => {
                    setSortMode('correlation');
                    setSortTarget(col);
                  }}
                  title={ASSET_MAP.get(col)?.name || col}
                >
                  <span
                    className={cn(
                      'text-[9px] font-medium text-muted-foreground whitespace-nowrap origin-bottom-left',
                      isSortTarget && 'text-brand-blue',
                    )}
                    style={{
                      transform: 'rotate(-45deg)',
                      display: 'inline-block',
                      width: cellSize,
                    }}
                  >
                    {isSortTarget && '↓ '}{col.length > 7 ? col.slice(0, 6) + '..' : col}
                  </span>
                </div>
              );
            })}

            {/* Rows */}
            {tickers.map((row, rowIdx) => (
              <div key={`row-${row}`} role="row" className="contents">
                {/* Row header */}
                <div
                  role="rowheader"
                  className={cn(
                    'flex items-center pr-2 transition-all',
                    isHighlightedRow === row ? 'opacity-100 bg-white/[0.06] rounded-l' : isHighlightedRow ? 'opacity-40' : 'opacity-100',
                  )}
                >
                  <span className="text-[9px] font-medium text-muted-foreground truncate" title={ASSET_MAP.get(row)?.name || row}>
                    {row.length > 8 ? row.slice(0, 7) + '..' : row}
                  </span>
                </div>

                {/* Data cells */}
                {tickers.map((col, colIdx) => {
                  const isDiagonal = row === col;
                  const isLowerTriangle = halfMatrix && rowIdx < colIdx;

                  // In half-matrix mode, hide upper triangle (above diagonal)
                  if (isLowerTriangle) {
                    return (
                      <div
                        key={`${row}-${col}`}
                        role="gridcell"
                        style={{ width: cellSize, height: cellSize }}
                      />
                    );
                  }

                  const corr = getCorr(row, col);
                  const pVal = getPValue(row, col);
                  const isSelected =
                    selectedPair &&
                    ((selectedPair[0] === row && selectedPair[1] === col) ||
                      (selectedPair[0] === col && selectedPair[1] === row));
                  const isRowOrColHighlight = isHighlightedRow === row || isHighlightedCol === col;
                  const isInsignificant = pVal !== null && pVal > 0.05 && !isDiagonal;

                  // Format short correlation value for cell display
                  const cellLabel = isDiagonal
                    ? '1.0'
                    : corr !== null
                      ? (corr >= 0 ? '+' : '') + corr.toFixed(2).replace(/^-?0/, (m) => m.replace('0', ''))
                      : '';

                  return (
                    <div
                      key={`${row}-${col}`}
                      role="gridcell"
                      className={cn(
                        'relative flex items-center justify-center cursor-pointer transition-all duration-100',
                        isSelected && 'ring-2 ring-brand-blue ring-offset-1 ring-offset-[#0d1117]',
                        !isRowOrColHighlight && isHighlightedRow && 'opacity-30',
                      )}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: isDiagonal
                          ? 'rgba(255,255,255,0.03)'
                          : corr !== null
                            ? corrColor(corr)
                            : 'rgba(255,255,255,0.02)',
                        opacity: isDiagonal ? 1 : corr !== null ? 0.3 + Math.abs(corr) * 0.7 : 0.3,
                      }}
                      onMouseEnter={() => setHoveredCell({ row, col })}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => {
                        if (!isDiagonal && corr !== null) {
                          onPairSelect([row, col]);
                        }
                      }}
                    >
                      {/* Insignificant marker — diagonal strikethrough */}
                      {isInsignificant && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: 'linear-gradient(135deg, transparent 45%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.15) 55%, transparent 55%)',
                          }}
                        />
                      )}

                      {showValues && cellLabel && (
                        <span className="text-[8px] font-mono text-white/70 pointer-events-none select-none">
                          {cellLabel}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Floating tooltip near cursor */}
      {hoveredCell && hoveredCell.row !== hoveredCell.col && (() => {
        const corr = getCorr(hoveredCell.row, hoveredCell.col);
        if (corr === null) return null;
        const pVal = getPValue(hoveredCell.row, hoveredCell.col);
        return (
          <div
            ref={tooltipRef}
            className="absolute z-20 pointer-events-none bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs text-white font-medium whitespace-nowrap">
                {hoveredCell.row} ↔ {hoveredCell.col}
              </span>
              <span className="text-sm font-mono font-bold" style={{ color: corrColor(corr) }}>
                {corr >= 0 ? '+' : ''}{corr.toFixed(3)}
              </span>
              <span className="text-[10px] text-muted-foreground">{corrStrength(corr)}</span>
              {pVal !== null && (
                <span className={cn('text-[10px]', pVal < 0.05 ? 'text-emerald-400' : 'text-yellow-400')}>
                  p={pVal < 0.001 ? '<0.001' : pVal.toFixed(3)}
                </span>
              )}
            </div>
          </div>
        );
      })()}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-blue-400">-1</span>
          <div className="w-24 h-2 rounded-full" style={{ background: 'linear-gradient(to right, #2563EB, #60A5FA, #475569, #FB923C, #EA580C)' }} />
          <span className="text-[9px] text-orange-400">+1</span>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 border border-white/10" style={{ background: 'linear-gradient(135deg, transparent 45%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.15) 55%, transparent 55%)' }} />
            Not significant
          </span>
          <span className="hidden sm:inline">Method: {matrix.method}</span>
        </div>
      </div>

      {/* Sector Aggregation */}
      <SectorAggregation tickers={tickers} getCorr={getCorr} show={showSectors} setShow={setShowSectors} />
    </div>
  );
}

// ─── Sector Cross-Correlation Summary ───────────────────────

function SectorAggregation({
  tickers,
  getCorr,
  show,
  setShow,
}: {
  tickers: string[];
  getCorr: (a: string, b: string) => number | null;
  show: boolean;
  setShow: (v: boolean) => void;
}) {
  const sectorData = useMemo(() => {
    // Group tickers by sector
    const sectorTickers = new Map<string, string[]>();
    for (const t of tickers) {
      const sector = ASSET_MAP.get(t)?.sector;
      if (!sector) continue;
      const list = sectorTickers.get(sector) ?? [];
      list.push(t);
      sectorTickers.set(sector, list);
    }

    // Need at least 2 sectors
    const sectors = Array.from(sectorTickers.keys()).sort();
    if (sectors.length < 2) return null;

    // Compute average correlation between each sector pair
    const grid: Record<string, Record<string, number | null>> = {};
    for (const sa of sectors) {
      grid[sa] = {};
      for (const sb of sectors) {
        const tickersA = sectorTickers.get(sa)!;
        const tickersB = sectorTickers.get(sb)!;
        let sum = 0;
        let count = 0;
        for (const a of tickersA) {
          for (const b of tickersB) {
            if (a === b) continue;
            const c = getCorr(a, b);
            if (c !== null) {
              sum += c;
              count++;
            }
          }
        }
        grid[sa][sb] = count > 0 ? sum / count : null;
      }
    }

    return { sectors, grid };
  }, [tickers, getCorr]);

  if (!sectorData) return null;

  const { sectors, grid } = sectorData;

  return (
    <div className="border-t border-white/5">
      <button
        onClick={() => setShow(!show)}
        className="flex items-center gap-1.5 w-full px-3 py-1.5 text-[10px] text-muted-foreground hover:text-white transition-colors"
      >
        <ChevronDown className={cn('h-3 w-3 transition-transform', show && 'rotate-180')} />
        Sector Cross-Correlation
      </button>

      {show && (
        <div className="px-3 pb-3 overflow-x-auto">
          <div
            className="inline-grid gap-px"
            style={{
              gridTemplateColumns: `80px repeat(${sectors.length}, 56px)`,
            }}
          >
            {/* Corner */}
            <div />
            {/* Column headers */}
            {sectors.map((s) => (
              <div key={`sh-${s}`} className="text-[8px] text-muted-foreground text-center truncate px-0.5" title={s}>
                {s.length > 8 ? s.slice(0, 7) + '..' : s}
              </div>
            ))}

            {/* Rows */}
            {sectors.map((rowSector, ri) => (
              <React.Fragment key={`sr-${rowSector}`}>
                <div className="text-[9px] text-muted-foreground truncate pr-1 flex items-center" title={rowSector}>
                  {rowSector.length > 10 ? rowSector.slice(0, 9) + '..' : rowSector}
                </div>
                {sectors.map((colSector, ci) => {
                  const val = grid[rowSector][colSector];
                  const isDiag = ri === ci;
                  return (
                    <div
                      key={`sc-${rowSector}-${colSector}`}
                      className="flex items-center justify-center rounded-sm"
                      style={{
                        height: 24,
                        backgroundColor: isDiag
                          ? 'rgba(255,255,255,0.03)'
                          : val !== null
                            ? corrColor(val)
                            : 'rgba(255,255,255,0.02)',
                        opacity: isDiag ? 1 : val !== null ? 0.25 + Math.abs(val) * 0.75 : 0.3,
                      }}
                    >
                      <span className="text-[8px] font-mono text-white/80">
                        {isDiag ? '—' : val !== null ? (val >= 0 ? '+' : '') + val.toFixed(2) : ''}
                      </span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
