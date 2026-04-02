'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, RefreshCw } from 'lucide-react';
import { PatternRadar } from './PatternRadar';
import { DualNarrative } from './DualNarrative';
import { ConfluenceIndicator } from './ConfluenceIndicator';
import { apiClient } from '@/lib/api/apiClient';

interface PatternDashboardProps {
  ticker: string;
  exchange: string;
  className?: string;
}

interface PatternData {
  patterns: {
    patterns: Array<{
      type: string;
      category: string;
      direction: string;
      confidence: number;
      quality_score?: number;
      quality_grade?: string;
      description?: string;
      measured_move?: number | null;
      invalidation_level?: number | null;
    }>;
    overall_quality_grade: string;
    regime: string;
    active_pattern_count: number;
    overall_signal: string;
  };
  narrative?: {
    narrative_type: string;
    conviction: number;
    institutional_stance: string;
    retail_sentiment: string;
    market_maker: { bias: string; confidence: number; reasoning: string };
    retail: { bias: string; confidence: number; reasoning: string };
    generated_at: string;
    overall_quality_grade?: string;
  };
}

export function PatternDashboard({ ticker, exchange, className }: PatternDashboardProps) {
  const [data, setData] = useState<PatternData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<PatternData>(`/api/insights/${encodeURIComponent(ticker)}/detail`, { exchange, timeframe: 'daily' });
      if (res.success) setData(res.data);
    } catch {
      setError('Failed to load pattern data');
    } finally {
      setLoading(false);
    }
  }, [ticker, exchange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-sm text-slate-500">{error || 'No pattern data available'}</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300"
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }

  const { patterns: patternCtx, narrative } = data;
  const patterns = patternCtx?.patterns || [];

  // Build category summary for radar
  const categoryMap = new Map<string, { count: number; totalQuality: number; directions: string[] }>();
  for (const p of patterns) {
    const cat = p.category || 'unknown';
    const entry = categoryMap.get(cat) || { count: 0, totalQuality: 0, directions: [] };
    entry.count++;
    entry.totalQuality += p.quality_score || p.confidence || 0;
    entry.directions.push(p.direction);
    categoryMap.set(cat, entry);
  }

  const radarCategories = Array.from(categoryMap.entries()).map(([name, entry]) => {
    const bullish = entry.directions.filter((d) => d === 'bullish').length;
    const bearish = entry.directions.filter((d) => d === 'bearish').length;
    return {
      name,
      count: entry.count,
      avgQuality: entry.count > 0 ? entry.totalQuality / entry.count : 0,
      direction: (bullish > bearish ? 'bullish' : bearish > bullish ? 'bearish' : 'neutral') as
        | 'bullish'
        | 'bearish'
        | 'neutral',
    };
  });

  const overallGrade = patternCtx?.overall_quality_grade || 'C';
  const narrativeType = (narrative?.narrative_type || 'quiet') as 'divergence' | 'alignment' | 'quiet';

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with grade and stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ConfluenceIndicator
          grade={overallGrade}
          narrativeType={narrativeType}
          patternCount={patternCtx?.active_pattern_count}
        />
        <button
          onClick={fetchData}
          className="flex items-center gap-1 rounded-md bg-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-700"
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {/* Radar + Narrative grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Radar */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="mb-3 text-xs font-medium text-slate-400">Pattern Radar</h3>
          {radarCategories.length > 0 ? (
            <PatternRadar categories={radarCategories} overallGrade={overallGrade} />
          ) : (
            <div className="flex h-48 items-center justify-center text-xs text-slate-600">
              No patterns detected
            </div>
          )}
        </div>

        {/* Dual Narrative */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="mb-3 text-xs font-medium text-slate-400">Market Perspectives</h3>
          {narrative ? (
            <DualNarrative
              institutionalStance={narrative.institutional_stance}
              retailSentiment={narrative.retail_sentiment}
              marketMakerReasoning={narrative.market_maker?.reasoning}
              retailReasoning={narrative.retail?.reasoning}
              narrativeType={narrativeType}
              conviction={narrative.conviction}
            />
          ) : (
            <div className="flex h-48 items-center justify-center text-xs text-slate-600">
              Watch this instrument to generate narratives
            </div>
          )}
        </div>
      </div>

      {/* Pattern list */}
      {patterns.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="mb-3 text-xs font-medium text-slate-400">
            Active Patterns ({patterns.length})
          </h3>
          <div className="space-y-2">
            {patterns.slice(0, 15).map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      p.direction === 'bullish'
                        ? 'bg-emerald-400'
                        : p.direction === 'bearish'
                          ? 'bg-red-400'
                          : 'bg-slate-400',
                    )}
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-300">
                      {p.type.replace(/_/g, ' ')}
                    </span>
                    <span className="ml-2 text-[10px] text-slate-500">{p.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.quality_grade && (
                    <span className="text-[10px] font-medium text-violet-400">
                      {p.quality_grade}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500">
                    {Math.round((p.quality_score || p.confidence) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] leading-relaxed text-slate-600">
        Pattern detection and market analysis for informational and educational purposes only.
        Historical pattern performance does not guarantee future results.
        This is not investment advice.
      </p>
    </div>
  );
}
