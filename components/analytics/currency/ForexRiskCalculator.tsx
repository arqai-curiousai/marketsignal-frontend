'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, Calculator, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ALL_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'NZD/USD', 'USD/CAD',
  'EUR/GBP', 'EUR/JPY', 'EUR/CHF', 'EUR/AUD', 'EUR/NZD', 'EUR/CAD',
  'GBP/JPY', 'GBP/CHF', 'GBP/AUD', 'GBP/NZD', 'GBP/CAD',
  'AUD/JPY', 'AUD/NZD', 'AUD/CAD', 'AUD/CHF',
  'NZD/JPY', 'NZD/CAD', 'NZD/CHF',
  'CAD/JPY', 'CAD/CHF',
  'CHF/JPY',
] as const;

type Direction = 'long' | 'short';

interface Position {
  id: string;
  pair: string;
  direction: Direction;
  notional: number;
}

interface CurrencyExposure {
  currency: string;
  netExposure: number;
}

const MAX_POSITIONS = 10;

function parsePair(pair: string): { base: string; quote: string } {
  const [base, quote] = pair.split('/');
  return { base, quote };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ExposureBar({
  exposure,
  maxAbsExposure,
}: {
  exposure: CurrencyExposure;
  maxAbsExposure: number;
}) {
  const isPositive = exposure.netExposure >= 0;
  const absVal = Math.abs(exposure.netExposure);
  const normalizedWidth = maxAbsExposure > 0 ? (absVal / maxAbsExposure) * 45 : 0;

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-xs font-semibold w-8 shrink-0">{exposure.currency}</span>
      <div className="flex-1 h-5 relative bg-muted/30 rounded-sm overflow-hidden">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border z-10" />
        <div
          className={cn(
            'absolute top-0.5 bottom-0.5 rounded-sm transition-all duration-300',
            isPositive ? 'bg-emerald-500/60' : 'bg-rose-500/60'
          )}
          style={{
            left: isPositive ? '50%' : `${50 - normalizedWidth}%`,
            width: `${normalizedWidth}%`,
          }}
        />
      </div>
      <span
        className={cn(
          'text-xs font-mono w-20 text-right shrink-0',
          isPositive ? 'text-emerald-400' : 'text-rose-400'
        )}
      >
        {isPositive ? '+' : ''}
        {exposure.netExposure.toLocaleString()}
      </span>
    </div>
  );
}

export function ForexRiskCalculator() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [newPair, setNewPair] = useState(ALL_PAIRS[0]);
  const [newDirection, setNewDirection] = useState<Direction>('long');
  const [newNotional, setNewNotional] = useState('100000');

  const addPosition = useCallback(() => {
    if (positions.length >= MAX_POSITIONS) return;
    const notionalVal = parseFloat(newNotional);
    if (isNaN(notionalVal) || notionalVal <= 0) return;

    setPositions((prev) => [
      ...prev,
      {
        id: generateId(),
        pair: newPair,
        direction: newDirection,
        notional: notionalVal,
      },
    ]);
  }, [positions.length, newPair, newDirection, newNotional]);

  const removePosition = useCallback((id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Calculate net currency exposure
  const exposures = useMemo((): CurrencyExposure[] => {
    const map = new Map<string, number>();

    for (const pos of positions) {
      const { base, quote } = parsePair(pos.pair);
      const sign = pos.direction === 'long' ? 1 : -1;
      const amount = pos.notional * sign;

      // Long a pair = long base, short quote
      map.set(base, (map.get(base) ?? 0) + amount);
      map.set(quote, (map.get(quote) ?? 0) - amount);
    }

    return Array.from(map.entries())
      .map(([currency, netExposure]) => ({ currency, netExposure }))
      .sort((a, b) => b.netExposure - a.netExposure);
  }, [positions]);

  const maxAbsExposure = useMemo(() => {
    if (exposures.length === 0) return 0;
    return Math.max(...exposures.map((e) => Math.abs(e.netExposure)), 1);
  }, [exposures]);

  const totalGross = useMemo(() => {
    return positions.reduce((sum, p) => sum + p.notional, 0);
  }, [positions]);

  return (
    <div className="space-y-4">
      {/* Add position form */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Portfolio Risk Calculator
        </h3>

        <div className="flex flex-wrap items-end gap-2">
          {/* Pair selector */}
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">Pair</label>
            <select
              value={newPair}
              onChange={(e) => setNewPair(e.target.value)}
              className="text-xs bg-muted border border-border rounded-md px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {ALL_PAIRS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Direction toggle */}
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">
              Direction
            </label>
            <div className="flex">
              <button
                onClick={() => setNewDirection('long')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-l-md border transition-colors',
                  newDirection === 'long'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
                )}
              >
                Long
              </button>
              <button
                onClick={() => setNewDirection('short')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-r-md border-t border-r border-b transition-colors',
                  newDirection === 'short'
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
                )}
              >
                Short
              </button>
            </div>
          </div>

          {/* Notional */}
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">
              Notional
            </label>
            <input
              type="number"
              value={newNotional}
              onChange={(e) => setNewNotional(e.target.value)}
              min={1}
              step={10000}
              className="text-xs bg-muted border border-border rounded-md px-2 py-1.5 w-28 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="100000"
            />
          </div>

          {/* Add button */}
          <button
            onClick={addPosition}
            disabled={positions.length >= MAX_POSITIONS}
            className={cn(
              'inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              positions.length >= MAX_POSITIONS
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>

        {positions.length >= MAX_POSITIONS && (
          <p className="text-[10px] text-amber-400 mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Maximum {MAX_POSITIONS} positions reached
          </p>
        )}
      </div>

      {/* Positions list */}
      {positions.length > 0 && (
        <div className="rounded-lg border border-border bg-card">
          <div className="px-4 py-2.5 border-b border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">
                Positions ({positions.length}/{MAX_POSITIONS})
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Gross: {totalGross.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="divide-y divide-border/20">
            {positions.map((pos) => (
              <div
                key={pos.id}
                className="flex items-center gap-3 px-4 py-2 hover:bg-muted/20 transition-colors"
              >
                <span
                  className={cn(
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase',
                    pos.direction === 'long'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-rose-500/15 text-rose-400'
                  )}
                >
                  {pos.direction}
                </span>
                <span className="text-xs font-medium flex-1">{pos.pair}</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {pos.notional.toLocaleString()}
                </span>
                <button
                  onClick={() => removePosition(pos.id)}
                  className="text-muted-foreground hover:text-rose-400 transition-colors p-0.5"
                  title="Remove position"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Net Exposure summary */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="text-xs font-semibold mb-3">Net Currency Exposure</h4>

        {exposures.length === 0 ? (
          <div className="text-center py-6">
            <Calculator className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Add positions above to see net exposure per currency
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {exposures.map((exp) => (
              <ExposureBar
                key={exp.currency}
                exposure={exp}
                maxAbsExposure={maxAbsExposure}
              />
            ))}
          </div>
        )}

        {exposures.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-muted-foreground">Net Long</span>
                <p className="font-mono font-semibold text-emerald-400">
                  {exposures
                    .filter((e) => e.netExposure > 0)
                    .reduce((s, e) => s + e.netExposure, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Net Short</span>
                <p className="font-mono font-semibold text-rose-400">
                  {exposures
                    .filter((e) => e.netExposure < 0)
                    .reduce((s, e) => s + e.netExposure, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Explanation */}
      <p className="text-[10px] text-muted-foreground">
        Client-side calculation. Long a pair = long base currency, short quote currency.
        Net exposure sums all positions per currency to show concentration risk.
      </p>
    </div>
  );
}
