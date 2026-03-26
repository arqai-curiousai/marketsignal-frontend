'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrencyCorrelation } from '@/src/lib/api/analyticsApi';
import type { ICurrencyCorrelationMatrix } from '@/src/types/analytics';

const PAIR_SHORT: Record<string, string> = {
  'USD/INR': 'USD',
  'EUR/INR': 'EUR',
  'GBP/INR': 'GBP',
  'JPY/INR': 'JPY',
  'AED/INR': 'AED',
};

function corrColor(v: number): string {
  if (v >= 0.7) return 'bg-blue-600/80 text-white';
  if (v >= 0.3) return 'bg-blue-400/50 text-white';
  if (v >= -0.3) return 'bg-muted text-muted-foreground';
  if (v >= -0.7) return 'bg-orange-400/50 text-white';
  return 'bg-orange-600/80 text-white';
}

export function CurrencyCorrelationMini() {
  const [matrix, setMatrix] = useState<ICurrencyCorrelationMatrix | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const fetchCorrelation = async () => {
      try {
        const res = await getCurrencyCorrelation();
        if (!controller.signal.aborted && res.success) setMatrix(res.data);
      } catch {
        // silent
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchCorrelation();
    return () => controller.abort();
  }, []);

  if (loading) {
    return <Skeleton className="h-48 rounded-lg" />;
  }

  if (!matrix?.tickers?.length) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
        <h3 className="text-sm font-medium mb-2">INR Cross Correlation</h3>
        <p className="text-xs text-muted-foreground">No correlation data available</p>
      </div>
    );
  }

  const tickers = matrix.tickers;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.1)]">
      <h3 className="text-sm font-medium mb-3">INR Cross Correlation</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="p-1 text-left text-muted-foreground" />
              {tickers.map(t => (
                <th key={t} className="p-1 text-center text-muted-foreground font-medium">
                  {PAIR_SHORT[t] || t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickers.map((row, ri) => (
              <tr key={row}>
                <td className="p-1 text-muted-foreground font-medium">
                  {PAIR_SHORT[row] || row}
                </td>
                {tickers.map((col, ci) => {
                  const val = matrix.matrix?.[ri]?.[ci] ?? 0;
                  return (
                    <td key={col} className="p-1 text-center">
                      <span
                        className={`inline-block w-10 py-0.5 rounded text-[10px] font-mono ${corrColor(val)}`}
                        title={`${row} × ${col}: ${val.toFixed(2)}`}
                      >
                        {ri === ci ? '1.00' : val.toFixed(2)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
