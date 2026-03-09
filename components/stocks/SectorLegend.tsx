'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { SECTOR_COLORS } from '@/types/analytics';

interface SectorLegendProps {
  sectors: string[];
  activeSector: string | null;
  onSectorClick: (sector: string | null) => void;
}

export function SectorLegend({ sectors, activeSector, onSectorClick }: SectorLegendProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onSectorClick(null)}
        className={cn(
          'px-3 py-1.5 text-xs font-medium rounded-full transition-all',
          activeSector === null
            ? 'bg-white/10 text-white ring-1 ring-white/20'
            : 'bg-white/5 text-muted-foreground hover:bg-white/10',
        )}
      >
        All Sectors
      </button>
      {sectors.map((sector) => {
        const color = SECTOR_COLORS[sector] || '#64748B';
        const isActive = activeSector === sector;
        return (
          <button
            key={sector}
            onClick={() => onSectorClick(isActive ? null : sector)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5',
              isActive
                ? 'ring-1 ring-white/20 text-white'
                : 'text-muted-foreground hover:bg-white/10',
            )}
            style={{
              backgroundColor: isActive ? `${color}20` : 'rgba(255,255,255,0.03)',
            }}
          >
            <span
              className="h-2 w-2 rounded-full inline-block"
              style={{ backgroundColor: color }}
            />
            {sector}
          </button>
        );
      })}
    </div>
  );
}
