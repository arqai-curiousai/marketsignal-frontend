'use client';

import React, { useEffect, useState } from 'react';
import { getQualityScores } from '@/lib/api/analyticsApi';
import type { IQualityScores } from '@/types/analytics';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  ticker: string;
  exchange?: string;
}

function ScoreGauge({ value, max, label, color }: { value: number | null; max: number; label: string; color: string }) {
  if (value === null) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="relative h-16 w-16 rounded-full border-4 border-white/10 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">N/A</span>
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    );
  }
  const pct = Math.min(Math.abs(value) / max * 100, 100);
  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
          <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
          <circle
            cx="32" cy="32" r="28" fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">{typeof value === 'number' ? value.toFixed(1) : value}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function TrafficLight({ label, status }: { label: string; status: string }) {
  const colors: Record<string, string> = {
    'Safe': 'bg-emerald-500',
    'Strong': 'bg-emerald-500',
    'Unlikely Manipulator': 'bg-emerald-500',
    'Grey Zone': 'bg-amber-500',
    'Moderate': 'bg-amber-500',
    'Distress': 'bg-red-500',
    'Weak': 'bg-red-500',
    'Likely Manipulator': 'bg-red-500',
    'N/A': 'bg-gray-500',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`h-2.5 w-2.5 rounded-full ${colors[status] || 'bg-gray-500'}`} />
      <span className="text-xs">{label}: <span className="font-medium">{status}</span></span>
    </div>
  );
}

export function QualityScorecard({ ticker, exchange = 'NSE' }: Props) {
  const [data, setData] = useState<IQualityScores | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getQualityScores(ticker, exchange).then((res) => {
      if (!cancelled && res.success) setData(res.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [ticker, exchange]);

  if (loading) {
    return (
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-3">
        <Skeleton className="h-5 w-36" />
        <div className="flex gap-6 justify-center">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-sm text-muted-foreground">
        Quality scores unavailable for {ticker}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Fundamental Quality</h3>

      <div className="flex items-center justify-around">
        <ScoreGauge
          value={data.piotroski.score}
          max={9}
          label="F-Score"
          color={data.piotroski.score !== null && data.piotroski.score >= 7 ? '#10b981' : data.piotroski.score !== null && data.piotroski.score <= 3 ? '#ef4444' : '#f59e0b'}
        />
        <ScoreGauge
          value={data.altman_z.score}
          max={5}
          label="Z-Score"
          color={data.altman_z.label === 'Safe' ? '#10b981' : data.altman_z.label === 'Distress' ? '#ef4444' : '#f59e0b'}
        />
        <ScoreGauge
          value={data.beneish_m.score}
          max={3}
          label="M-Score"
          color={data.beneish_m.label === 'Unlikely Manipulator' ? '#10b981' : '#ef4444'}
        />
      </div>

      <div className="space-y-1.5 pt-2 border-t border-white/5">
        <TrafficLight label="Piotroski" status={data.piotroski.label} />
        <TrafficLight label="Altman Z" status={data.altman_z.label} />
        <TrafficLight label="Beneish M" status={data.beneish_m.label} />
      </div>
    </div>
  );
}
