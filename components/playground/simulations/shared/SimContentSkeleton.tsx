'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { SkeletonRow } from './sim-tokens';

interface Props {
  layout: SkeletonRow[];
  className?: string;
}

function SkeletonBlock({ row }: { row: SkeletonRow }) {
  const count = row.count ?? 1;

  if (count > 1) {
    return (
      <div className={cn('flex', row.gap ?? 'gap-2')}>
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="sim-skeleton flex-1"
            style={{ height: row.height }}
          />
        ))}
      </div>
    );
  }

  if (row.type === 'circle') {
    return (
      <div className="flex justify-center">
        <div
          className="sim-skeleton rounded-full"
          style={{ width: row.width, height: row.height }}
        />
      </div>
    );
  }

  return (
    <div
      className="sim-skeleton"
      style={{ width: row.width, height: row.height }}
    />
  );
}

export function SimContentSkeleton({ layout, className }: Props) {
  return (
    <div className={cn('space-y-3 p-4', className)}>
      {layout.map((row, i) => (
        <SkeletonBlock key={i} row={row} />
      ))}
    </div>
  );
}
