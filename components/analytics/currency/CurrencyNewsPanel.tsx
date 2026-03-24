'use client';

import { useState, useEffect } from 'react';
import { Newspaper } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { searchNews } from '@/src/lib/api/analyticsApi';
import type { INewsArticle } from '@/src/types/analytics';

interface Props {
  pair: string;
}

export function CurrencyNewsPanel({ pair }: Props) {
  const [news, setNews] = useState<INewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        // Build search query from pair currencies + common forex terms
        const [base, quote] = pair.split('/');
        const query = `forex currency ${base} ${quote} rupee exchange rate`;
        const res = await searchNews(query, 8, 'FX');
        if (res.success && res.data?.items) {
          setNews(res.data.items);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [pair]);

  if (loading) {
    return <Skeleton className="h-32 rounded-lg" />;
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
      <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
        <Newspaper className="h-3.5 w-3.5" />
        Currency News
      </h3>
      {news.length === 0 ? (
        <p className="text-xs text-muted-foreground">No currency-related news found</p>
      ) : (
        <div className="space-y-2">
          {news.map((item, i) => (
            <div key={i} className="flex items-start justify-between gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
              <div className="flex-1 min-w-0">
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium hover:text-primary transition-colors line-clamp-2"
                  >
                    {item.headline}
                  </a>
                ) : (
                  <p className="text-xs font-medium line-clamp-2">{item.headline}</p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{item.source}</span>
                  {item.sentiment && (
                    <span className={`text-[10px] ${
                      item.sentiment === 'BULLISH' || item.sentiment === 'VERY_BULLISH'
                        ? 'text-emerald-500'
                        : item.sentiment === 'BEARISH' || item.sentiment === 'VERY_BEARISH'
                        ? 'text-red-500'
                        : 'text-muted-foreground'
                    }`}>
                      {item.sentiment}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
