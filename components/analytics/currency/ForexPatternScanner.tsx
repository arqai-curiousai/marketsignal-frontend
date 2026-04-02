'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ArrowUpRight, ArrowDownRight, Minus,
  RefreshCw, ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getForexPatternScanner } from '@/src/lib/api/analyticsApi';
import type { IScannerResult, IScannerStockResult, IPatternV2 } from '@/src/types/analytics';

/* ─── Constants ─────────────────────────────────────────────────────────── */

const GRADE_COLORS: Record<string, string> = {
  'A+': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'A': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'B': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  'C': 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

const DIRECTION_CONFIG = {
  bullish: { icon: ArrowUpRight, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  bearish: { icon: ArrowDownRight, color: 'text-red-400', bg: 'bg-red-500/10' },
  neutral: { icon: Minus, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
} as const;

const CATEGORIES = [
  'candlestick', 'chart', 'momentum', 'volatility', 'volume', 'regime', 'matrix_profile',
] as const;

/* ─── Pair Row Component ────────────────────────────────────────────────── */

function PairRow({ item, index }: { item: IScannerStockResult; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const dir = DIRECTION_CONFIG[item.overall_signal] ?? DIRECTION_CONFIG.neutral;
  const DirIcon = dir.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="border border-white/[0.06] rounded-xl overflow-hidden bg-white/[0.02]"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
      >
        <div className={cn('p-1.5 rounded-lg', dir.bg)}>
          <DirIcon className={cn('h-4 w-4', dir.color)} />
        </div>

        <div className="flex-1 text-left">
          <span className="text-sm font-medium text-white/90">{item.ticker}</span>
          {item.current_price != null && (
            <span className="ml-2 text-xs text-white/40">{item.current_price.toFixed(4)}</span>
          )}
        </div>

        <Badge variant="outline" className={cn('text-[10px] font-mono', GRADE_COLORS[item.overall_grade] ?? GRADE_COLORS['C'])}>
          {item.overall_grade}
        </Badge>

        <span className="text-xs text-white/50 tabular-nums w-8 text-right">
          {item.pattern_count}
        </span>

        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-white/30" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-white/30" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2 border-t border-white/[0.04]">
              {item.patterns.map((p: IPatternV2, pi: number) => (
                <div key={pi} className="flex items-center gap-2 py-1.5">
                  <Badge variant="outline" className={cn('text-[10px]', GRADE_COLORS[p.quality_grade] ?? GRADE_COLORS['C'])}>
                    {p.quality_grade}
                  </Badge>
                  <span className={cn('text-xs', DIRECTION_CONFIG[p.direction]?.color ?? 'text-zinc-400')}>
                    {p.direction}
                  </span>
                  <span className="text-xs text-white/60 flex-1">{p.type.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] text-white/30 tabular-nums">
                    {(p.quality_score * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────── */

export function ForexPatternScanner() {
  const [data, setData] = useState<IScannerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [minQuality, setMinQuality] = useState<string>('C');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getForexPatternScanner({
      categories: categoryFilter !== 'all' ? categoryFilter : undefined,
      direction: directionFilter !== 'all' ? directionFilter : undefined,
      minQuality,
    });
    if (!res.success) {
      setError(res.error.detail || res.error.message || 'Failed to scan patterns');
    } else if (res.data) {
      setData(res.data);
    }
    setLoading(false);
  }, [categoryFilter, directionFilter, minQuality]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = (data?.results ?? []).filter((r) => {
    if (!search) return true;
    return r.ticker.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white/90">Forex Pattern Scanner</h3>
          <p className="text-xs text-white/40 mt-0.5">
            {data ? `${data.stocks_with_patterns} of ${data.total_scanned} pairs with active patterns` : 'Scanning 42 forex pairs...'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="text-white/50 hover:text-white/80"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <Input
            placeholder="Search pairs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-white/[0.04] border-white/[0.08]"
          />
        </div>

        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-[100px] h-8 text-xs bg-white/[0.04] border-white/[0.08]">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="bullish">Bullish</SelectItem>
            <SelectItem value="bearish">Bearish</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[120px] h-8 text-xs bg-white/[0.04] border-white/[0.08]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={minQuality} onValueChange={setMinQuality}>
          <SelectTrigger className="w-[80px] h-8 text-xs bg-white/[0.04] border-white/[0.08]">
            <SelectValue placeholder="Grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="C">C+</SelectItem>
            <SelectItem value="B">B+</SelectItem>
            <SelectItem value="A">A+</SelectItem>
            <SelectItem value="A+">A+ only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary KPIs */}
      {data?.summary && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10 px-3 py-2 text-center">
            <p className="text-lg font-semibold text-emerald-400 tabular-nums">{data.summary.bullish_stocks}</p>
            <p className="text-[10px] text-emerald-400/60 uppercase tracking-wider">Bullish</p>
          </div>
          <div className="rounded-lg bg-red-500/[0.06] border border-red-500/10 px-3 py-2 text-center">
            <p className="text-lg font-semibold text-red-400 tabular-nums">{data.summary.bearish_stocks}</p>
            <p className="text-[10px] text-red-400/60 uppercase tracking-wider">Bearish</p>
          </div>
          <div className="rounded-lg bg-zinc-500/[0.06] border border-zinc-500/10 px-3 py-2 text-center">
            <p className="text-lg font-semibold text-zinc-400 tabular-nums">{data.summary.neutral_stocks}</p>
            <p className="text-[10px] text-zinc-400/60 uppercase tracking-wider">Neutral</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-500/[0.06] rounded-lg px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
        {filtered.length === 0 && !loading && (
          <p className="text-xs text-white/30 text-center py-6">No patterns found matching filters.</p>
        )}
        {filtered.map((item, i) => (
          <PairRow key={item.ticker} item={item} index={i} />
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-white/20 text-center pt-2">
        Pattern detection is for informational purposes only. Not a recommendation to trade.
      </p>
    </div>
  );
}
