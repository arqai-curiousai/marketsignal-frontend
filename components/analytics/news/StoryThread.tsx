'use client';

import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitBranch, Clock } from 'lucide-react';
import * as FocusScope from '@radix-ui/react-focus-scope';
import type { IStoryArc } from '@/types/analytics';
import { THEME_COLORS, THEME_LABELS, formatTimeAgo, getSentimentColor } from './constants';

interface StoryThreadProps {
  story: IStoryArc | null;
  open: boolean;
  onClose: () => void;
}

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
  breaking: { label: 'Breaking', color: '#EF4444' },
  developing: { label: 'Developing', color: '#F59E0B' },
  analysis: { label: 'Analysis', color: '#818CF8' },
  reaction: { label: 'Market Reaction', color: '#FB923C' },
  concluded: { label: 'Concluded', color: '#64748B' },
};

const PHASE_ORDER = ['breaking', 'developing', 'analysis', 'reaction', 'concluded'];

/**
 * StoryThread — slide-over panel showing the chronological
 * narrative arc of a news story with vertical timeline,
 * sentiment dots, and phase transition markers.
 */
export function StoryThread({ story, open, onClose }: StoryThreadProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Build sentiment sparkline from trajectory
  const sparkline = useMemo(() => {
    if (!story?.sentiment_trajectory || story.sentiment_trajectory.length < 2) return '';
    const w = 280;
    const h = 32;
    const pad = 4;
    const points = story.sentiment_trajectory;
    return points
      .map((p, i) => {
        const x = pad + (i / (points.length - 1)) * (w - pad * 2);
        const clamped = Math.max(-1, Math.min(1, p.score));
        const y = pad + ((1 - clamped) / 2) * (h - pad * 2);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [story?.sentiment_trajectory]);

  // Avg sentiment for sparkline color
  const avgSent = useMemo(() => {
    if (!story?.sentiment_trajectory?.length) return 0;
    return story.sentiment_trajectory.reduce((s, p) => s + p.score, 0) / story.sentiment_trajectory.length;
  }, [story?.sentiment_trajectory]);

  if (!story) return null;

  const themeColor = THEME_COLORS[story.primary_theme] || '#94A3B8';
  const phase = PHASE_LABELS[story.story_phase] || PHASE_LABELS.developing;
  const currentPhaseIdx = PHASE_ORDER.indexOf(story.story_phase);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />

          {/* Slide-over panel */}
          <FocusScope.Root trapped asChild>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={story ? `Story Thread: ${story.story_label}` : 'Story Thread'}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[420px] bg-[#0d1117] border-l border-white/[0.08] z-50 overflow-y-auto"
          >
            {/* ── Header ───────────────────────────────────────── */}
            <div className="sticky top-0 bg-[#0d1117]/95 backdrop-blur-md border-b border-white/[0.06] p-4 z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-white/30" />
                  <span className="text-xs text-white/40">Story Thread</span>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/30 hover:text-white/60 p-1"
                  aria-label="Close story thread"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-sm font-semibold text-white/80 leading-snug mb-2">
                {story.story_label}
              </h2>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Phase badge — pulsing for breaking */}
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    story.story_phase === 'breaking' ? 'animate-pulse' : ''
                  }`}
                  style={{
                    backgroundColor: `${phase.color}20`,
                    color: phase.color,
                    border: `1px solid ${phase.color}30`,
                  }}
                >
                  {phase.label}
                </span>

                {/* Theme badge */}
                <span
                  className="px-2 py-0.5 rounded-full text-[10px]"
                  style={{
                    backgroundColor: `${themeColor}15`,
                    color: `${themeColor}CC`,
                    border: `1px solid ${themeColor}25`,
                  }}
                >
                  {THEME_LABELS[story.primary_theme] || story.primary_theme}
                </span>

                {/* Article count */}
                <span className="text-[10px] text-white/25">
                  {story.article_count} articles
                </span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* ── Phase Progress ───────────────────────────── */}
              <div className="flex items-center gap-1">
                {PHASE_ORDER.map((p, i) => {
                  const phaseMeta = PHASE_LABELS[p];
                  const isActive = i <= currentPhaseIdx;
                  const isCurrent = p === story.story_phase;
                  return (
                    <React.Fragment key={p}>
                      <div
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium transition-all"
                        style={{
                          backgroundColor: isActive ? `${phaseMeta.color}15` : 'rgba(255,255,255,0.02)',
                          color: isActive ? phaseMeta.color : 'rgba(255,255,255,0.15)',
                          outline: isCurrent ? `1px solid ${phaseMeta.color}40` : undefined,
                          outlineOffset: '-1px',
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: isActive ? phaseMeta.color : 'rgba(255,255,255,0.1)',
                          }}
                        />
                        {phaseMeta.label}
                      </div>
                      {i < PHASE_ORDER.length - 1 && (
                        <div
                          className="w-2 h-px"
                          style={{
                            backgroundColor: isActive ? phaseMeta.color : 'rgba(255,255,255,0.06)',
                            opacity: isActive ? 0.4 : 1,
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* ── Narrative ────────────────────────────────── */}
              {story.narrative && (
                <div className="text-sm text-white/50 leading-relaxed whitespace-pre-line">
                  {story.narrative}
                </div>
              )}

              {/* ── Sentiment Arc Sparkline ───────────────────── */}
              {story.sentiment_trajectory && story.sentiment_trajectory.length > 1 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/25 mb-2">
                    Sentiment Arc
                  </div>
                  <div className="rounded-md bg-white/[0.02] border border-white/[0.05] p-2">
                    <svg width="100%" height={32} viewBox="0 0 280 32" preserveAspectRatio="none">
                      {/* Zero line */}
                      <line x1={0} y1={16} x2={280} y2={16} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
                      {/* Path */}
                      <path
                        d={sparkline}
                        fill="none"
                        stroke={avgSent > 0.15 ? '#10B981' : avgSent < -0.15 ? '#EF4444' : '#94A3B8'}
                        strokeWidth={1.5}
                        strokeLinejoin="round"
                        opacity={0.7}
                      />
                      {/* Dots at each data point */}
                      {story.sentiment_trajectory.map((p, i) => {
                        const x = 4 + (i / (story.sentiment_trajectory.length - 1)) * 272;
                        const clamped = Math.max(-1, Math.min(1, p.score));
                        const y = 4 + ((1 - clamped) / 2) * 24;
                        const dotColor = p.score > 0.15 ? '#10B981' : p.score < -0.15 ? '#EF4444' : '#94A3B8';
                        return <circle key={i} cx={x} cy={y} r={2} fill={dotColor} opacity={0.6} />;
                      })}
                    </svg>
                    <div className="flex justify-between text-[9px] text-white/15 mt-1">
                      <span>First report</span>
                      <span>Latest</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Sentiment Bar Chart (fallback for <2 points) ─ */}
              {story.sentiment_trajectory && story.sentiment_trajectory.length === 1 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/25 mb-2">
                    Sentiment
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getSentimentColor(null, story.sentiment_trajectory[0].score) }}
                    />
                    <span className="text-xs text-white/40 tabular-nums">
                      {story.sentiment_trajectory[0].score > 0 ? '+' : ''}
                      {story.sentiment_trajectory[0].score.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* ── Price Context ────────────────────────────── */}
              {Object.keys(story.price_context).length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/25 mb-2">
                    Price Impact
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(story.price_context).map(([ticker, ctx]) => (
                      <div
                        key={ticker}
                        className="flex items-center justify-between px-3 py-1.5 rounded-md bg-white/[0.02] border border-white/[0.05]"
                      >
                        <span className="text-xs text-teal-400/70 font-medium">{ticker}</span>
                        <span
                          className={`text-xs font-medium tabular-nums ${
                            ctx.change_pct > 0
                              ? 'text-emerald-400'
                              : ctx.change_pct < 0
                                ? 'text-red-400'
                                : 'text-white/30'
                          }`}
                        >
                          {ctx.change_pct > 0 ? '+' : ''}{ctx.change_pct.toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Tickers ─────────────────────────────────── */}
              {story.tickers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {story.tickers.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] text-teal-400/60"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* ── Time Span ───────────────────────────────── */}
              <div className="flex items-center gap-1.5 text-[10px] text-white/20 pt-2 border-t border-white/[0.04]">
                <Clock className="w-3 h-3" />
                <span>First reported: {formatTimeAgo(story.first_article_at)}</span>
                <span>&middot;</span>
                <span>Latest: {formatTimeAgo(story.latest_article_at)}</span>
              </div>
            </div>
          </motion.div>
          </FocusScope.Root>
        </>
      )}
    </AnimatePresence>
  );
}
