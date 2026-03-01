'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, BarChart3, Percent } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { IAlgoPerformance } from '@/types/playground';

interface AlgoPerformanceCardProps {
  performance: IAlgoPerformance[];
}

function PerformanceMetric({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
      <div className={cn('p-2 rounded-lg', color)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function AlgoTab({ data }: { data: IAlgoPerformance[] }) {
  // Find the 7d period (most useful), fallback to whatever is available
  const stats = data.find((d) => d.period === '7d') || data[0];

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
        No performance data yet.
      </div>
    );
  }

  // Signal distribution for the bars
  const correctPct = stats.totalSignals > 0 ? (stats.correctPredictions / stats.totalSignals) * 100 : 0;
  const wrongPct = stats.totalSignals > 0 ? ((stats.totalSignals - stats.correctPredictions) / stats.totalSignals) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <PerformanceMetric
          label="Accuracy"
          value={`${(stats.accuracy * 100).toFixed(1)}%`}
          icon={Target}
          color="bg-brand-blue/20"
        />
        <PerformanceMetric
          label="Win Rate"
          value={`${(stats.winRate * 100).toFixed(1)}%`}
          icon={TrendingUp}
          color="bg-brand-emerald/20"
        />
        <PerformanceMetric
          label="Total PnL"
          value={`${stats.totalPnlPercent > 0 ? '+' : ''}${stats.totalPnlPercent.toFixed(2)}%`}
          icon={BarChart3}
          color={stats.totalPnlPercent >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}
        />
        <PerformanceMetric
          label="Avg Confidence"
          value={`${(stats.avgConfidence * 100).toFixed(0)}%`}
          icon={Percent}
          color="bg-purple-500/20"
        />
      </div>

      {/* Simple accuracy bar */}
      <div className="rounded-lg bg-white/5 p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>{stats.totalSignals} total signals ({stats.period})</span>
          <span>{stats.correctPredictions} correct</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-white/5">
          <div
            className="bg-green-500 transition-all duration-500"
            style={{ width: `${correctPct}%` }}
          />
          <div
            className="bg-red-500/60 transition-all duration-500"
            style={{ width: `${wrongPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> Correct
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-red-500/60 inline-block" /> Incorrect
          </div>
        </div>
      </div>

      {/* Period breakdown */}
      <div className="grid grid-cols-3 gap-2">
        {data.map((d) => (
          <div
            key={d.period}
            className={cn(
              'rounded-lg p-3 text-center border',
              d.period === '7d' ? 'border-brand-blue/30 bg-brand-blue/5' : 'border-white/5 bg-white/5'
            )}
          >
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.period}</p>
            <p className="text-lg font-bold text-white">{(d.accuracy * 100).toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground">{d.totalSignals} signals</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AlgoPerformanceCard({ performance }: AlgoPerformanceCardProps) {
  // Group performance by algo name
  const algoNames = [...new Set(performance.map((p) => p.algoName))];

  if (algoNames.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        No performance data yet. Signals need to be evaluated first.
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Tabs defaultValue={algoNames[0]} className="w-full">
        <TabsList className="bg-white/5 border border-white/10 mb-4">
          {algoNames.map((name) => (
            <TabsTrigger
              key={name}
              value={name}
              className="capitalize data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              {name.replace(/_/g, ' ')}
            </TabsTrigger>
          ))}
        </TabsList>
        {algoNames.map((name) => (
          <TabsContent key={name} value={name}>
            <AlgoTab data={performance.filter((p) => p.algoName === name)} />
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
}
