'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
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

  const cellSize = tickers.length > 15 ? 28 : 36;
  const headerSize = 60;
  const isHighlightedRow = hoveredCell?.row;
  const isHighlightedCol = hoveredCell?.col;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden" style={{ minHeight: 400 }}>
      {/* Sort controls */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <span className="text-[10px] text-muted-foreground">Sort:</span>
        {(['sector', 'alpha', 'correlation'] as SortMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => {
              setSortMode(mode);
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
            style={{
              gridTemplateColumns: `${headerSize}px repeat(${tickers.length}, ${cellSize}px)`,
              gridTemplateRows: `${headerSize / 2}px repeat(${tickers.length}, ${cellSize}px)`,
            }}
          >
            {/* Corner cell */}
            <div />

            {/* Column headers */}
            {tickers.map((col) => (
              <div
                key={`col-${col}`}
                className={cn(
                  'flex items-end justify-center pb-1 cursor-pointer transition-opacity',
                  isHighlightedCol === col ? 'opacity-100' : isHighlightedCol ? 'opacity-40' : 'opacity-100',
                )}
                onClick={() => {
                  setSortMode('correlation');
                  setSortTarget(col);
                }}
                title={ASSET_MAP.get(col)?.name || col}
              >
                <span
                  className="text-[8px] font-medium text-muted-foreground whitespace-nowrap origin-bottom-left"
                  style={{
                    transform: 'rotate(-45deg)',
                    display: 'inline-block',
                    width: cellSize,
                  }}
                >
                  {col.length > 6 ? col.slice(0, 5) + '..' : col}
                </span>
              </div>
            ))}

            {/* Rows */}
            {tickers.map((row) => (
              <React.Fragment key={`row-${row}`}>
                {/* Row header */}
                <div
                  className={cn(
                    'flex items-center pr-2 transition-opacity',
                    isHighlightedRow === row ? 'opacity-100' : isHighlightedRow ? 'opacity-40' : 'opacity-100',
                  )}
                >
                  <span className="text-[9px] font-medium text-muted-foreground truncate" title={ASSET_MAP.get(row)?.name || row}>
                    {row.length > 8 ? row.slice(0, 7) + '..' : row}
                  </span>
                </div>

                {/* Data cells */}
                {tickers.map((col) => {
                  const corr = getCorr(row, col);
                  const pVal = getPValue(row, col);
                  const isDiagonal = row === col;
                  const isHovered = hoveredCell?.row === row && hoveredCell?.col === col;
                  const isSelected =
                    selectedPair &&
                    ((selectedPair[0] === row && selectedPair[1] === col) ||
                      (selectedPair[0] === col && selectedPair[1] === row));
                  const isRowOrColHighlight = isHighlightedRow === row || isHighlightedCol === col;
                  const isInsignificant = pVal !== null && pVal > 0.05 && !isDiagonal;

                  return (
                    <div
                      key={`${row}-${col}`}
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
                        opacity: isDiagonal ? 1 : corr !== null ? 0.15 + Math.abs(corr) * 0.85 : 0.3,
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

                      {/* Show value on hover */}
                      {isHovered && corr !== null && !isDiagonal && (
                        <span className="absolute z-10 text-[9px] font-mono font-bold text-white" style={{ textShadow: '0 0 4px rgba(0,0,0,0.9)' }}>
                          {corr >= 0 ? '+' : ''}{corr.toFixed(2)}
                        </span>
                      )}

                      {isDiagonal && (
                        <span className="text-[8px] text-muted-foreground font-mono">1.0</span>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Tooltip area */}
      {hoveredCell && hoveredCell.row !== hoveredCell.col && (
        <div className="px-3 py-2 border-t border-white/5">
          <CellTooltip row={hoveredCell.row} col={hoveredCell.col} getCorr={getCorr} getPValue={getPValue} />
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-red-400">-1</span>
          <div className="w-24 h-2 rounded-full" style={{ background: 'linear-gradient(to right, #EF4444, #F87171, #475569, #6EE7B7, #10B981)' }} />
          <span className="text-[9px] text-emerald-400">+1</span>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 border border-white/10" style={{ background: 'linear-gradient(135deg, transparent 45%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.15) 55%, transparent 55%)' }} />
            Not significant
          </span>
          <span>Method: {matrix.method}</span>
        </div>
      </div>
    </div>
  );
}

function CellTooltip({
  row,
  col,
  getCorr,
  getPValue,
}: {
  row: string;
  col: string;
  getCorr: (a: string, b: string) => number | null;
  getPValue: (a: string, b: string) => number | null;
}) {
  if (row === col) return null;
  const corr = getCorr(row, col);
  if (corr === null) return null;
  const pVal = getPValue(row, col);

  return (
    <div className="flex items-center gap-4">
      <span className="text-xs text-white font-medium">
        {row} ↔ {col}
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
  );
}
