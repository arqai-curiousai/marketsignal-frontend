'use client';

import React from 'react';
import type { IImpactChain } from '@/types/analytics';
import { REGION_METADATA, getSentimentColor, formatTimeAgo } from './constants';

interface ImpactChainSankeyProps {
  chains: IImpactChain[];
  loading?: boolean;
}

function magnitudeWidth(mag: number): number { return Math.min(Math.max(mag, 0), 1); }

function bestChange(f: { price_change_1h: number | null; price_change_4h: number | null; price_change_1d: number | null }): number | null {
  return f.price_change_1h ?? f.price_change_4h ?? f.price_change_1d ?? null;
}

function changeColor(val: number | null): string {
  if (val == null) return '#64748B';
  if (val > 0) return '#10B981';
  if (val < 0) return '#EF4444';
  return '#64748B';
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 animate-pulse">
      <div className="flex-[2] space-y-2">
        <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
        <div className="h-2 w-1/2 rounded bg-white/[0.04]" />
      </div>
      <div className="flex-[1] flex gap-1.5">
        <div className="h-5 w-12 rounded-full bg-white/[0.06]" />
        <div className="h-5 w-12 rounded-full bg-white/[0.06]" />
      </div>
      <div className="flex-[1.5] flex gap-2">
        <div className="h-4 w-16 rounded bg-white/[0.06]" />
        <div className="h-4 w-16 rounded bg-white/[0.06]" />
      </div>
    </div>
  );
}

export function ImpactChainSankey({ chains, loading }: ImpactChainSankeyProps) {
  if (loading) {
    return (
      <div className="space-y-0 divide-y divide-white/[0.04]">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (!chains || chains.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-white/30">
        No impact chains available
      </div>
    );
  }

  const sorted = [...chains]
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 5);

  return (
    <div className="space-y-0 divide-y divide-white/[0.04]">
      {/* Column headers */}
      <div className="flex items-center gap-3 pb-2 text-[10px] uppercase tracking-wider text-white/25">
        <span className="flex-[2]">Event</span>
        <span className="flex-[1]">Regions</span>
        <span className="flex-[1.5]">Pair Impact</span>
      </div>

      {sorted.map((chain) => {
        const sentColor = getSentimentColor(chain.sentiment);
        return (
          <div
            key={chain.news_id}
            className="group relative flex items-center gap-3 py-3 hover:bg-white/[0.02] transition-colors"
          >
            {/* Left: Event card */}
            <div className="flex-[2] min-w-0 space-y-1.5">
              <p className="text-xs text-white/80 leading-snug line-clamp-2 font-medium">
                {chain.title}
              </p>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{
                    color: sentColor,
                    backgroundColor: `${sentColor}15`,
                  }}
                >
                  {chain.sentiment}
                </span>
                <span className="text-[10px] text-white/25">{chain.source}</span>
                {chain.published_at && (
                  <span className="text-[10px] text-white/20">
                    {formatTimeAgo(chain.published_at)}
                  </span>
                )}
              </div>
              {/* Magnitude bar */}
              <div className="h-[3px] w-full rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${magnitudeWidth(chain.magnitude) * 100}%`,
                    background: `linear-gradient(90deg, ${sentColor}80, ${sentColor}30)`,
                  }}
                />
              </div>
            </div>

            {/* Connector line (CSS pseudo-element style via inline SVG) */}
            <svg className="w-4 h-8 shrink-0 text-white/[0.08]" viewBox="0 0 16 32">
              <path d="M0 16 C8 16, 8 8, 16 8" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M0 16 C8 16, 8 24, 16 24" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>

            {/* Middle: Region badges */}
            <div className="flex-[1] flex flex-wrap gap-1 items-center">
              {chain.affected_regions.map((region) => {
                const meta = REGION_METADATA[region];
                return (
                  <span
                    key={region}
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{
                      color: meta?.color ?? '#94A3B8',
                      backgroundColor: `${meta?.color ?? '#94A3B8'}15`,
                    }}
                  >
                    <span>{meta?.flag ?? ''}</span>
                    {meta?.displayName ?? region}
                  </span>
                );
              })}
              {chain.affected_regions.length === 0 && (
                <span className="text-[10px] text-white/20">--</span>
              )}
            </div>

            {/* Connector line */}
            <svg className="w-4 h-8 shrink-0 text-white/[0.08]" viewBox="0 0 16 32">
              <path d="M0 8 C8 8, 8 16, 16 16" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M0 24 C8 24, 8 16, 16 16" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>

            {/* Right: Pair flows */}
            <div className="flex-[1.5] flex flex-wrap gap-x-3 gap-y-1 items-center">
              {chain.pair_flows.slice(0, 4).map((flow) => {
                const val = bestChange(flow);
                const color = changeColor(val);
                return (
                  <span
                    key={flow.pair}
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono"
                  >
                    <span className="text-white/50">{flow.pair}</span>
                    <span style={{ color }} className="font-medium">
                      {val != null ? `${val > 0 ? '+' : ''}${val.toFixed(2)}%` : '--'}
                    </span>
                  </span>
                );
              })}
              {chain.pair_flows.length === 0 && (
                <span className="text-[10px] text-white/20">No pairs affected</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
