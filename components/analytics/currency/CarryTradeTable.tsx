'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCurrencyCarry } from '@/src/lib/api/analyticsApi';
import type { ICurrencyCarry, ICurrencyCarryPair } from '@/src/types/analytics';

type Category = 'all' | 'major' | 'inr' | 'cross' | 'exotic';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'major', label: 'Major' },
  { id: 'inr', label: 'INR' },
  { id: 'cross', label: 'Cross' },
  { id: 'exotic', label: 'Exotic' },
];

type SortField =
  | 'pair'
  | 'base_rate'
  | 'quote_rate'
  | 'differential_pct'
  | 'spot'
  | 'forward_1y'
  | 'forward_premium_pct'
  | 'breakeven_depreciation_pct'
  | 'carry_risk_ratio';

type SortDir = 'asc' | 'desc';

interface ColumnDef {
  id: SortField;
  label: string;
  shortLabel: string;
  align: 'left' | 'right';
}

const COLUMNS: ColumnDef[] = [
  { id: 'pair', label: 'Pair', shortLabel: 'Pair', align: 'left' },
  { id: 'base_rate', label: 'Base Rate', shortLabel: 'Base', align: 'right' },
  { id: 'quote_rate', label: 'Quote Rate', shortLabel: 'Quote', align: 'right' },
  { id: 'differential_pct', label: 'Differential', shortLabel: 'Diff', align: 'right' },
  { id: 'spot', label: 'Spot', shortLabel: 'Spot', align: 'right' },
  { id: 'forward_1y', label: 'Forward 1Y', shortLabel: 'Fwd', align: 'right' },
  { id: 'forward_premium_pct', label: 'Fwd Premium', shortLabel: 'Prem', align: 'right' },
  { id: 'breakeven_depreciation_pct', label: 'Breakeven Dep.', shortLabel: 'B/E', align: 'right' },
  { id: 'carry_risk_ratio', label: 'Carry/Risk', shortLabel: 'C/R', align: 'right' },
];

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (field !== sortField) {
    return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
  }
  return sortDir === 'asc' ? (
    <ArrowUp className="h-3 w-3 text-primary" />
  ) : (
    <ArrowDown className="h-3 w-3 text-primary" />
  );
}

export function CarryTradeTable({ refreshTrigger }: { refreshTrigger?: number }) {
  const [data, setData] = useState<ICurrencyCarry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>('all');
  const [sortField, setSortField] = useState<SortField>('carry_risk_ratio');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const fetchData = useCallback(async (cat: Category) => {
    setLoading(true);
    setError(null);
    try {
      const param = cat === 'all' ? undefined : cat;
      const res = await getCurrencyCarry(param);
      if (res.success) {
        setData(res.data);
      } else {
        setError('Failed to load carry data');
      }
    } catch {
      setError('Network error loading carry data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(category);
  }, [category, fetchData, refreshTrigger]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'pair' ? 'asc' : 'desc');
    }
  };

  const sortedPairs = useMemo(() => {
    if (!data?.pairs) return [];
    const pairs = [...data.pairs];
    pairs.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      if (sortField === 'pair') {
        aVal = a.pair;
        bVal = b.pair;
      } else if (sortField === 'forward_1y') {
        aVal = a.forward_1y ?? 0;
        bVal = b.forward_1y ?? 0;
      } else {
        aVal = a[sortField];
        bVal = b[sortField];
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      const numA = aVal as number;
      const numB = bVal as number;
      return sortDir === 'asc' ? numA - numB : numB - numA;
    });
    return pairs;
  }, [data?.pairs, sortField, sortDir]);

  if (loading && !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 text-center">
        <p className="text-sm text-muted-foreground mb-3">{error}</p>
        <button
          onClick={() => fetchData(category)}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex items-center gap-1 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-full font-medium transition-colors',
              category === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {cat.label}
          </button>
        ))}
        {loading && (
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin ml-2" />
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {COLUMNS.map((col) => (
                  <th
                    key={col.id}
                    className={cn(
                      'py-2.5 px-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors whitespace-nowrap',
                      col.align === 'left' ? 'text-left' : 'text-right',
                      col.id === 'pair' && 'sticky left-0 z-10 bg-zinc-950'
                    )}
                    onClick={() => handleSort(col.id)}
                  >
                    <span className="inline-flex items-center gap-1">
                      <span className="hidden sm:inline">{col.label}</span>
                      <span className="sm:hidden">{col.shortLabel}</span>
                      <SortIcon field={col.id} sortField={sortField} sortDir={sortDir} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPairs.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No carry data available
                  </td>
                </tr>
              ) : (
                sortedPairs.map((p: ICurrencyCarryPair) => (
                  <tr
                    key={p.pair}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-2 px-3 font-semibold whitespace-nowrap sticky left-0 z-10 bg-zinc-950">
                      {p.pair}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {p.base_rate.toFixed(2)}%
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {p.quote_rate.toFixed(2)}%
                    </td>
                    <td
                      className={cn(
                        'py-2 px-3 text-right font-mono font-semibold',
                        p.differential_pct > 0 ? 'text-emerald-400' : 'text-rose-400'
                      )}
                    >
                      {p.differential_pct > 0 ? '+' : ''}
                      {p.differential_pct.toFixed(2)}%
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {p.spot.toFixed(4)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                      {p.forward_1y !== null ? p.forward_1y.toFixed(4) : '—'}
                    </td>
                    <td className={cn(
                      'py-2 px-3 text-right font-mono text-xs hidden lg:table-cell',
                      p.forward_premium_pct > 0 ? 'text-orange-400' : p.forward_premium_pct < 0 ? 'text-sky-400' : 'text-muted-foreground'
                    )}>
                      {p.forward_premium_pct > 0 ? '+' : ''}{p.forward_premium_pct.toFixed(2)}%
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-xs text-muted-foreground hidden lg:table-cell">
                      {p.breakeven_depreciation_pct.toFixed(2)}%
                    </td>
                    <td
                      className={cn(
                        'py-2 px-3 text-right font-mono font-semibold',
                        p.carry_risk_ratio >= 0.5
                          ? 'text-emerald-400'
                          : p.carry_risk_ratio >= 0.2
                            ? 'text-amber-400'
                            : 'text-muted-foreground'
                      )}
                    >
                      {p.carry_risk_ratio.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-[10px] text-muted-foreground">
        Carry/Risk ratio &gt; 0.5 is considered attractive. Differential = base rate minus quote
        rate. Positive = you earn carry going long the pair.
      </p>

      {/* Computed at */}
      {data?.computed_at && (
        <p className="text-[10px] text-muted-foreground text-right">
          Updated: {new Date(data.computed_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
