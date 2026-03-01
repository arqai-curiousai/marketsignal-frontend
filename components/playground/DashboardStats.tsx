'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Target, Trophy } from 'lucide-react';
import type { IAlgoInfo, IAlgoSignal, IAlgoPerformance } from '@/types/playground';

interface DashboardStatsProps {
  algos: IAlgoInfo[];
  signals: IAlgoSignal[];
  performance: IAlgoPerformance[];
}

export function DashboardStats({ algos, signals, performance }: DashboardStatsProps) {
  const activeAlgos = algos.filter((a) => a.isActive).length;
  const signalsToday = signals.length;

  // Average accuracy across all algos (7d period)
  const weeklyPerf = performance.filter((p) => p.period === '7d');
  const avgAccuracy =
    weeklyPerf.length > 0
      ? weeklyPerf.reduce((sum, p) => sum + p.accuracy, 0) / weeklyPerf.length
      : 0;

  // Best performer by accuracy (7d)
  const bestPerformer =
    weeklyPerf.length > 0
      ? weeklyPerf.reduce((best, p) => (p.accuracy > best.accuracy ? p : best))
      : null;

  const stats = [
    {
      label: 'Active Algos',
      value: activeAlgos.toString(),
      icon: Activity,
      color: 'from-brand-blue/20 to-brand-violet/20',
      iconColor: 'text-brand-blue',
    },
    {
      label: 'Signals (24h)',
      value: signalsToday.toString(),
      icon: Zap,
      color: 'from-brand-emerald/20 to-brand-blue/20',
      iconColor: 'text-brand-emerald',
    },
    {
      label: 'Avg Accuracy',
      value: `${(avgAccuracy * 100).toFixed(1)}%`,
      icon: Target,
      color: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-400',
    },
    {
      label: 'Best Performer',
      value: bestPerformer ? bestPerformer.algoName.replace(/_/g, ' ') : '—',
      subtitle: bestPerformer ? `${(bestPerformer.accuracy * 100).toFixed(1)}% acc` : undefined,
      icon: Trophy,
      color: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-30`} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-white capitalize">{stat.value}</p>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
