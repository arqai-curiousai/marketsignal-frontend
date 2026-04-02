'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Trash2, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMarketAwarePolling } from '@/lib/hooks/useMarketAwarePolling';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/src/lib/exchange/formatting';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- false positive: toast is used in handleCreate/handleDelete
import { toast } from 'sonner';
import { getPriceAlerts, createPriceAlert, deletePriceAlert } from '@/src/lib/api/analyticsApi';
import type { IPriceAlert } from '@/src/types/analytics';
import { ALL_FOREX_PAIRS } from './constants';

const ANIM = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

const CONDITION_LABELS: Record<string, string> = {
  above: 'Price Above',
  below: 'Price Below',
  cross_above: 'Crosses Above',
  cross_below: 'Crosses Below',
};

const CONDITION_ICONS: Record<string, string> = {
  above: '↑',
  below: '↓',
  cross_above: '⤴',
  cross_below: '⤵',
};

/** New alert form */
function NewAlertForm({
  selectedPair,
  onSubmit,
  onCancel,
}: {
  selectedPair: string;
  onSubmit: (pair: string, condition: string, price: number, note: string) => void;
  onCancel: () => void;
}) {
  const [pair, setPair] = useState(selectedPair);
  const [condition, setCondition] = useState('above');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    const p = parseFloat(price);
    if (!p || p <= 0) return;
    onSubmit(pair, condition, p, note);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-muted-foreground mb-1" htmlFor="alert-pair">Pair</label>
            <select
              id="alert-pair"
              value={pair}
              onChange={e => setPair(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-sky-500/40"
            >
              {ALL_FOREX_PAIRS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-muted-foreground mb-1" htmlFor="alert-condition">Condition</label>
            <select
              id="alert-condition"
              value={condition}
              onChange={e => setCondition(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500/40"
            >
              {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-muted-foreground mb-1" htmlFor="alert-price">Target Price</label>
            <input
              id="alert-price"
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              step="0.0001"
              placeholder="e.g. 84.0000"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-sky-500/40 placeholder:text-white/20"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted-foreground mb-1" htmlFor="alert-note">Note (optional)</label>
            <input
              id="alert-note"
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              maxLength={200}
              placeholder="Resistance level"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500/40 placeholder:text-white/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 text-xs text-muted-foreground hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!price || parseFloat(price) <= 0}
            className={cn(
              'flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors',
              price && parseFloat(price) > 0
                ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30'
                : 'bg-white/[0.04] text-muted-foreground cursor-not-allowed'
            )}
          >
            <Check className="h-3 w-3" />
            Set Alert
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/** Single alert row */
function AlertRow({
  alert,
  onDelete,
}: {
  alert: IPriceAlert;
  onDelete: (id: string) => void;
}) {
  const condIcon = CONDITION_ICONS[alert.condition] ?? '•';
  const condLabel = CONDITION_LABELS[alert.condition] ?? alert.condition;
  const isTriggered = !alert.is_active && alert.triggered_at;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, height: 0 }}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group',
        isTriggered ? 'bg-emerald-500/5 border border-emerald-500/10' : 'hover:bg-white/[0.02]'
      )}
    >
      {/* Icon */}
      <span className={cn(
        'text-sm w-6 text-center',
        isTriggered ? 'text-emerald-400' : 'text-muted-foreground'
      )}>
        {isTriggered ? '✓' : condIcon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold font-mono">{alert.pair}</span>
          <span className="text-[10px] text-muted-foreground">{condLabel}</span>
          <span className="text-xs font-mono font-semibold tabular-nums text-sky-400">
            {alert.target_price}
          </span>
        </div>
        {alert.note && (
          <p className="text-[10px] text-muted-foreground/60 truncate">{alert.note}</p>
        )}
        {isTriggered && alert.triggered_price && (
          <p className="text-[10px] text-emerald-400/70">
            Triggered at {alert.triggered_price} on {new Date(alert.triggered_at ?? '').toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Created time */}
      <span className="text-[9px] text-muted-foreground/40 whitespace-nowrap">
        {formatDateTime(alert.created_at, 'NSE', { month: 'short', day: 'numeric' })}
      </span>

      {/* Delete */}
      {alert.is_active && (
        <button
          type="button"
          onClick={() => onDelete(alert.id)}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
          aria-label="Delete alert"
        >
          <Trash2 className="h-3 w-3 text-red-400" />
        </button>
      )}
    </motion.div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export function AlertPanel({ selectedPair }: { selectedPair: string }) {
  const [alerts, setAlerts] = useState<IPriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPriceAlerts(!showAll);
      if (res.success && res.data) setAlerts(res.data.alerts);
      else setError('Failed to load price alerts');
    } catch {
      setError('Failed to load price alerts');
    } finally {
      setLoading(false);
    }
  }, [showAll]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Market-hours-aware polling: 60s when open, 5min when closed
  useMarketAwarePolling({
    fetchFn: fetchAlerts,
    marketType: 'forex',
    activeIntervalMs: 60_000,
    inactiveIntervalMs: 300_000,
  });

  const handleCreate = async (pair: string, condition: string, price: number, note: string) => {
    try {
      const res = await createPriceAlert(pair, condition, price, note);
      if (res.success && res.data?.alert) {
        setAlerts(prev => [res.data?.alert, ...prev].filter((a): a is IPriceAlert => Boolean(a)));
        setShowForm(false);
      } else {
        toast.error('Failed to create alert');
      }
    } catch {
      toast.error('Failed to create alert');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deletePriceAlert(id);
      if (res.success) {
        setAlerts(prev => prev.filter(a => a.id !== id));
      } else {
        toast.error('Failed to delete alert');
      }
    } catch {
      toast.error('Failed to delete alert');
    }
  };

  if (error && alerts.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 flex flex-col items-center">
        <AlertCircle className="h-6 w-6 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground mb-3">{error}</p>
        <button onClick={fetchAlerts} className="text-xs text-primary hover:underline flex items-center gap-1">
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }

  const activeAlerts = alerts.filter(a => a.is_active);

  return (
    <motion.div {...ANIM}>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-medium">Price Alerts</h3>
            {activeAlerts.length > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {activeAlerts.length} active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAll(p => !p)}
              className={cn(
                'text-[10px] px-2 py-0.5 rounded transition-colors',
                showAll ? 'bg-white/[0.06] text-white/60' : 'text-muted-foreground hover:text-white/60'
              )}
            >
              {showAll ? 'All' : 'Active'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(p => !p)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/20 transition-colors"
            >
              <Plus className="h-3 w-3" />
              New Alert
            </button>
          </div>
        </div>

        {/* New alert form */}
        <AnimatePresence>
          {showForm && (
            <div className="mb-3">
              <NewAlertForm
                selectedPair={selectedPair}
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Alert list */}
        {loading && alerts.length === 0 ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-6">
            <Bell className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No price alerts set</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1">
              Create an alert to get notified when a pair reaches your target price
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            <AnimatePresence mode="popLayout">
              {alerts.map(alert => (
                <AlertRow key={alert.id} alert={alert} onDelete={handleDelete} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
