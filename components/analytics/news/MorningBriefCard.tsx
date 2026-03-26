'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sunrise, Sun, Moon, TrendingUp, TrendingDown, Minus, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import type { IMorningBrief } from '@/types/analytics';
import { getSentimentColor } from './constants';

interface MorningBriefCardProps {
  brief: IMorningBrief | null;
  loading: boolean;
  dismissed: boolean;
  onDismiss: () => void;
}

const BRIEF_ICONS: Record<string, React.ReactNode> = {
  morning: <Sunrise className="w-4 h-4 text-amber-400/70" />,
  midday: <Sun className="w-4 h-4 text-yellow-400/70" />,
  evening: <Moon className="w-4 h-4 text-indigo-400/70" />,
};

const BRIEF_LABELS: Record<string, string> = {
  morning: 'Morning Brief',
  midday: 'Market Update',
  evening: 'Evening Wrap',
};

const DIRECTION_ICONS: Record<string, React.ReactNode> = {
  up: <TrendingUp className="w-3 h-3" />,
  down: <TrendingDown className="w-3 h-3" />,
  flat: <Minus className="w-3 h-3" />,
};

const DIRECTION_COLORS: Record<string, string> = {
  up: 'text-emerald-400',
  down: 'text-red-400',
  flat: 'text-white/40',
};

const OUTLOOK_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  bullish: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  bearish: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  neutral: { bg: 'bg-white/[0.04]', text: 'text-white/40', dot: 'bg-white/30' },
};

/**
 * MorningBriefCard — Bloomberg-style "5 Things Before the Bell"
 *
 * Time-aware: Morning Brief (pre-market) / Market Update (midday) / Evening Wrap (post-close).
 * Shows key numbers, AI narrative, sector outlook, and watch list.
 * Zen: single card, expandable sections, fades gracefully on dismiss.
 */
export function MorningBriefCard({ brief, loading, dismissed, onDismiss }: MorningBriefCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (dismissed) return null;

  if (loading) {
    return (
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-white/[0.06] animate-pulse" />
          <div className="h-3 w-28 rounded bg-white/[0.06] animate-pulse" />
        </div>
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-10 rounded bg-white/[0.04] animate-pulse" />
          ))}
        </div>
        <div className="h-3 w-full rounded bg-white/[0.04] animate-pulse" />
        <div className="h-3 w-3/4 rounded bg-white/[0.04] animate-pulse" />
      </div>
    );
  }

  if (!brief) return null;

  const briefType = brief.brief_type || 'morning';
  const sentimentColor = getSentimentColor(brief.market_sentiment);
  const hasKeyNumbers = brief.key_numbers && brief.key_numbers.length > 0;
  const hasSectorOutlook = brief.sector_outlook && Object.keys(brief.sector_outlook).length > 0;
  const hasWatchList = brief.watch_list && brief.watch_list.length > 0;
  const hasExtras = hasSectorOutlook || hasWatchList;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="group relative rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden"
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-0">
          {BRIEF_ICONS[briefType]}
          <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
            {BRIEF_LABELS[briefType]}
          </span>
          <span
            className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${sentimentColor}15`,
              color: sentimentColor,
            }}
          >
            {brief.market_sentiment}
          </span>
          <button
            onClick={onDismiss}
            className="text-white/20 hover:text-white/50 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Dismiss brief"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Key Numbers Bar ────────────────────────────────── */}
        {hasKeyNumbers && (
          <div className="flex gap-1 px-4 pt-2.5 pb-0 overflow-x-auto scrollbar-none">
            {brief.key_numbers?.map((kn, i) => {
              const dir = kn.direction || 'flat';
              return (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.05] shrink-0"
                >
                  <span className="text-[10px] text-white/35 whitespace-nowrap">{kn.label}</span>
                  <span className="text-[11px] text-white/70 font-medium tabular-nums">{kn.value}</span>
                  <span className={`flex items-center gap-0.5 text-[10px] ${DIRECTION_COLORS[dir]}`}>
                    {DIRECTION_ICONS[dir]}
                    <span className="tabular-nums">{kn.change}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Narrative ──────────────────────────────────────── */}
        <div className="px-4 pt-2.5 pb-3">
          <p className={`text-[13px] text-white/70 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
            {brief.narrative}
          </p>
        </div>

        {/* ── Top Stories Chips ───────────────────────────────── */}
        {brief.top_stories && brief.top_stories.length > 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-1.5">
            {brief.top_stories.slice(0, 4).map((headline, i) => (
              <span
                key={i}
                className="text-[10px] text-white/40 bg-white/[0.04] rounded-md px-2 py-0.5 truncate max-w-[200px]"
              >
                {headline}
              </span>
            ))}
          </div>
        )}

        {/* ── Expandable Sections ────────────────────────────── */}
        {hasExtras && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-label={expanded ? 'Collapse details' : 'Expand details'}
              className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-white/25 hover:text-white/40 transition-colors border-t border-white/[0.04]"
            >
              {expanded ? (
                <>Less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Sectors & Watch List <ChevronDown className="w-3 h-3" /></>
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
                  <div className="px-4 pb-3 space-y-3">
                    {/* ── Sector Outlook Strip ─────────────────── */}
                    {hasSectorOutlook && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-white/25 mb-1.5">
                          Sector Outlook
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {brief.sector_outlook && Object.entries(brief.sector_outlook).map(([sector, outlook]) => {
                            const style = OUTLOOK_COLORS[outlook] || OUTLOOK_COLORS.neutral;
                            return (
                              <div
                                key={sector}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${style.bg}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                <span className={`text-[10px] font-medium ${style.text}`}>
                                  {sector}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── Watch List ────────────────────────────── */}
                    {hasWatchList && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Eye className="w-3 h-3 text-white/25" />
                          <span className="text-[10px] uppercase tracking-wider text-white/25">
                            Watch List
                          </span>
                        </div>
                        <div className="space-y-1">
                          {brief.watch_list?.slice(0, 5).map((item, i) => {
                            const sentColor = getSentimentColor(item.sentiment);
                            return (
                              <div
                                key={i}
                                className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/[0.02]"
                              >
                                <span className="text-[11px] font-medium text-white/60 w-20 shrink-0">
                                  {item.ticker}
                                </span>
                                <span className="text-[10px] text-white/40 flex-1 truncate">
                                  {item.reason}
                                </span>
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: sentColor }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── Theme Breakdown ───────────────────────── */}
                    {brief.theme_breakdown && Object.keys(brief.theme_breakdown).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(brief.theme_breakdown).map(([theme, count]) => (
                          <span
                            key={theme}
                            className="text-[10px] text-white/30 bg-white/[0.03] rounded px-1.5 py-0.5"
                          >
                            {theme.replace(/_/g, ' ')} <span className="text-white/50">{count}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
