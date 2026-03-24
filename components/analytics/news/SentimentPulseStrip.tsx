'use client';

import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Newspaper,
  Radio,
  Clock,
  Zap,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  THEME_COLORS,
  THEME_LABELS,
  SENTIMENT_THRESHOLDS,
  getSourceDisplayName,
} from './constants';
import type { INewsArticle } from '@/types/analytics';

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                         */
/* ═══════════════════════════════════════════════════════════════ */

interface SentimentPulseStripProps {
  articles: INewsArticle[];
  hours?: number;
}

interface TickerSentiment {
  ticker: string;
  avg: number;
  count: number;
  label: 'bullish' | 'bearish' | 'neutral';
}

interface SentimentDriver {
  theme: string;
  themeLabel: string;
  themeColor: string;
  direction: 'bullish' | 'bearish';
  avgScore: number;
  articleCount: number;
  headline: string;
}

interface SparkBucket {
  avgScore: number;
  count: number;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Constants                                                     */
/* ═══════════════════════════════════════════════════════════════ */

const MAX_VISIBLE_TICKERS = 14;

// Gauge geometry
const G_CX = 100;
const G_CY = 100;
const G_R = 78;
const G_STROKE = 8;

// Gauge zone definitions (from left/bearish to right/bullish)
const GAUGE_ZONES: { from: number; to: number; color: string }[] = [
  { from: 180, to: 144, color: '#EF4444' }, // Extreme Fear
  { from: 144, to: 117, color: '#F87171' }, // Fear
  { from: 117, to: 63, color: '#64748B' },  // Neutral
  { from: 63, to: 36, color: '#6EE7B7' },   // Optimism
  { from: 36, to: 0, color: '#10B981' },     // Strong Optimism
];

/* ═══════════════════════════════════════════════════════════════ */
/*  Pure helpers                                                  */
/* ═══════════════════════════════════════════════════════════════ */

function getMoodLabel(score: number): string {
  if (score > 0.6) return 'Strong Optimism';
  if (score > 0.35) return 'Bullish Sentiment';
  if (score > SENTIMENT_THRESHOLDS.BULLISH) return 'Cautiously Optimistic';
  if (score > SENTIMENT_THRESHOLDS.BEARISH) return 'Mixed Signals';
  if (score > -0.35) return 'Growing Caution';
  if (score > -0.6) return 'Fear Rising';
  return 'Extreme Fear';
}

function getMomentumLabel(m: number): { label: string; direction: 'up' | 'down' | 'flat' } {
  if (m > 0.1) return { label: 'Shifting Bullish', direction: 'up' };
  if (m > 0.05) return { label: 'Improving', direction: 'up' };
  if (m > -0.05) return { label: 'Steady', direction: 'flat' };
  if (m > -0.1) return { label: 'Cooling', direction: 'down' };
  return { label: 'Turning Bearish', direction: 'down' };
}

function getMoodColor(score: number): string {
  if (score > 0.35) return '#10B981';
  if (score > SENTIMENT_THRESHOLDS.BULLISH) return '#6EE7B7';
  if (score > SENTIMENT_THRESHOLDS.BEARISH) return '#64748B';
  if (score > -0.35) return '#F87171';
  return '#EF4444';
}

/** SVG arc path for a semicircle. Angles: 180=left, 0=right, 90=top. */
function describeArc(startAngleDeg: number, endAngleDeg: number, r: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x1 = G_CX + r * Math.cos(Math.PI - toRad(startAngleDeg));
  const y1 = G_CY - r * Math.sin(Math.PI - toRad(startAngleDeg));
  const x2 = G_CX + r * Math.cos(Math.PI - toRad(endAngleDeg));
  const y2 = G_CY - r * Math.sin(Math.PI - toRad(endAngleDeg));
  const sweep = startAngleDeg - endAngleDeg;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/** Map score [-1,+1] → angle [180°,0°] on the semicircle. */
function scoreToAngle(score: number): number {
  const clamped = Math.max(-1, Math.min(1, score));
  return 90 - clamped * 90;
}

/** Needle tip position for a given angle. */
function needleTip(angleDeg: number, r: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: G_CX + r * Math.cos(Math.PI - rad),
    y: G_CY - r * Math.sin(Math.PI - rad),
  };
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Sub-components                                                */
/* ═══════════════════════════════════════════════════════════════ */

/** Semicircular arc gauge — Fear & Greed style. */
function MoodGauge({
  score,
  momentum,
  reduced,
}: {
  score: number;
  momentum: number;
  reduced: boolean;
}) {
  const angleDeg = scoreToAngle(score);
  const tip = needleTip(angleDeg, G_R);
  const moodColor = getMoodColor(score);
  const momInfo = getMomentumLabel(momentum);
  const momColor =
    momInfo.direction === 'up'
      ? '#6EE7B7'
      : momInfo.direction === 'down'
        ? '#F87171'
        : 'rgba(255,255,255,0.25)';

  return (
    <div className="flex flex-col items-center shrink-0 w-[160px] md:w-[180px]">
      <svg
        viewBox="0 0 200 110"
        className="w-full"
        aria-label={`Market mood gauge: ${getMoodLabel(score)}`}
      >
        {/* Background track */}
        <path
          d={describeArc(180, 0, G_R)}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={G_STROKE}
          strokeLinecap="round"
        />

        {/* Zone segments */}
        {GAUGE_ZONES.map((zone, i) => (
          <path
            key={i}
            d={describeArc(zone.from, zone.to, G_R)}
            fill="none"
            stroke={zone.color}
            strokeWidth={G_STROKE}
            strokeLinecap="round"
            opacity={0.2}
          />
        ))}

        {/* Active fill arc from center (90°) toward the score */}
        {Math.abs(score) > 0.02 && (
          <motion.path
            d={describeArc(
              score > 0 ? 90 : angleDeg,
              score > 0 ? angleDeg : 90,
              G_R
            )}
            fill="none"
            stroke={moodColor}
            strokeWidth={G_STROKE}
            strokeLinecap="round"
            opacity={0.6}
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        )}

        {/* Needle line */}
        <motion.line
          x1={G_CX}
          y1={G_CY}
          x2={reduced ? tip.x : undefined}
          y2={reduced ? tip.y : undefined}
          stroke={moodColor}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.9}
          initial={reduced ? false : { x2: G_CX, y2: G_CY - G_R }}
          animate={{ x2: tip.x, y2: tip.y }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        />

        {/* Needle tip dot */}
        <motion.circle
          r={4}
          fill={moodColor}
          initial={reduced ? { cx: tip.x, cy: tip.y } : { cx: G_CX, cy: G_CY - G_R }}
          animate={{ cx: tip.x, cy: tip.y }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        />

        {/* Glow pulse at needle tip */}
        {!reduced && (
          <motion.circle
            r={10}
            fill={moodColor}
            initial={{ cx: tip.x, cy: tip.y, opacity: 0.05 }}
            animate={{ cx: tip.x, cy: tip.y, opacity: [0.05, 0.15, 0.05] }}
            transition={{
              cx: { type: 'spring', stiffness: 80, damping: 20 },
              cy: { type: 'spring', stiffness: 80, damping: 20 },
              opacity: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
        )}

        {/* Center pivot dot */}
        <circle cx={G_CX} cy={G_CY} r={3} fill="rgba(255,255,255,0.15)" />
      </svg>

      {/* Mood label below gauge */}
      <div className="text-center -mt-1">
        <div className="text-[13px] font-semibold text-white/80 leading-tight">
          {getMoodLabel(score)}
        </div>
        <div
          className="flex items-center justify-center gap-1 mt-1 text-[10px] font-medium"
          style={{ color: momColor }}
        >
          {momInfo.direction === 'up' ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : momInfo.direction === 'down' ? (
            <ArrowDownRight className="h-3 w-3" />
          ) : (
            <ArrowRight className="h-3 w-3" />
          )}
          <span>{momInfo.label}</span>
        </div>
      </div>
    </div>
  );
}

/** Mini area sparkline with green/red split at zero line. */
function SentimentSparkline({
  buckets,
  reduced,
}: {
  buckets: SparkBucket[];
  reduced: boolean;
}) {
  if (buckets.length < 3) return null;

  const W = 240;
  const H = 48;
  const PAD = 4;

  const points = buckets.map((b, i) => {
    const x = PAD + (i / (buckets.length - 1)) * (W - PAD * 2);
    const clamped = Math.max(-1, Math.min(1, b.avgScore));
    const y = PAD + ((1 - clamped) / 2) * (H - PAD * 2);
    return { x, y };
  });

  const midY = H / 2;

  // Line path
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  // Area path (closed to baseline at zero)
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${midY.toFixed(1)} L ${points[0].x.toFixed(1)} ${midY.toFixed(1)} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[48px]" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkBull" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="sparkBear" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
          <clipPath id="clipAbove">
            <rect x={0} y={0} width={W} height={midY} />
          </clipPath>
          <clipPath id="clipBelow">
            <rect x={0} y={midY} width={W} height={H - midY} />
          </clipPath>
        </defs>

        {/* Zero line */}
        <line
          x1={PAD}
          y1={midY}
          x2={W - PAD}
          y2={midY}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
          strokeDasharray="4 3"
        />

        {/* Green area above zero */}
        <path d={areaPath} fill="url(#sparkBull)" clipPath="url(#clipAbove)" />

        {/* Red area below zero */}
        <path d={areaPath} fill="url(#sparkBear)" clipPath="url(#clipBelow)" />

        {/* Line stroke */}
        <motion.path
          d={linePath}
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        {/* Latest point dot */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={2.5}
          fill={buckets[buckets.length - 1].avgScore > 0 ? '#10B981' : buckets[buckets.length - 1].avgScore < 0 ? '#EF4444' : '#64748B'}
          opacity={0.8}
        />
      </svg>
    </div>
  );
}

/** Key driver mini card. */
function DriverCard({ driver, index, reduced }: { driver: SentimentDriver; index: number; reduced: boolean }) {
  const isBull = driver.direction === 'bullish';
  return (
    <motion.div
      className="flex flex-col gap-0.5 px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] min-w-[180px] md:min-w-0"
      style={{ borderLeftWidth: 3, borderLeftColor: driver.themeColor }}
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] uppercase tracking-wider font-medium" style={{ color: driver.themeColor }}>
          {driver.themeLabel}
        </span>
        <span className={`text-[9px] font-medium ${isBull ? 'text-emerald-400' : 'text-red-400'}`}>
          {isBull ? '↑ Bullish' : '↓ Bearish'}
        </span>
      </div>
      <div className="text-[11px] text-white/50 line-clamp-1 leading-snug">
        {driver.headline}
      </div>
      <span className="text-[9px] text-white/20 tabular-nums">
        {driver.articleCount} article{driver.articleCount !== 1 ? 's' : ''}
      </span>
    </motion.div>
  );
}

/** Ticker sentiment grid cell with tooltip. */
function TickerCell({
  ticker,
  reduced,
  index,
}: {
  ticker: TickerSentiment;
  reduced: boolean;
  index: number;
}) {
  const { avg, count, label } = ticker;
  const absScore = Math.abs(avg);

  const bgColor =
    label === 'bullish'
      ? `rgba(16,185,129,${Math.min(0.04 + absScore * 0.15, 0.2).toFixed(3)})`
      : label === 'bearish'
        ? `rgba(239,68,68,${Math.min(0.04 + absScore * 0.15, 0.2).toFixed(3)})`
        : 'rgba(255,255,255,0.02)';
  const borderColor =
    label === 'bullish'
      ? 'rgba(16,185,129,0.15)'
      : label === 'bearish'
        ? 'rgba(239,68,68,0.15)'
        : 'rgba(255,255,255,0.06)';
  const moodTextColor =
    label === 'bullish'
      ? 'text-emerald-400/80'
      : label === 'bearish'
        ? 'text-red-400/80'
        : 'text-white/30';
  const moodWord = label === 'bullish' ? 'Bullish' : label === 'bearish' ? 'Bearish' : 'Neutral';

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className="rounded-lg px-2.5 py-2 cursor-default transition-colors hover:brightness-125"
            style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}
            initial={reduced ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03, duration: 0.3 }}
          >
            <div className="text-[11px] font-mono font-semibold text-white/70 truncate">
              {ticker.ticker}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[9px] font-medium ${moodTextColor}`}>{moodWord}</span>
              <span className="text-[9px] text-white/15 tabular-nums">
                {count}
              </span>
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="px-2.5 py-1.5 text-[10px] font-mono tabular-nums bg-[#1a1f2e] border-white/[0.1]"
        >
          {ticker.ticker}: {avg > 0 ? '+' : ''}{avg.toFixed(2)} ({count} article{count !== 1 ? 's' : ''})
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Compact stat line. */
function StatLine({
  total,
  sourceCount,
  sourceNames,
  freshness,
  breakingCount,
}: {
  total: number;
  sourceCount: number;
  sourceNames: string[];
  freshness: string;
  breakingCount: number;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap text-[10px] text-white/35 tabular-nums">
      <span className="inline-flex items-center gap-1">
        <Newspaper className="h-3 w-3" />
        {total} articles
      </span>
      <span className="text-white/10">·</span>
      <span className="inline-flex items-center gap-1" title={sourceNames.join(', ')}>
        <Radio className="h-3 w-3" />
        {sourceCount} source{sourceCount !== 1 ? 's' : ''}
      </span>
      <span className="text-white/10">·</span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {freshness}
      </span>
      {breakingCount > 0 && (
        <>
          <span className="text-white/10">·</span>
          <span className="inline-flex items-center gap-1 text-amber-400/70">
            <Zap className="h-3 w-3" />
            {breakingCount} urgent
          </span>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Component                                                */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * SentimentPulseStrip — News Sentiment Intelligence Panel.
 *
 * Four-zone layout:
 *   Top-Left:   Mood Gauge (semicircular Fear → Greed arc)
 *   Top-Center: Sparkline + Distribution bar
 *   Top-Right:  Key Drivers (what's moving sentiment)
 *   Bottom:     Ticker Sentiment Grid (intensity-colored cells)
 */
export function SentimentPulseStrip({ articles, hours = 24 }: SentimentPulseStripProps) {
  const prefersReduced = useReducedMotion();
  const reduced = !!prefersReduced;

  const insights = useMemo(() => {
    if (!articles.length) return null;

    let total = 0;
    let counted = 0;
    let bull = 0;
    let neutral = 0;
    let bear = 0;
    const sourceSet = new Set<string>();
    const tickerMap = new Map<string, { sum: number; count: number }>();
    let newestAge = Infinity;
    let breakingCount = 0;

    const now = Date.now();
    const halfWindowMs = (hours * 60 * 60_000) / 2;
    const midpoint = now - halfWindowMs;
    let recentTotal = 0;
    let recentCount = 0;
    let olderTotal = 0;
    let olderCount = 0;

    // Theme tracking for key drivers
    const themeMap = new Map<string, { totalScore: number; count: number; bullish: number; bearish: number; headlines: string[] }>();

    // Sparkline bucketing
    const windowMs = hours * 3600_000;
    const bucketSizeMs = hours <= 12 ? 3600_000 : hours <= 48 ? 2 * 3600_000 : 4 * 3600_000;
    const bucketCount = Math.max(1, Math.ceil(windowMs / bucketSizeMs));
    const startMs = now - windowMs;
    const sparkRaw: Array<{ total: number; count: number }> = Array.from({ length: bucketCount }, () => ({ total: 0, count: 0 }));

    for (const a of articles) {
      const s = a.sentiment_score ?? 0;
      total += s;
      counted++;

      if (s > SENTIMENT_THRESHOLDS.BULLISH) bull++;
      else if (s < SENTIMENT_THRESHOLDS.BEARISH) bear++;
      else neutral++;

      if (a.source) sourceSet.add(a.source);

      // Ticker accumulation
      if (a.symbols) {
        for (const sym of a.symbols) {
          const existing = tickerMap.get(sym);
          if (existing) {
            existing.sum += s;
            existing.count++;
          } else {
            tickerMap.set(sym, { sum: s, count: 1 });
          }
        }
      }

      // Theme accumulation
      const themes = a.categories?.length ? a.categories : [];
      for (const theme of themes) {
        let entry = themeMap.get(theme);
        if (!entry) {
          entry = { totalScore: 0, count: 0, bullish: 0, bearish: 0, headlines: [] };
          themeMap.set(theme, entry);
        }
        entry.totalScore += s;
        entry.count++;
        if (s > SENTIMENT_THRESHOLDS.BULLISH) entry.bullish++;
        if (s < SENTIMENT_THRESHOLDS.BEARISH) entry.bearish++;
        if (entry.headlines.length < 2 && a.headline) {
          entry.headlines.push(a.headline.length > 65 ? a.headline.slice(0, 62) + '...' : a.headline);
        }
      }

      // Time-based bucketing
      if (a.published_at) {
        const pubMs = new Date(a.published_at).getTime();
        if (!isNaN(pubMs)) {
          const age = now - pubMs;
          if (age > 0 && age < newestAge) newestAge = age;
          if (pubMs >= midpoint) {
            recentTotal += s;
            recentCount++;
          } else {
            olderTotal += s;
            olderCount++;
          }

          // Sparkline bucket
          if (pubMs >= startMs) {
            const bi = Math.min(Math.floor((pubMs - startMs) / bucketSizeMs), bucketCount - 1);
            sparkRaw[bi].total += s;
            sparkRaw[bi].count++;
          }
        }
      }

      if (a.priority === 'breaking' || a.priority === 'high') breakingCount++;
    }

    const avgScore = counted > 0 ? total / counted : 0;
    const recentAvg = recentCount > 0 ? recentTotal / recentCount : 0;
    const olderAvg = olderCount > 0 ? olderTotal / olderCount : 0;
    const momentum = recentAvg - olderAvg;

    // Build ticker list
    const allTickers: TickerSentiment[] = [];
    tickerMap.forEach((val, ticker) => {
      const avg = val.sum / val.count;
      const label: TickerSentiment['label'] =
        avg > SENTIMENT_THRESHOLDS.BULLISH ? 'bullish' : avg < SENTIMENT_THRESHOLDS.BEARISH ? 'bearish' : 'neutral';
      allTickers.push({ ticker, avg, count: val.count, label });
    });
    allTickers.sort((a, b) => b.avg - a.avg || b.count - a.count);

    // Build sparkline buckets (carry-forward for empty)
    const sparkBuckets: SparkBucket[] = [];
    let lastVal = 0;
    for (const raw of sparkRaw) {
      if (raw.count > 0) {
        lastVal = raw.total / raw.count;
        sparkBuckets.push({ avgScore: lastVal, count: raw.count });
      } else {
        sparkBuckets.push({ avgScore: lastVal, count: 0 });
      }
    }

    // Build key drivers
    const drivers: SentimentDriver[] = [];
    const themeEntries = Array.from(themeMap.entries())
      .filter(([, v]) => v.count >= 2)
      .map(([theme, v]) => ({
        theme,
        avg: v.totalScore / v.count,
        count: v.count,
        headline: v.headlines[0] || '',
      }))
      .sort((a, b) => Math.abs(b.avg) - Math.abs(a.avg));

    const bullDrivers = themeEntries.filter((t) => t.avg > SENTIMENT_THRESHOLDS.BULLISH).slice(0, 2);
    const bearDrivers = themeEntries.filter((t) => t.avg < SENTIMENT_THRESHOLDS.BEARISH).slice(0, 2);

    for (const d of bullDrivers) {
      drivers.push({
        theme: d.theme,
        themeLabel: THEME_LABELS[d.theme] || d.theme,
        themeColor: THEME_COLORS[d.theme] || '#94A3B8',
        direction: 'bullish',
        avgScore: d.avg,
        articleCount: d.count,
        headline: d.headline,
      });
    }
    for (const d of bearDrivers) {
      drivers.push({
        theme: d.theme,
        themeLabel: THEME_LABELS[d.theme] || d.theme,
        themeColor: THEME_COLORS[d.theme] || '#94A3B8',
        direction: 'bearish',
        avgScore: d.avg,
        articleCount: d.count,
        headline: d.headline,
      });
    }

    // Freshness
    let freshness = '';
    if (newestAge === Infinity) {
      freshness = '\u2014';
    } else if (newestAge < 60_000) {
      freshness = '<1m ago';
    } else if (newestAge < 3_600_000) {
      freshness = `${Math.floor(newestAge / 60_000)}m ago`;
    } else {
      freshness = `${Math.floor(newestAge / 3_600_000)}h ago`;
    }

    const sourceNames: string[] = [];
    sourceSet.forEach((s) => sourceNames.push(getSourceDisplayName(s)));

    return {
      avgScore,
      bull,
      neutral,
      bear,
      total: counted,
      sourceCount: sourceSet.size,
      sourceNames,
      momentum,
      allTickers,
      freshness,
      breakingCount,
      sparkBuckets,
      drivers,
    };
  }, [articles, hours]);

  /* ── Empty state ─────────────────────────────────────────── */
  if (!insights) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <p className="text-xs text-white/20 text-center">Awaiting news data&hellip;</p>
      </div>
    );
  }

  const {
    avgScore,
    bull,
    neutral,
    bear,
    total,
    sourceCount,
    sourceNames,
    momentum,
    allTickers,
    freshness,
    breakingCount,
    sparkBuckets,
    drivers,
  } = insights;

  const bullPct = total > 0 ? (bull / total) * 100 : 0;
  const bearPct = total > 0 ? (bear / total) * 100 : 0;
  const neutralPct = Math.max(0, 100 - bullPct - bearPct);

  const visibleTickers = allTickers.slice(0, MAX_VISIBLE_TICKERS);
  const hiddenCount = allTickers.length - visibleTickers.length;
  const hasDrivers = drivers.length >= 2;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
      {/* ── Top Row: Gauge | Sparkline+Dist | Drivers ────── */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-4 p-4 pb-3">
        {/* Zone 1: Mood Gauge */}
        <MoodGauge score={avgScore} momentum={momentum} reduced={reduced} />

        {/* Zone 2: Sparkline + Distribution */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 w-full md:w-auto py-0.5">
          {/* Sparkline */}
          <SentimentSparkline buckets={sparkBuckets} reduced={reduced} />

          {/* Distribution bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex h-3 rounded-full overflow-hidden bg-white/[0.04]">
              {bullPct > 0 && (
                <div
                  className="bg-emerald-400/70 transition-all duration-500"
                  style={{ width: `${bullPct}%` }}
                />
              )}
              {neutralPct > 0 && (
                <div
                  className="bg-slate-500/30 transition-all duration-500"
                  style={{ width: `${neutralPct}%` }}
                />
              )}
              {bearPct > 0 && (
                <div
                  className="bg-red-400/70 transition-all duration-500"
                  style={{ width: `${bearPct}%` }}
                />
              )}
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-400/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400/70" />
                {bull} Bullish ({bullPct.toFixed(0)}%)
              </span>
              <span className="flex items-center gap-1.5 text-white/30">
                <span className="w-2 h-2 rounded-full bg-slate-500/40" />
                {neutral} Neutral
              </span>
              <span className="flex items-center gap-1.5 text-red-400/80">
                <span className="w-2 h-2 rounded-full bg-red-400/70" />
                {bear} Bearish ({bearPct.toFixed(0)}%)
              </span>
            </div>
          </div>

          {/* Stat line */}
          <StatLine
            total={total}
            sourceCount={sourceCount}
            sourceNames={sourceNames}
            freshness={freshness}
            breakingCount={breakingCount}
          />
        </div>

        {/* Zone 3: Key Drivers */}
        {hasDrivers && (
          <div className="shrink-0 w-full md:w-[220px] flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible scrollbar-hide pb-1 md:pb-0">
            <div className="hidden md:block text-[10px] text-white/25 uppercase tracking-wider font-medium mb-0.5">
              Key Drivers
            </div>
            {drivers.map((d, i) => (
              <DriverCard key={`${d.theme}-${d.direction}`} driver={d} index={i} reduced={reduced} />
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom: Ticker Sentiment Grid ────────────────── */}
      {allTickers.length > 0 && (
        <>
          <div className="border-t border-white/[0.04] mx-4" />
          <div className="px-4 pt-2.5 pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/25 uppercase tracking-wider font-medium">
                Stocks in the News
              </span>
              <span className="text-[10px] text-white/15 tabular-nums">
                {allTickers.length} ticker{allTickers.length !== 1 ? 's' : ''} mentioned
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-1.5">
              {visibleTickers.map((t, i) => (
                <TickerCell key={t.ticker} ticker={t} index={i} reduced={reduced} />
              ))}
              {hiddenCount > 0 && (
                <div className="rounded-lg px-2.5 py-2 bg-white/[0.01] border border-white/[0.04] flex items-center justify-center">
                  <span className="text-[10px] text-white/20">+{hiddenCount} more</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
