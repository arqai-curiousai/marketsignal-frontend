'use client';

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  ReferenceDot,
} from 'recharts';
import { cn } from '@/lib/utils';

interface MotifMatch {
  current_start: number;
  current_end: number;
  match_start: number;
  match_end: number;
  match_date: string | null;
  similarity: number;
  outcome: { return_5d: number; return_10d: number; return_20d: number };
}

interface Discord {
  index: number;
  distance: number;
  date: string | null;
}

interface MatrixProfileData {
  values: number[];
  motifs: MotifMatch[];
  discords: Discord[];
}

interface MatrixProfilePanelProps {
  matrixProfile: MatrixProfileData | null;
  chartData: Array<{ date: string; close: number }>;
}

function ReturnBadge({ label, value }: { label: string; value: number }) {
  const pct = (value * 100).toFixed(1);
  const isPositive = value >= 0;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-slate-500 font-medium">{label}</span>
      <span
        className={cn(
          'text-sm font-bold font-mono',
          isPositive ? 'text-emerald-400' : 'text-red-400',
        )}
      >
        {isPositive ? '+' : ''}
        {pct}%
      </span>
    </div>
  );
}

export function MatrixProfilePanel({ matrixProfile, chartData }: MatrixProfilePanelProps) {
  const bestMotif = matrixProfile?.motifs?.[0] ?? null;

  const { currentSlice, matchSlice } = useMemo(() => {
    if (!bestMotif || chartData.length === 0) {
      return { currentSlice: [], matchSlice: [] };
    }
    const cur = chartData.slice(bestMotif.current_start, bestMotif.current_end + 1).map((d, i) => ({
      idx: i,
      close: d.close,
      date: d.date,
    }));
    const mat = chartData.slice(bestMotif.match_start, bestMotif.match_end + 1).map((d, i) => ({
      idx: i,
      close: d.close,
      date: d.date,
    }));
    return { currentSlice: cur, matchSlice: mat };
  }, [bestMotif, chartData]);

  const mpChartData = useMemo(() => {
    if (!matrixProfile?.values) return [];
    return matrixProfile.values.map((v, i) => ({ idx: i, distance: v }));
  }, [matrixProfile]);

  const annotatedDiscords = useMemo(() => {
    if (!matrixProfile?.discords || mpChartData.length === 0) return [];
    return matrixProfile.discords
      .filter((d) => d.index >= 0 && d.index < mpChartData.length)
      .slice(0, 3);
  }, [matrixProfile, mpChartData]);

  const motifLowPoints = useMemo(() => {
    if (!matrixProfile?.motifs || mpChartData.length === 0) return [];
    return matrixProfile.motifs
      .map((m) => {
        const idx = m.current_start;
        if (idx >= 0 && idx < mpChartData.length) {
          return { idx, distance: mpChartData[idx].distance };
        }
        return null;
      })
      .filter(Boolean) as Array<{ idx: number; distance: number }>;
  }, [matrixProfile, mpChartData]);

  if (!matrixProfile || !bestMotif) {
    return (
      <div className="col-span-1 md:col-span-2 p-5 rounded-xl border border-cyan-500/20 bg-[#111827]">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-cyan-400 text-base">&#9670;</span>
          <h3 className="text-sm font-semibold text-white">Matrix Profile Analysis</h3>
        </div>
        <p className="text-sm text-slate-500">No recurring patterns detected in recent history</p>
      </div>
    );
  }

  const similarityPct = (bestMotif.similarity * 100).toFixed(0);
  const subseqLen = bestMotif.current_end - bestMotif.current_start + 1;

  return (
    <div className="col-span-1 md:col-span-2 p-5 rounded-xl border border-cyan-500/20 bg-[#111827]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-cyan-400 text-base">&#9670;</span>
        <h3 className="text-sm font-semibold text-cyan-400">
          Similar Pattern Found in History
        </h3>
      </div>

      {/* Sparklines Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5 min-w-0 overflow-hidden">
        {/* Current Pattern Sparkline */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-slate-500 font-medium mb-1.5 uppercase tracking-wider">
            Current
          </div>
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-2">
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={currentSlice} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="mpCyanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{
                    background: '#1F2937',
                    border: '1px solid rgba(34,211,238,0.2)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#E2E8F0',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}`, 'Close']}
                  labelFormatter={(label: number) =>
                    currentSlice[label]?.date ?? `Bar ${label}`
                  }
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke="#22D3EE"
                  strokeWidth={2}
                  fill="url(#mpCyanGradient)"
                  dot={false}
                  activeDot={{ r: 3, fill: '#22D3EE' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Similarity Badge */}
        <div className="flex sm:flex-col items-center justify-center shrink-0 sm:pt-5 gap-2 sm:gap-0">
          <div className="hidden sm:block w-px h-4 bg-cyan-500/30" />
          <div className="px-2.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30">
            <span className="text-[11px] font-bold text-cyan-400 font-mono">
              &#8776; {similarityPct}%
            </span>
          </div>
          <div className="text-[9px] text-slate-600 sm:mt-1">similar</div>
          <div className="hidden sm:block w-px h-4 bg-cyan-500/30" />
        </div>

        {/* Historical Match Sparkline */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-slate-500 font-medium mb-1.5 uppercase tracking-wider">
            Historical Match
          </div>
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-2">
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={matchSlice} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="mpCyanGradientMatch" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{
                    background: '#1F2937',
                    border: '1px solid rgba(34,211,238,0.2)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#E2E8F0',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}`, 'Close']}
                  labelFormatter={(label: number) =>
                    matchSlice[label]?.date ?? `Bar ${label}`
                  }
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke="#22D3EE"
                  strokeWidth={2}
                  fill="url(#mpCyanGradientMatch)"
                  dot={false}
                  activeDot={{ r: 3, fill: '#22D3EE' }}
                  strokeDasharray="4 2"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Match Metadata */}
      <div className="flex flex-wrap items-center gap-4 mb-4 px-1">
        {bestMotif.match_date && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500">Match Date</span>
            <span className="text-xs font-medium text-white font-mono">
              {bestMotif.match_date}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500">Similarity</span>
          <span className="text-xs font-bold text-cyan-400 font-mono">
            {similarityPct}%
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500">Window</span>
          <span className="text-xs font-medium text-white font-mono">
            {subseqLen} bars
          </span>
        </div>
      </div>

      {/* Outcome Section */}
      <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3 mb-5">
        <div className="text-[10px] text-slate-500 font-medium mb-2.5 uppercase tracking-wider">
          What happened after the historical match
        </div>
        <div className="flex items-center justify-around">
          <ReturnBadge label="+5 days" value={bestMotif.outcome.return_5d} />
          <div className="w-px h-8 bg-white/[0.06]" />
          <ReturnBadge label="+10 days" value={bestMotif.outcome.return_10d} />
          <div className="w-px h-8 bg-white/[0.06]" />
          <ReturnBadge label="+20 days" value={bestMotif.outcome.return_20d} />
        </div>
      </div>

      {/* Matrix Profile Distance Chart */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
          <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
            Matrix Profile Distance
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-[9px] text-slate-500">Low = Recurring</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[9px] text-slate-500">High = Anomaly</span>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-2">
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={mpChartData} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
              <Tooltip
                contentStyle={{
                  background: '#1F2937',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#E2E8F0',
                }}
                formatter={(value: number) => [value.toFixed(3), 'Distance']}
                labelFormatter={(label: number) => `Index ${label}`}
              />
              <Line
                type="monotone"
                dataKey="distance"
                stroke="#64748B"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: '#94A3B8' }}
              />
              {/* Motif annotations (low points) */}
              {motifLowPoints.map((pt, i) => (
                <ReferenceDot
                  key={`motif-${i}`}
                  x={pt.idx}
                  y={pt.distance}
                  r={4}
                  fill="#22D3EE"
                  stroke="#22D3EE"
                  strokeWidth={1}
                />
              ))}
              {/* Discord annotations (high points) */}
              {annotatedDiscords.map((d, i) => (
                <ReferenceDot
                  key={`discord-${i}`}
                  x={d.index}
                  y={mpChartData[d.index]?.distance ?? 0}
                  r={4}
                  fill="#F59E0B"
                  stroke="#F59E0B"
                  strokeWidth={1}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
