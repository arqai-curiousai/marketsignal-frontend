'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Flame } from 'lucide-react';
import { getCorrelations } from '@/src/lib/api/analyticsApi';
import type { ICorrelationMatrix } from '@/types/analytics';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const WINDOWS = ['30d', '90d', '180d', '365d'];
const ASSET_TYPES = ['equity', 'cross_asset'];

function corrColor(value: number): string {
  if (value >= 0.7) return 'rgba(16, 185, 129, 0.8)';
  if (value >= 0.4) return 'rgba(16, 185, 129, 0.4)';
  if (value >= 0.1) return 'rgba(16, 185, 129, 0.15)';
  if (value >= -0.1) return 'rgba(100, 116, 139, 0.1)';
  if (value >= -0.4) return 'rgba(239, 68, 68, 0.15)';
  if (value >= -0.7) return 'rgba(239, 68, 68, 0.4)';
  return 'rgba(239, 68, 68, 0.8)';
}

export function CorrelationHeatmap() {
  const [data, setData] = useState<ICorrelationMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [window, setWindow] = useState('90d');
  const [assetType, setAssetType] = useState('equity');
  const [hoveredCell, setHoveredCell] = useState<{ row: string; col: string; value: number } | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const result = await getCorrelations(window, assetType);
      if (result.success && result.data?.tickers) {
        setData(result.data);
      } else {
        setData(null);
      }
      setLoading(false);
    }
    fetchData();
  }, [window, assetType]);

  const tickers = data?.tickers ?? [];
  const matrix = data?.matrix_data ?? {};

  const getCorr = (t1: string, t2: string) => {
    if (t1 === t2) return 1;
    const key1 = `${t1}:${t2}`;
    const key2 = `${t2}:${t1}`;
    return matrix[key1] ?? matrix[key2] ?? 0;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                w === window ? 'bg-brand-blue/30 text-white' : 'text-muted-foreground hover:text-white',
              )}
            >
              {w.replace('d', 'D')}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
          {ASSET_TYPES.map((at) => (
            <button
              key={at}
              onClick={() => setAssetType(at)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize',
                at === assetType ? 'bg-brand-blue/30 text-white' : 'text-muted-foreground hover:text-white',
              )}
            >
              {at.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      ) : !data || tickers.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>Correlation matrix not yet computed. Data refreshes daily at 16:00 IST.</p>
        </div>
      ) : (
        <>
          {/* Heatmap Grid */}
          <ScrollArea className="w-full">
            <div className="min-w-[600px]">
              {/* Header row */}
              <div className="flex">
                <div className="w-20 shrink-0" />
                {tickers.map((t) => (
                  <div key={t} className="w-10 shrink-0 text-center">
                    <span className="text-[8px] text-muted-foreground font-mono -rotate-45 inline-block origin-bottom-left whitespace-nowrap">
                      {t}
                    </span>
                  </div>
                ))}
              </div>

              {/* Matrix rows */}
              {tickers.map((row) => (
                <div key={row} className="flex items-center">
                  <div className="w-20 shrink-0 text-right pr-2">
                    <span className="text-[9px] text-muted-foreground font-mono">{row}</span>
                  </div>
                  {tickers.map((col) => {
                    const value = getCorr(row, col);
                    const isDiagonal = row === col;
                    return (
                      <div
                        key={col}
                        className="w-10 h-8 shrink-0 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 hover:z-10"
                        style={{ backgroundColor: isDiagonal ? 'rgba(100, 116, 139, 0.3)' : corrColor(value) }}
                        onMouseEnter={() => !isDiagonal && setHoveredCell({ row, col, value })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {hoveredCell?.row === row && hoveredCell?.col === col && (
                          <span className="text-[8px] font-bold text-white">{value.toFixed(2)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Legend */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-[10px] text-red-400">-1.0</span>
            <div className="flex h-3 w-48 rounded-full overflow-hidden">
              <div className="flex-1 bg-red-500/60" />
              <div className="flex-1 bg-red-500/20" />
              <div className="flex-1 bg-slate-500/10" />
              <div className="flex-1 bg-emerald-500/20" />
              <div className="flex-1 bg-emerald-500/60" />
            </div>
            <span className="text-[10px] text-emerald-400">+1.0</span>
          </div>

          {/* Top Insights */}
          {(data.top_positive_pairs.length > 0 || data.top_negative_pairs.length > 0) && (
            <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-4 w-4 text-orange-400" />
                <span className="text-sm font-semibold text-white">Top Insights</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.top_positive_pairs.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-white font-medium">{p.pair[0]} & {p.pair[1]}</span>
                    <span>r = {p.correlation.toFixed(2)}</span>
                    <span className="text-emerald-400">
                      {p.correlation >= 0.8 ? 'Very Strong' : p.correlation >= 0.6 ? 'Strong' : 'Moderate'}
                    </span>
                  </div>
                ))}
                {data.top_negative_pairs.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-red-400" />
                    <span className="text-white font-medium">{p.pair[0]} & {p.pair[1]}</span>
                    <span>r = {p.correlation.toFixed(2)}</span>
                    <span className="text-red-400">Inverse</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
