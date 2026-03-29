'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { NewsScope } from './constants';

interface ScopeTabsProps {
  scope: NewsScope;
  onScopeChange: (scope: NewsScope) => void;
}

const SCOPES: { value: NewsScope; label: string; subtitle: string }[] = [
  { value: 'india', label: 'India', subtitle: 'NSE' },
  { value: 'global', label: 'Global', subtitle: 'NASDAQ, NYSE, LSE' },
];

/**
 * ScopeTabs — primary India | Global toggle for news scope.
 *
 * Sits at the very top of the news section. Large, prominent pills
 * so traders always know which market context they're viewing.
 */
export function ScopeTabs({ scope, onScopeChange }: ScopeTabsProps) {
  return (
    <div className="flex gap-1.5" role="tablist" aria-label="News scope">
      {SCOPES.map((s) => {
        const active = scope === s.value;
        return (
          <button
            key={s.value}
            role="tab"
            aria-selected={active}
            onClick={() => onScopeChange(s.value)}
            className={cn(
              'relative flex items-center gap-2 rounded-lg px-4 py-2 text-left transition-all',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20',
              active
                ? 'bg-white/[0.08] text-white shadow-sm'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]',
            )}
          >
            <span className="text-sm font-semibold leading-none">{s.label}</span>
            <span
              className={cn(
                'text-[10px] leading-none',
                active ? 'text-white/40' : 'text-white/20',
              )}
            >
              {s.subtitle}
            </span>
          </button>
        );
      })}
    </div>
  );
}
