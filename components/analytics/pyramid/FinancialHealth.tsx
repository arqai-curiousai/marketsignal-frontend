'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { IQuarterlyFinancial } from './constants';

function toNumber(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

interface FinancialHealthProps {
  income: IQuarterlyFinancial[];
  balance: IQuarterlyFinancial[];
}

function QuarterLabel({ q }: { q: IQuarterlyFinancial }) {
  return (
    <span className="text-[9px] text-muted-foreground">
      Q{q.fiscal_quarter ?? '?'} FY{String(q.fiscal_year).slice(-2)}
    </span>
  );
}

function MiniBarChart({
  label,
  values,
  quarters,
}: {
  label: string;
  values: (number | null)[];
  quarters: IQuarterlyFinancial[];
}) {
  const max = Math.max(...values.filter((v): v is number => v != null).map(Math.abs), 1);

  return (
    <div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <div className="flex items-end gap-1 h-10 mt-1">
        {values.map((val, i) => {
          const pct = val != null ? (Math.abs(val) / max) * 100 : 0;
          const isPositive = val != null && val >= 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full relative h-8 flex items-end">
                {val != null && (
                  <div
                    className={cn(
                      'w-full rounded-t-sm transition-all duration-500',
                      isPositive ? 'bg-emerald-500/50' : 'bg-red-500/50',
                    )}
                    style={{ height: `${Math.max(pct, 8)}%` }}
                  />
                )}
              </div>
              <QuarterLabel q={quarters[i]} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FinancialHealth({ income, balance }: FinancialHealthProps) {
  if (income.length === 0 && balance.length === 0) {
    return (
      <div className="text-xs text-muted-foreground py-2">
        No quarterly financial data available.
      </div>
    );
  }

  // Extract revenue/profit from income statements
  const revValues = income.map(
    (q) => toNumber(q.data.total_revenue ?? q.data.revenue ?? null),
  );
  const profitValues = income.map(
    (q) => toNumber(q.data.net_income ?? q.data.profit ?? null),
  );

  // Extract D/E from balance sheet
  const deValues = balance.map((q) => {
    const debt = toNumber(q.data.total_debt ?? q.data.long_term_debt) ?? 0;
    const equity = toNumber(q.data.total_equity ?? q.data.stockholders_equity) ?? 1;
    return equity !== 0 ? debt / equity : null;
  });

  return (
    <div>
      <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
        Quarterly Financials
      </h4>
      <div className="space-y-4">
        {revValues.some((v) => v != null) && (
          <MiniBarChart label="Revenue" values={revValues} quarters={income} />
        )}
        {profitValues.some((v) => v != null) && (
          <MiniBarChart label="Net Profit" values={profitValues} quarters={income} />
        )}
        {deValues.some((v) => v != null) && (
          <div>
            <span className="text-[10px] text-muted-foreground">Debt/Equity Ratio</span>
            <div className="flex items-center gap-2 mt-1">
              {deValues.map((val, i) => (
                <div key={i} className="flex-1 text-center">
                  <span
                    className={cn(
                      'text-xs font-medium tabular-nums',
                      val != null && val > 1
                        ? 'text-red-400'
                        : val != null && val > 0.5
                          ? 'text-amber-400'
                          : 'text-emerald-400',
                    )}
                  >
                    {val != null ? val.toFixed(2) : '—'}
                  </span>
                  <br />
                  <QuarterLabel q={balance[i]} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
