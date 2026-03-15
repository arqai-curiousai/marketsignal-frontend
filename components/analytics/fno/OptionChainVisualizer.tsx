'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Table2, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IOptionStrike } from '@/types/analytics';
import { OIBuildupView } from './OIBuildupView';
import { fmtOI, fmtNum } from './tokens';

interface Props {
  chain: IOptionStrike[];
  underlyingPrice: number;
  expiry: string;
  lotSize: number;
}

type ViewMode = 'arena' | 'table' | 'buildup';

// ─── Shared data processing ────────────────────────────────────────────

function useChainData(chain: IOptionStrike[], underlyingPrice: number) {
  return useMemo(() => {
    if (chain.length === 0) {
      return { visible: [], maxOI: 1, atmStrike: 0, totalCeOI: 0, totalPeOI: 0, maxCeOiStrike: 0, maxPeOiStrike: 0 };
    }

    let visible = chain;
    if (chain.length > 36) {
      const atmIdx = chain.reduce(
        (closest, s, i) =>
          Math.abs(s.strike - underlyingPrice) < Math.abs(chain[closest].strike - underlyingPrice) ? i : closest,
        0,
      );
      const start = Math.max(0, atmIdx - 18);
      const end = Math.min(chain.length, atmIdx + 19);
      visible = chain.slice(start, end);
    }

    let maxOI = 1;
    let totalCeOI = 0;
    let totalPeOI = 0;
    let maxCeOi = 0;
    let maxPeOi = 0;
    let maxCeOiStrike = 0;
    let maxPeOiStrike = 0;

    for (const s of visible) {
      if (s.ce_oi > maxOI) maxOI = s.ce_oi;
      if (s.pe_oi > maxOI) maxOI = s.pe_oi;
      totalCeOI += s.ce_oi;
      totalPeOI += s.pe_oi;
      if (s.ce_oi > maxCeOi) { maxCeOi = s.ce_oi; maxCeOiStrike = s.strike; }
      if (s.pe_oi > maxPeOi) { maxPeOi = s.pe_oi; maxPeOiStrike = s.strike; }
    }

    const atmStrike = visible.reduce(
      (closest, s) =>
        Math.abs(s.strike - underlyingPrice) < Math.abs(closest.strike - underlyingPrice) ? s : closest,
      visible[0],
    )?.strike;

    return { visible, maxOI, atmStrike, totalCeOI, totalPeOI, maxCeOiStrike, maxPeOiStrike };
  }, [chain, underlyingPrice]);
}

// ═══════════════════════════════════════════════════════════════════════
// VIEW 1: Arena — Clean HTML/CSS Butterfly with Detail Panel
// ═══════════════════════════════════════════════════════════════════════

function ArenaView({
  chain,
  underlyingPrice,
  maxOI,
  atmStrike,
  totalCeOI,
  totalPeOI,
  maxCeOiStrike,
  maxPeOiStrike,
}: {
  chain: IOptionStrike[];
  underlyingPrice: number;
  maxOI: number;
  atmStrike: number;
  totalCeOI: number;
  totalPeOI: number;
  maxCeOiStrike: number;
  maxPeOiStrike: number;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [pinnedIdx, setPinnedIdx] = useState<number | null>(null);

  // Reset stale pin when chain changes (e.g. expiry switch)
  useEffect(() => { setPinnedIdx(null); }, [chain]);

  // Pinned (tap) takes priority over hovered (mouse)
  const activeIdx = pinnedIdx ?? hoveredIdx;
  const activeStrike = activeIdx != null && activeIdx < chain.length
    ? chain[activeIdx]
    : chain.find((s) => s.strike === atmStrike) ?? null;
  const hasInteraction = activeIdx != null;

  const total = totalCeOI + totalPeOI;
  const cePercent = total > 0 ? (totalCeOI / total) * 100 : 50;

  return (
    <div className="overflow-x-auto">
      {/* ─── Pressure Gauge ─── */}
      <div className="flex items-center gap-2 md:gap-3 px-4 py-3">
        <div className="flex items-center gap-1.5 min-w-[80px]">
          <span className="text-[10px] font-mono font-semibold text-blue-400">
            {fmtOI(totalCeOI)}
          </span>
          <span className="text-[7px] text-blue-400/40 uppercase tracking-[0.12em]">Calls</span>
          <span className="text-[9px] font-mono text-blue-400/50">({cePercent.toFixed(0)}%)</span>
        </div>
        <div className="flex-1 h-[5px] rounded-full bg-white/[0.04] overflow-hidden relative">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, rgba(22,163,74,0.1) 0%, rgba(74,222,128,0.55) 100%)',
            }}
            initial={false}
            animate={{ width: `${cePercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-y-0 right-0 rounded-full"
            style={{
              background: 'linear-gradient(270deg, rgba(245,158,11,0.1) 0%, rgba(251,191,36,0.55) 100%)',
            }}
            initial={false}
            animate={{ width: `${100 - cePercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          <div className="absolute inset-y-[-1px] left-1/2 w-px bg-white/15 -translate-x-px" />
        </div>
        <div className="flex items-center gap-1.5 min-w-[80px] justify-end">
          <span className="text-[9px] font-mono text-amber-400/50">({(100 - cePercent).toFixed(0)}%)</span>
          <span className="text-[7px] text-amber-400/40 uppercase tracking-[0.12em]">Puts</span>
          <span className="text-[10px] font-mono font-semibold text-amber-400">
            {fmtOI(totalPeOI)}
          </span>
        </div>
      </div>

      {/* ─── Column Labels ─── */}
      <div className="flex items-center h-5 text-[8px] uppercase tracking-[0.12em] text-white/30 select-none border-b border-white/[0.04] mx-1">
        <div className="flex-1 text-right pr-16">Open Interest</div>
        <div className="w-14 text-center hidden sm:block">LTP</div>
        <div className="w-[72px] text-center text-white/30 font-semibold">Strike</div>
        <div className="w-14 text-center hidden sm:block">LTP</div>
        <div className="flex-1 text-left pl-16">Open Interest</div>
      </div>

      {/* ─── Chain Rows ─── */}
      <div className="mx-1">
        {chain.map((s, idx) => {
          const isATM = s.strike === atmStrike;
          const isHovered = idx === hoveredIdx;
          const ceITM = s.strike < underlyingPrice;
          const peITM = s.strike > underlyingPrice;
          const isMaxCeOI = s.strike === maxCeOiStrike;
          const isMaxPeOI = s.strike === maxPeOiStrike;

          const ceWidth = maxOI > 0 ? (s.ce_oi / maxOI) * 100 : 0;
          const peWidth = maxOI > 0 ? (s.pe_oi / maxOI) * 100 : 0;

          // IV drives bar vibrancy — higher IV = more saturated
          const ceIV = s.ce_iv ?? 0;
          const peIV = s.pe_iv ?? 0;
          const ceAlpha = 0.15 + Math.min(ceIV * 100 / 60, 1) * 0.6;
          const peAlpha = 0.15 + Math.min(peIV * 100 / 60, 1) * 0.6;

          return (
            <div
              key={s.strike}
              className={cn(
                'flex items-center relative transition-colors duration-75 cursor-pointer select-none',
                isATM ? 'h-8' : 'h-7',
                pinnedIdx === idx && 'bg-white/[0.04] border-l-2 border-l-violet-500/40',
                isHovered && pinnedIdx !== idx && !isATM && 'bg-white/[0.02]',
              )}
              onClick={() => setPinnedIdx(pinnedIdx === idx ? null : idx)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* ATM ambient glow */}
              {isATM && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/[0.08] to-transparent pointer-events-none" />
              )}

              {/* ─── CE OI Bar (grows LEFT) ─── */}
              <div className="flex-1 flex justify-end items-center h-full overflow-hidden">
                {isMaxCeOI && ceWidth > 0 && (
                  <span className="text-[7px] font-semibold text-blue-300/30 mr-1 uppercase tracking-wider shrink-0">
                    max
                  </span>
                )}
                <div
                  className="relative flex justify-end items-center h-full"
                  style={{ width: `${ceWidth}%`, minWidth: ceWidth > 0 ? 2 : 0 }}
                >
                  <div
                    className="absolute inset-y-[3px] left-0 right-0 rounded-l-[4px]"
                    style={{
                      background: `linear-gradient(270deg, rgba(74,222,128,${ceAlpha}) 0%, rgba(22,163,74,${ceAlpha * 0.1}) 100%)`,
                    }}
                  />
                  {ceWidth > 18 && (
                    <span className="relative z-10 text-[9px] font-mono text-blue-200/60 pr-1.5 leading-none">
                      {fmtOI(s.ce_oi)}
                    </span>
                  )}
                </div>
              </div>

              {/* ─── CE LTP ─── */}
              <div className="hidden sm:flex items-center shrink-0">
                <div
                  className={cn(
                    'w-14 text-right text-[10px] font-mono tabular-nums px-1.5',
                    ceITM ? 'text-blue-300/80' : 'text-white/45',
                  )}
                >
                  {s.ce_ltp != null ? s.ce_ltp.toFixed(1) : '—'}
                </div>
              </div>

              {/* ─── Strike ─── */}
              <div
                className={cn(
                  'w-[72px] text-center font-mono shrink-0 relative',
                  isATM
                    ? 'text-[12px] font-bold text-violet-400'
                    : 'text-[10px] font-semibold text-white/65',
                )}
              >
                {s.strike.toLocaleString('en-IN')}
              </div>

              {/* ─── PE LTP ─── */}
              <div className="hidden sm:flex items-center shrink-0">
                <div
                  className={cn(
                    'w-14 text-left text-[10px] font-mono tabular-nums px-1.5',
                    peITM ? 'text-amber-300/80' : 'text-white/45',
                  )}
                >
                  {s.pe_ltp != null ? s.pe_ltp.toFixed(1) : '\u2014'}
                </div>
              </div>

              {/* ─── PE OI Bar (grows RIGHT) ─── */}
              <div className="flex-1 flex justify-start items-center h-full overflow-hidden">
                <div
                  className="relative flex justify-start items-center h-full"
                  style={{ width: `${peWidth}%`, minWidth: peWidth > 0 ? 2 : 0 }}
                >
                  <div
                    className="absolute inset-y-[3px] left-0 right-0 rounded-r-[4px]"
                    style={{
                      background: `linear-gradient(90deg, rgba(251,191,36,${peAlpha}) 0%, rgba(245,158,11,${peAlpha * 0.1}) 100%)`,
                    }}
                  />
                  {peWidth > 18 && (
                    <span className="relative z-10 text-[9px] font-mono text-amber-200/60 pl-1.5 leading-none">
                      {fmtOI(s.pe_oi)}
                    </span>
                  )}
                </div>
                {isMaxPeOI && peWidth > 0 && (
                  <span className="text-[7px] font-semibold text-amber-300/30 ml-1 uppercase tracking-wider shrink-0">
                    max
                  </span>
                )}
              </div>

              {/* Row divider */}
              {!isATM && (
                <div className="absolute bottom-0 left-[6%] right-[6%] h-px bg-white/[0.02]" />
              )}
              {isATM && (
                <>
                  <div className="absolute top-0 left-[3%] right-[3%] h-px bg-violet-500/15" />
                  <div className="absolute bottom-0 left-[3%] right-[3%] h-px bg-violet-500/15" />
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Strike Detail Panel ─── */}
      <div
        className={cn(
          'mx-1 mt-2 rounded-lg border px-4 py-3 transition-all duration-200',
          hasInteraction
            ? 'opacity-100 bg-white/[0.02] border-white/[0.06]'
            : 'opacity-100 bg-white/[0.01] border-white/[0.04]',
        )}
      >
        {activeStrike ? (
          <>
            <div className="flex items-center gap-3 mb-2.5">
              <span className="text-[11px] font-mono font-bold text-white">
                {activeStrike.strike.toLocaleString('en-IN')}
              </span>
              {activeStrike.strike === atmStrike && (
                <span className="text-[7px] uppercase tracking-[0.15em] text-violet-400/50 font-semibold">
                  ATM
                </span>
              )}
              {pinnedIdx != null && (
                <button
                  onClick={(e) => { e.stopPropagation(); setPinnedIdx(null); }}
                  className="text-[8px] text-white/30 ml-auto hover:text-white/50 transition-colors"
                  aria-label="Unpin strike"
                >
                  Unpin
                </button>
              )}
              {!hasInteraction && (
                <span className="text-[8px] text-white/30 ml-auto italic">
                  Tap or hover a strike for details
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3">
              {/* ── Calls ── */}
              <div>
                <div className="text-[7px] uppercase tracking-[0.15em] text-blue-400/40 font-semibold mb-1.5">
                  Calls
                </div>
                <div className="grid grid-cols-[38px_1fr] gap-x-2 gap-y-[3px] text-[10px]">
                  <span className="text-white/20">OI</span>
                  <span className="font-mono text-white/65">{fmtOI(activeStrike.ce_oi)}</span>
                  <span className="text-white/20">Vol</span>
                  <span className="font-mono text-white/40">{fmtOI(activeStrike.ce_volume)}</span>
                  <span className="text-white/20">IV</span>
                  <span className="font-mono text-blue-300/70">
                    {activeStrike.ce_iv != null ? `${(activeStrike.ce_iv * 100).toFixed(1)}%` : '—'}
                  </span>
                  <span className="text-white/20">Delta</span>
                  <span className="font-mono text-white/40">
                    {activeStrike.ce_delta != null ? activeStrike.ce_delta.toFixed(3) : '—'}
                  </span>
                  <span className="text-white/20">Gamma</span>
                  <span className="font-mono text-white/40">
                    {activeStrike.ce_gamma != null ? activeStrike.ce_gamma.toFixed(5) : '—'}
                  </span>
                  <span className="text-white/20">Theta</span>
                  <span className="font-mono text-white/40">
                    {activeStrike.ce_theta != null ? activeStrike.ce_theta.toFixed(1) : '—'}
                  </span>
                  <span className="text-white/20">Vega</span>
                  <span className="font-mono text-white/40">
                    {activeStrike.ce_vega != null ? activeStrike.ce_vega.toFixed(1) : '—'}
                  </span>
                </div>
              </div>

              {/* ── Puts ── */}
              <div>
                <div className="text-[7px] uppercase tracking-[0.15em] text-amber-400/40 font-semibold mb-1.5">
                  Puts
                </div>
                <div className="grid grid-cols-[38px_1fr] gap-x-2 gap-y-[3px] text-[10px]">
                  <span className="text-white/20">OI</span>
                  <span className="font-mono text-white/65">{fmtOI(activeStrike.pe_oi)}</span>
                  <span className="text-white/20">Vol</span>
                  <span className="font-mono text-white/40">{fmtOI(activeStrike.pe_volume)}</span>
                  <span className="text-white/20">IV</span>
                  <span className="font-mono text-amber-300/70">
                    {activeStrike.pe_iv != null ? `${(activeStrike.pe_iv * 100).toFixed(1)}%` : '—'}
                  </span>
                  <span className="text-white/20">Delta</span>
                  <span className="font-mono text-white/40">
                    {activeStrike.pe_delta != null ? activeStrike.pe_delta.toFixed(3) : '—'}
                  </span>
                  <span className="text-white/20">Gamma</span>
                  <span className="font-mono text-white/40">
                    {activeStrike.pe_gamma != null ? activeStrike.pe_gamma.toFixed(5) : '—'}
                  </span>
                  <span className="text-white/20">Theta</span>
                  <span className="font-mono text-white/40">
                    {activeStrike.pe_theta != null ? activeStrike.pe_theta.toFixed(1) : '—'}
                  </span>
                  <span className="text-white/20">Vega</span>
                  <span className="font-mono text-white/40">
                    {activeStrike.pe_vega != null ? activeStrike.pe_vega.toFixed(1) : '—'}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-[9px] text-white/15 text-center py-2">No data</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// VIEW 3: Classic Table (retained for precision)
// ═══════════════════════════════════════════════════════════════════════

function TableView({
  chain,
  underlyingPrice,
  maxOI,
  atmStrike,
}: {
  chain: IOptionStrike[];
  underlyingPrice: number;
  maxOI: number;
  atmStrike: number;
}) {
  const [showGreeks, setShowGreeks] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-end px-2 pb-2">
        <button
          onClick={() => setShowGreeks(!showGreeks)}
          className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-full bg-white/5 text-muted-foreground hover:bg-white/10 transition-colors"
        >
          {showGreeks ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          Greeks
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground uppercase tracking-wider border-b border-white/5">
              <th className="py-2 px-2 text-right font-medium">Vol</th>
              <th className="py-2 px-2 text-right font-medium">OI</th>
              {showGreeks && (
                <>
                  <th className="py-2 px-2 text-right font-medium">IV</th>
                  <th className="py-2 px-2 text-right font-medium">{'\u0394'}</th>
                </>
              )}
              <th className="py-2 px-2 text-right font-medium">Bid</th>
              <th className="py-2 px-2 text-right font-medium">Ask</th>
              <th className="py-2 px-2 text-right font-medium">CE LTP</th>
              <th className="py-2 px-3 text-center font-bold text-white bg-slate-950 sticky left-0 z-10">Strike</th>
              <th className="py-2 px-2 text-left font-medium">PE LTP</th>
              <th className="py-2 px-2 text-left font-medium">Bid</th>
              <th className="py-2 px-2 text-left font-medium">Ask</th>
              {showGreeks && (
                <>
                  <th className="py-2 px-2 text-left font-medium">IV</th>
                  <th className="py-2 px-2 text-left font-medium">{'\u0394'}</th>
                </>
              )}
              <th className="py-2 px-2 text-left font-medium">OI</th>
              <th className="py-2 px-2 text-left font-medium">Vol</th>
            </tr>
          </thead>
          <tbody>
            {chain.map((s) => {
              const isATM = s.strike === atmStrike;
              const ceITM = s.strike < underlyingPrice;
              const peITM = s.strike > underlyingPrice;
              const ceOIW = (s.ce_oi / maxOI) * 100;
              const peOIW = (s.pe_oi / maxOI) * 100;

              return (
                <tr
                  key={s.strike}
                  className={cn(
                    'border-b border-white/[0.02] hover:bg-white/[0.07] transition-colors',
                    isATM && 'border-l-2 border-r-2 border-l-brand-blue border-r-brand-blue bg-brand-blue/[0.04]',
                  )}
                >
                  <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">{fmtOI(s.ce_volume)}</td>
                  <td className="py-1.5 px-2 text-right font-mono relative">
                    <div className="absolute inset-y-0 right-0 bg-blue-500/10 rounded-l" style={{ width: `${ceOIW}%` }} />
                    <span className={cn('relative z-10', ceITM ? 'text-blue-300' : 'text-white')}>{fmtOI(s.ce_oi)}</span>
                  </td>
                  {showGreeks && (
                    <>
                      <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">{s.ce_iv != null ? `${(s.ce_iv * 100).toFixed(1)}` : '—'}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">{s.ce_delta != null ? s.ce_delta.toFixed(2) : '—'}</td>
                    </>
                  )}
                  <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">{fmtNum(s.ce_bid)}</td>
                  <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">{fmtNum(s.ce_ask)}</td>
                  <td className={cn('py-1.5 px-2 text-right font-mono font-semibold', ceITM ? 'text-blue-300' : 'text-white')}>{fmtNum(s.ce_ltp)}</td>
                  <td className={cn('py-1.5 px-3 text-center font-mono font-bold bg-slate-950 sticky left-0 z-10', isATM ? 'text-brand-blue' : 'text-white')}>{s.strike.toLocaleString('en-IN')}</td>
                  <td className={cn('py-1.5 px-2 text-left font-mono font-semibold', peITM ? 'text-amber-300' : 'text-white')}>{fmtNum(s.pe_ltp)}</td>
                  <td className="py-1.5 px-2 text-left font-mono text-muted-foreground">{fmtNum(s.pe_bid)}</td>
                  <td className="py-1.5 px-2 text-left font-mono text-muted-foreground">{fmtNum(s.pe_ask)}</td>
                  {showGreeks && (
                    <>
                      <td className="py-1.5 px-2 text-left font-mono text-muted-foreground">{s.pe_iv != null ? `${(s.pe_iv * 100).toFixed(1)}` : '—'}</td>
                      <td className="py-1.5 px-2 text-left font-mono text-muted-foreground">{s.pe_delta != null ? s.pe_delta.toFixed(2) : '—'}</td>
                    </>
                  )}
                  <td className="py-1.5 px-2 text-left font-mono relative">
                    <div className="absolute inset-y-0 left-0 bg-amber-500/10 rounded-r" style={{ width: `${peOIW}%` }} />
                    <span className={cn('relative z-10', peITM ? 'text-amber-300' : 'text-white')}>{fmtOI(s.pe_oi)}</span>
                  </td>
                  <td className="py-1.5 px-2 text-left font-mono text-muted-foreground">{fmtOI(s.pe_volume)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main Component with View Switcher
// ═══════════════════════════════════════════════════════════════════════

const VIEW_MODES: { id: ViewMode; label: string; icon: typeof BarChart3 }[] = [
  { id: 'arena', label: 'Arena', icon: BarChart3 },
  { id: 'table', label: 'Table', icon: Table2 },
  { id: 'buildup', label: 'Buildup', icon: TrendingUp },
];

export function OptionChainVisualizer({ chain, underlyingPrice, expiry, lotSize }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('arena');
  const { visible, maxOI, atmStrike, totalCeOI, totalPeOI, maxCeOiStrike, maxPeOiStrike } =
    useChainData(chain, underlyingPrice);

  const expiryDisplay = new Date(expiry + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
    >
      {/* Header with View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-sm font-semibold text-white">Option Chain</span>
          <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-white/5">
            {expiryDisplay}
          </span>
          <span className="text-[10px] text-muted-foreground hidden md:inline">
            Lot: {lotSize}
          </span>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-0.5 rounded-full bg-white/5 p-0.5">
          {VIEW_MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                title={mode.label}
                aria-label={`${mode.label} view`}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1.5 md:py-1 text-[10px] font-medium rounded-full transition-all min-h-[32px] md:min-h-0',
                  viewMode === mode.id
                    ? 'bg-brand-blue/20 text-brand-blue'
                    : 'text-muted-foreground hover:text-white',
                )}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-2">
        {visible.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-white/15" />
            <p className="text-xs text-muted-foreground">No option chain data available</p>
            <p className="text-[10px] text-white/20 mt-1">Check if the underlying has active F&O contracts</p>
          </div>
        ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {viewMode === 'arena' && (
              <ArenaView
                chain={visible}
                underlyingPrice={underlyingPrice}
                maxOI={maxOI}
                atmStrike={atmStrike}
                totalCeOI={totalCeOI}
                totalPeOI={totalPeOI}
                maxCeOiStrike={maxCeOiStrike}
                maxPeOiStrike={maxPeOiStrike}
              />
            )}
            {viewMode === 'table' && (
              <TableView
                chain={visible}
                underlyingPrice={underlyingPrice}
                maxOI={maxOI}
                atmStrike={atmStrike}
              />
            )}
            {viewMode === 'buildup' && (
              <OIBuildupView
                chain={visible}
                underlyingPrice={underlyingPrice}
                atmStrike={atmStrike}
              />
            )}
          </motion.div>
        </AnimatePresence>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 md:gap-4 px-4 py-2 border-t border-white/5 text-[9px] text-muted-foreground">
        {viewMode === 'arena' && (
          <>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-3 rounded bg-blue-500/40 inline-block" /> Calls
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-3 rounded bg-amber-500/40 inline-block" /> Puts
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-0.5 rounded bg-violet-500/60 inline-block" /> ATM
            </span>
            <span className="ml-auto text-white/30">Luminosity = Implied Volatility</span>
          </>
        )}
        {viewMode === 'table' && (
          <>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-3 rounded bg-blue-500/30 inline-block" /> CE OI
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-3 rounded bg-amber-500/30 inline-block" /> PE OI
            </span>
            <span className="text-blue-300">ITM Calls</span>
            <span className="text-amber-300">ITM Puts</span>
          </>
        )}
      </div>
    </motion.div>
  );
}
