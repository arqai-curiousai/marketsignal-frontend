'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getCommoditySeasonality } from '@/src/lib/api/analyticsApi';
import type { ICommoditySeasonality } from '@/src/types/analytics';

interface Props {
  commodity: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function returnColor(v: number): string {
  if (v >= 3) return 'bg-emerald-600/80 text-white';
  if (v >= 1) return 'bg-emerald-400/40 text-emerald-100';
  if (v >= -1) return 'bg-muted text-muted-foreground';
  if (v >= -3) return 'bg-red-400/40 text-red-100';
  return 'bg-red-600/80 text-white';
}

export function CommoditySeasonality({ commodity }: Props) {
  const [data, setData] = useState<ICommoditySeasonality | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getCommoditySeasonality(commodity);
        if (res.success) setData(res.data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [commodity]);

  if (loading) {
    return <Skeleton className="h-48 rounded-lg" />;
  }

  if (!data?.monthly_returns?.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium mb-2">Monthly Seasonality</h3>
        <p className="text-xs text-muted-foreground">No seasonality data available yet</p>
      </div>
    );
  }

  const rows = [
    { label: '5Y Avg', key: 'avg_5y' as const },
    { label: '3Y Avg', key: 'avg_3y' as const },
    { label: '1Y', key: 'avg_1y' as const },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium mb-3">Monthly Seasonality — {commodity}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr>
              <th className="p-1 text-left text-muted-foreground" />
              {MONTHS.map(m => (
                <th key={m} className="p-1 text-center text-muted-foreground font-medium">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label}>
                <td className="p-1 text-muted-foreground font-medium whitespace-nowrap">
                  {row.label}
                </td>
                {data.monthly_returns.map((mr, i) => {
                  const val = mr[row.key] ?? 0;
                  return (
                    <td key={i} className="p-0.5 text-center">
                      <span
                        className={`inline-block w-full py-0.5 rounded text-[9px] font-mono ${returnColor(val)}`}
                        title={`${MONTHS[i]}: ${val.toFixed(1)}%`}
                      >
                        {val > 0 ? '+' : ''}{val.toFixed(1)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">
        Green = positive avg return, Red = negative avg return (%)
      </p>
    </div>
  );
}
