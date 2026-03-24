'use client';

import React, { useState } from 'react';
import { TrendingUp, Building2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSectorRisk,
  getSectorHistory,
  getSectorSeasonality,
  getSectorMansfield,
  getSectorFlow,
} from '@/src/lib/api/analyticsApi';
import type {
  ISectorRiskScorecard,
  ISectorHistory,
  ISectorSeasonality,
  ISectorMansfieldRS,
  ISectorVolumeFlow,
} from '@/types/analytics';
import { RiskRadarChart } from './RiskRadarChart';
import { HistoryChart } from './HistoryChart';
import { SeasonalityCalendar } from './SeasonalityCalendar';
import { MansfieldRSChart } from './MansfieldRSChart';
import { VolumeFlowGauge } from './VolumeFlowGauge';
import { SectorValuationPanel } from './SectorValuationPanel';
import { SectorFIIFlowPanel } from './SectorFIIFlowPanel';
import { SectorFinancialsPanel } from './SectorFinancialsPanel';
import { SectorEarningsCalendar } from './SectorEarningsCalendar';

type DetailTab = 'momentum' | 'institutional' | 'research';

const TABS: { id: DetailTab; label: string; icon: React.ElementType }[] = [
  { id: 'momentum', label: 'Momentum', icon: TrendingUp },
  { id: 'institutional', label: 'Institutional', icon: Building2 },
  { id: 'research', label: 'Research', icon: BookOpen },
];

interface SectorDetailTabsProps {
  sector: string;
  sectorColor: string;
  exchange: string;
  timeframeDays: number;
}

// ─── Skeletons ───────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-3 w-16 rounded bg-white/[0.06]" />
        <div className="h-3 w-12 rounded bg-white/[0.06]" />
      </div>
      <div className="h-[120px] w-full rounded-lg bg-white/[0.04]" />
    </div>
  );
}

function MetricsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="h-3 w-20 rounded bg-white/[0.06]" />
          <div className="h-3 w-12 rounded bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

function GaugeSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 animate-pulse">
      <div className="h-20 w-20 rounded-full bg-white/[0.04]" />
      <div className="h-3 w-24 rounded bg-white/[0.06]" />
    </div>
  );
}

function NoData() {
  return (
    <div className="text-[10px] text-muted-foreground text-center py-3">
      Insufficient data
    </div>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
      {title}
    </div>
  );
}

// ─── Lazy-fetching sections (mount on first tab visit) ──────

function useLazyFetch<T>(
  fetcher: () => Promise<{ success: boolean; data?: T; error?: { detail?: string } }>,
  deps: unknown[],
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then((r) => {
        if (cancelled) return;
        if (r.success && r.data) setData(r.data);
        else setError('Failed to load data');
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Failed to load data');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

// ─── Tab Content: Momentum ───────────────────────────────────

function MomentumTab({ sector, sectorColor, exchange, days }: {
  sector: string; sectorColor: string; exchange: string; days: number;
}) {
  const history = useLazyFetch<ISectorHistory>(
    () => getSectorHistory(sector, days, exchange),
    [sector, exchange, days],
  );
  const mansfield = useLazyFetch<ISectorMansfieldRS>(
    () => getSectorMansfield(sector, days, exchange),
    [sector, exchange, days],
  );
  const flow = useLazyFetch<ISectorVolumeFlow>(
    () => getSectorFlow(sector, exchange),
    [sector, exchange],
  );

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <SectionLabel title="Performance vs Benchmark" />
        {history.loading ? <ChartSkeleton /> : history.error ? (
          <div className="text-[10px] text-red-400/80 text-center py-3">{history.error}</div>
        ) : !history.data ? <NoData /> : (
          <HistoryChart data={history.data} sectorColor={sectorColor} />
        )}
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <SectionLabel title="Mansfield RS" />
        {mansfield.loading ? <ChartSkeleton /> : mansfield.error ? (
          <div className="text-[10px] text-red-400/80 text-center py-3">{mansfield.error}</div>
        ) : !mansfield.data ? <NoData /> : (
          <MansfieldRSChart data={mansfield.data} sectorColor={sectorColor} />
        )}
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <SectionLabel title="Volume Flow" />
        {flow.loading ? <GaugeSkeleton /> : flow.error ? (
          <div className="text-[10px] text-red-400/80 text-center py-3">{flow.error}</div>
        ) : !flow.data ? <NoData /> : (
          <VolumeFlowGauge data={flow.data} />
        )}
      </div>
    </div>
  );
}

// ─── Tab Content: Institutional ──────────────────────────────

function InstitutionalTab({ sector, exchange }: { sector: string; exchange: string }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <SectionLabel title="FII / FPI Flow" />
        <SectorFIIFlowPanel sector={sector} exchange={exchange} />
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <SectionLabel title="Valuation" />
        <SectorValuationPanel sector={sector} exchange={exchange} />
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <SectionLabel title="Financials" />
        <SectorFinancialsPanel sector={sector} exchange={exchange} />
      </div>
    </div>
  );
}

// ─── Tab Content: Research ───────────────────────────────────

function ResearchTab({ sector, sectorColor, exchange }: {
  sector: string; sectorColor: string; exchange: string;
}) {
  const risk = useLazyFetch<ISectorRiskScorecard>(
    () => getSectorRisk(sector, exchange),
    [sector, exchange],
  );
  const seasonality = useLazyFetch<ISectorSeasonality>(
    () => getSectorSeasonality(sector, exchange),
    [sector, exchange],
  );

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <SectionLabel title="Risk Scorecard" />
        {risk.loading ? <MetricsSkeleton rows={5} /> : risk.error ? (
          <div className="text-[10px] text-red-400/80 text-center py-3">{risk.error}</div>
        ) : !risk.data ? <NoData /> : (
          <RiskRadarChart data={risk.data} sectorColor={sectorColor} />
        )}
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <SectionLabel title="Seasonality" />
        {seasonality.loading ? <MetricsSkeleton rows={6} /> : seasonality.error ? (
          <div className="text-[10px] text-red-400/80 text-center py-3">{seasonality.error}</div>
        ) : !seasonality.data ? <NoData /> : (
          <SeasonalityCalendar data={seasonality.data} />
        )}
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <SectionLabel title="Earnings Calendar" />
        <SectorEarningsCalendar sector={sector} exchange={exchange} />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export function SectorDetailTabs({
  sector,
  sectorColor,
  exchange,
  timeframeDays,
}: SectorDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('momentum');
  // Track which tabs have been mounted (lazy-mount: only mount on first visit)
  const [mounted, setMounted] = useState<Set<DetailTab>>(() => new Set<DetailTab>(['momentum']));

  const handleTabChange = (tab: DetailTab) => {
    setActiveTab(tab);
    setMounted((prev) => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {/* Tab bar */}
      <div className="flex items-center rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={cn(
              'flex items-center gap-1.5 flex-1 justify-center rounded-md px-2 py-2 text-[10px] font-medium transition-all',
              activeTab === id
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-muted-foreground hover:text-white/70',
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content — lazy-mounted, hidden when inactive */}
      {mounted.has('momentum') && (
        <div className={activeTab !== 'momentum' ? 'hidden' : undefined}>
          <MomentumTab sector={sector} sectorColor={sectorColor} exchange={exchange} days={timeframeDays} />
        </div>
      )}
      {mounted.has('institutional') && (
        <div className={activeTab !== 'institutional' ? 'hidden' : undefined}>
          <InstitutionalTab sector={sector} exchange={exchange} />
        </div>
      )}
      {mounted.has('research') && (
        <div className={activeTab !== 'research' ? 'hidden' : undefined}>
          <ResearchTab sector={sector} sectorColor={sectorColor} exchange={exchange} />
        </div>
      )}
    </div>
  );
}
