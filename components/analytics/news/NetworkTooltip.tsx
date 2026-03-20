'use client';

import React from 'react';
import {
  getSentimentColor,
  getSourceDisplayName,
  formatTimeAgo,
  THEME_COLORS,
  THEME_LABELS,
} from './constants';

interface TooltipNode {
  id: string;
  type: 'article' | 'ticker' | 'theme';
  label: string;
  sentiment: string | null;
  sentiment_score: number | null;
  published_at: string | null;
  source: string | null;
  article_count: number | null;
}

interface NetworkTooltipProps {
  node: TooltipNode;
  x: number;
  y: number;
  containerWidth: number;
  containerHeight: number;
  /** Connected nodes grouped by type for ticker/theme context */
  connectedThemes?: string[];
  connectedTickers?: string[];
  sentimentBreakdown?: { bullish: number; bearish: number; neutral: number };
  onFocus?: () => void;
}

export function NetworkTooltip({
  node,
  x,
  y,
  containerWidth,
  containerHeight,
  connectedThemes,
  connectedTickers,
  sentimentBreakdown,
  onFocus,
}: NetworkTooltipProps) {
  const themeKey = (node.id || '').replace('theme:', '');
  const themeLabel = THEME_LABELS[themeKey] || themeKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Clamp position to stay within container
  const left = Math.min(x + 14, containerWidth - 280);
  const top = Math.max(Math.min(y - 20, containerHeight - 200), 8);

  return (
    <div
      className="absolute z-30"
      style={{ left, top, pointerEvents: onFocus ? 'auto' : 'none' }}
    >
      <div className="px-3 py-2.5 rounded-lg bg-[#0f172a]/95 border border-white/10 backdrop-blur-md shadow-2xl max-w-[270px] min-w-[180px]">
        {/* Header */}
        <div className="flex items-start gap-2 mb-1.5">
          {node.type === 'ticker' ? (
            <span className="shrink-0 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
              {node.label}
            </span>
          ) : node.type === 'theme' ? (
            <span
              className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold"
              style={{
                backgroundColor: (THEME_COLORS[themeKey] || '#64748B') + '25',
                color: THEME_COLORS[themeKey] || '#94A3B8',
              }}
            >
              {themeLabel}
            </span>
          ) : (
            <p className="text-[11px] text-white font-medium leading-tight">
              {node.label}
            </p>
          )}
        </div>

        {/* Article metadata */}
        {node.type === 'article' && (
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground mb-1">
            {node.source && <span>{getSourceDisplayName(node.source)}</span>}
            {node.published_at && <span>{formatTimeAgo(node.published_at)}</span>}
          </div>
        )}

        {/* Sentiment indicator */}
        {node.sentiment_score != null && node.type === 'article' && (
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: getSentimentColor(node.sentiment, node.sentiment_score) }}
            />
            <span className="text-[9px] text-muted-foreground capitalize">
              {node.sentiment?.replace('_', ' ') || 'neutral'}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground">
              {node.sentiment_score >= 0 ? '+' : ''}{node.sentiment_score.toFixed(2)}
            </span>
          </div>
        )}

        {/* Article count */}
        {node.article_count != null && node.article_count > 0 && node.type !== 'article' && (
          <div className="text-[9px] text-muted-foreground mb-1">
            {node.article_count} article{node.article_count !== 1 ? 's' : ''}
          </div>
        )}

        {/* Sentiment breakdown for ticker/theme */}
        {sentimentBreakdown && (node.type === 'ticker' || node.type === 'theme') && (
          <div className="flex items-center gap-2 text-[9px] mb-1">
            {sentimentBreakdown.bullish > 0 && (
              <span className="text-emerald-400">{sentimentBreakdown.bullish} bullish</span>
            )}
            {sentimentBreakdown.bearish > 0 && (
              <span className="text-red-400">{sentimentBreakdown.bearish} bearish</span>
            )}
            {sentimentBreakdown.neutral > 0 && (
              <span className="text-slate-400">{sentimentBreakdown.neutral} neutral</span>
            )}
          </div>
        )}

        {/* Connected themes (for tickers) */}
        {connectedThemes && connectedThemes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {connectedThemes.slice(0, 4).map((t) => {
              const key = t.replace('theme:', '');
              return (
                <span
                  key={t}
                  className="px-1 py-0.5 rounded text-[8px] font-medium"
                  style={{
                    backgroundColor: (THEME_COLORS[key] || '#64748B') + '20',
                    color: THEME_COLORS[key] || '#94A3B8',
                  }}
                >
                  {THEME_LABELS[key] || key}
                </span>
              );
            })}
          </div>
        )}

        {/* Connected tickers (for themes) */}
        {connectedTickers && connectedTickers.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {connectedTickers.slice(0, 5).map((t) => (
              <span
                key={t}
                className="px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[8px] font-mono"
              >
                {t.replace('ticker:', '')}
              </span>
            ))}
          </div>
        )}

        {/* Focus button */}
        {onFocus && (node.type === 'ticker' || node.type === 'theme') && (
          <button
            onClick={(e) => { e.stopPropagation(); onFocus(); }}
            className="mt-1.5 text-[9px] text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Focus on this &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
