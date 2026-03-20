'use client';

import { Globe, TrendingUp, LineChart, GitBranch, Landmark, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CurrencyTab =
  | 'heatmap'
  | 'strength'
  | 'deepdive'
  | 'correlation'
  | 'carry'
  | 'calendar';

const TABS: { id: CurrencyTab; label: string; icon: typeof Globe }[] = [
  { id: 'heatmap', label: 'Heat Map', icon: Globe },
  { id: 'strength', label: 'Strength', icon: TrendingUp },
  { id: 'deepdive', label: 'Deep Dive', icon: LineChart },
  { id: 'correlation', label: 'Correlation', icon: GitBranch },
  { id: 'carry', label: 'Carry & Rates', icon: Landmark },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
];

interface Props {
  activeTab: CurrencyTab;
  onTabChange: (tab: CurrencyTab) => void;
}

export function CurrencySubTabs({ activeTab, onTabChange }: Props) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin px-1">
      {TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
