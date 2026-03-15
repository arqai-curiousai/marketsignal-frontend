'use client';

import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { IOptionStrike } from '@/types/analytics';
import { greekHeatColor, TOOLTIP_STYLE, fmtCompact, S, T } from './tokens';

// ─── Types ──────────────────────────────────────────────────────────

type GreeksSubView = 'exposure' | 'smile' | 'heatmap';
type ExposureMetric = 'gex' | 'dex' | 'theta' | 'vega' | 'vanna' | 'charm';
type GreekKey = 'iv' | 'delta' | 'gamma' | 'theta' | 'vega' | 'vanna' | 'charm' | 'volga';

interface GreeksViewProps {
  chain: IOptionStrike[];
  underlyingPrice: number;
  atmStrike: number;
  lotSize: number;
  // GEX analytics from snapshot (optional, enhances display)
  zeroGammaLevel?: number | null;
  callWallStrike?: number | null;
  putWallStrike?: number | null;
  dealerRegime?: 'positive_gamma' | 'negative_gamma' | null;
  gexPredictedRangeLow?: number | null;
  gexPredictedRangeHigh?: number | null;
  netGex?: number | null;
}

// ─── Exposure computation ───────────────────────────────────────────

interface ExposurePoint {
  strike: number;
  call: number;
  put: number;
  net: number;
}

function computeExposure(
  chain: IOptionStrike[],
  underlyingPrice: number,
  metric: ExposureMetric,
  lotSize: number,
): ExposurePoint[] {
  const spotSq = underlyingPrice * underlyingPrice;

  return chain.map((s) => {
    let callRaw = 0;
    let putRaw = 0;

    switch (metric) {
      case 'gex':
        // Gamma × OI × lotSize × Spot² × 0.01  — call positive (stabilizing), put negative (amplifying)
        callRaw = (s.ce_gamma ?? 0) * s.ce_oi * lotSize * spotSq * 0.01;
        putRaw = (s.pe_gamma ?? 0) * s.pe_oi * lotSize * spotSq * 0.01;
        return { strike: s.strike, call: callRaw / 1e7, put: -putRaw / 1e7, net: (callRaw - putRaw) / 1e7 };
      case 'dex':
        // Delta × OI × lotSize — CE delta is positive, PE delta is already negative
        callRaw = (s.ce_delta ?? 0) * s.ce_oi * lotSize;
        putRaw = (s.pe_delta ?? 0) * s.pe_oi * lotSize;
        return { strike: s.strike, call: callRaw / 1e5, put: putRaw / 1e5, net: (callRaw + putRaw) / 1e5 };
      case 'theta':
        // |Theta| × OI × lotSize — both sides are time decay (shown as call up, put down)
        callRaw = Math.abs(s.ce_theta ?? 0) * s.ce_oi * lotSize;
        putRaw = Math.abs(s.pe_theta ?? 0) * s.pe_oi * lotSize;
        return { strike: s.strike, call: callRaw / 1e5, put: -putRaw / 1e5, net: (callRaw - putRaw) / 1e5 };
      case 'vega':
        callRaw = (s.ce_vega ?? 0) * s.ce_oi * lotSize;
        putRaw = (s.pe_vega ?? 0) * s.pe_oi * lotSize;
        return { strike: s.strike, call: callRaw / 1e5, put: -putRaw / 1e5, net: (callRaw - putRaw) / 1e5 };
      case 'vanna':
        // Vanna × OI × lotSize — shows delta sensitivity to IV changes
        callRaw = (s.ce_vanna ?? 0) * s.ce_oi * lotSize;
        putRaw = (s.pe_vanna ?? 0) * s.pe_oi * lotSize;
        return { strike: s.strike, call: callRaw / 1e5, put: putRaw / 1e5, net: (callRaw + putRaw) / 1e5 };
      case 'charm':
        // Charm × OI × lotSize — shows delta decay over time
        callRaw = (s.ce_charm ?? 0) * s.ce_oi * lotSize;
        putRaw = (s.pe_charm ?? 0) * s.pe_oi * lotSize;
        return { strike: s.strike, call: callRaw / 1e5, put: putRaw / 1e5, net: (callRaw + putRaw) / 1e5 };
      default:
        return { strike: s.strike, call: 0, put: 0, net: 0 };
    }
  });
}

function findGammaFlip(data: ExposurePoint[]): number | null {
  for (let i = 1; i < data.length; i++) {
    if (data[i - 1].net * data[i].net < 0) {
      const x1 = data[i - 1].strike;
      const x2 = data[i].strike;
      const y1 = data[i - 1].net;
      const y2 = data[i].net;
      if (y2 === y1) return Math.round((x1 + x2) / 2);
      return Math.round(x1 + (0 - y1) * (x2 - x1) / (y2 - y1));
    }
  }
  return null;
}

// ─── Metric labels ──────────────────────────────────────────────────

const METRIC_META: Record<ExposureMetric, { label: string; unit: string; desc: string }> = {
  gex: { label: 'GEX', unit: 'Cr', desc: 'Gamma Exposure — +ve stabilizes, −ve amplifies' },
  dex: { label: 'DEX', unit: 'L', desc: 'Delta Exposure — net directional tilt' },
  theta: { label: 'Theta', unit: 'L/day', desc: 'Time decay concentration per strike' },
  vega: { label: 'Vega', unit: 'L/%', desc: 'Volatility sensitivity per strike' },
  vanna: { label: 'Vanna', unit: 'L', desc: 'Delta sensitivity to IV — predicts dealer hedging when vol moves' },
  charm: { label: 'Charm', unit: 'L', desc: 'Delta decay over time — predicts overnight & expiry-day rebalancing' },
};

// ═══════════════════════════════════════════════════════════════════
// SUB-VIEW 1: Greek Exposure Profile
// ═══════════════════════════════════════════════════════════════════

function ExposureChart({ chain, underlyingPrice, lotSize, zeroGammaLevel, callWallStrike, putWallStrike, dealerRegime, gexPredictedRangeLow, gexPredictedRangeHigh, netGex: _netGex }: {
  chain: IOptionStrike[];
  underlyingPrice: number;
  lotSize: number;
  zeroGammaLevel?: number | null;
  callWallStrike?: number | null;
  putWallStrike?: number | null;
  dealerRegime?: 'positive_gamma' | 'negative_gamma' | null;
  gexPredictedRangeLow?: number | null;
  gexPredictedRangeHigh?: number | null;
  netGex?: number | null;
}) {
  const gId = React.useId();
  const [metric, setMetric] = useState<ExposureMetric>('gex');

  const data = useMemo(
    () => computeExposure(chain, underlyingPrice, metric, lotSize),
    [chain, underlyingPrice, metric, lotSize],
  );

  // Compute gamma flip from GEX data (always, regardless of current metric)
  const gexData = useMemo(
    () => computeExposure(chain, underlyingPrice, 'gex', lotSize),
    [chain, underlyingPrice, lotSize],
  );
  const gammaFlip = useMemo(() => findGammaFlip(gexData), [gexData]);

  // Find key levels
  const { netTotal, callWall, putWall } = useMemo(() => {
    let total = 0;
    let maxCeOi = 0;
    let maxPeOi = 0;
    let cw = 0;
    let pw = 0;
    for (const s of chain) {
      if (s.ce_oi > maxCeOi) { maxCeOi = s.ce_oi; cw = s.strike; }
      if (s.pe_oi > maxPeOi) { maxPeOi = s.pe_oi; pw = s.strike; }
    }
    for (const d of data) total += d.net;
    return { netTotal: total, callWall: cw, putWall: pw };
  }, [chain, data]);

  const meta = METRIC_META[metric];

  // Find closest strike to ATM in data
  const atmDataStrike = data.length > 0
    ? data.reduce(
        (closest, d) => Math.abs(d.strike - underlyingPrice) < Math.abs(closest.strike - underlyingPrice) ? d : closest,
        data[0],
      )?.strike
    : undefined;

  return (
    <div>
      {/* Metric toggle + context */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex flex-wrap items-center gap-1">
          {(Object.keys(METRIC_META) as ExposureMetric[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              aria-pressed={metric === m}
              aria-label={`View ${METRIC_META[m].label} exposure`}
              className={cn(
                'px-2.5 md:px-2.5 py-1 md:py-0.5 text-[10px] font-semibold rounded-full transition-all min-h-[32px] md:min-h-0 flex items-center',
                metric === m
                  ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25'
                  : 'text-white/50 hover:text-white/70',
              )}
            >
              {METRIC_META[m].label}
            </button>
          ))}
        </div>
      </div>

      {/* GEX Levels info bar (when GEX metric is selected and backend data is available) */}
      {metric === 'gex' && dealerRegime && (
        <div className="flex flex-wrap items-center gap-2 px-2 py-1.5 mb-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          {/* Dealer Regime badge */}
          <span className={cn(
            'px-2 py-0.5 text-[9px] font-bold rounded-full',
            dealerRegime === 'positive_gamma'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/15 text-red-400 border border-red-500/20',
          )}>
            {dealerRegime === 'positive_gamma' ? 'Positive \u0393 \u2014 Stabilizing' : 'Negative \u0393 \u2014 Amplifying'}
          </span>

          <span className="h-3 w-px bg-white/10" />

          {/* Key levels */}
          <div className="flex items-center gap-3 text-[9px] text-white/30">
            {zeroGammaLevel != null && (
              <span>
                Zero \u0393: <span className="font-mono text-amber-400/60">{zeroGammaLevel.toLocaleString('en-IN')}</span>
              </span>
            )}
            {callWallStrike != null && (
              <span>
                Call Wall: <span className="font-mono text-blue-400/50">{callWallStrike.toLocaleString('en-IN')}</span>
              </span>
            )}
            {putWallStrike != null && (
              <span>
                Put Wall: <span className="font-mono text-amber-400/50">{putWallStrike.toLocaleString('en-IN')}</span>
              </span>
            )}
          </div>

          <span className="h-3 w-px bg-white/10" />

          {/* Predicted range */}
          {gexPredictedRangeLow != null && gexPredictedRangeHigh != null && (
            <span className="text-[9px] text-white/30">
              Range: <span className="font-mono text-violet-400/50">
                {gexPredictedRangeLow.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                {' \u2013 '}
                {gexPredictedRangeHigh.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Context line */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3 px-1 mb-3 text-[9px] text-white/35">
        <span>
          Net: <span className={cn('font-mono font-semibold', netTotal >= 0 ? 'text-emerald-400/60' : 'text-red-400/60')}>
            {netTotal >= 0 ? '+' : ''}{netTotal.toFixed(1)} {meta.unit}
          </span>
        </span>
        {gammaFlip != null && (
          <span>
            Flip: <span className="font-mono text-amber-400/50">{gammaFlip.toLocaleString('en-IN')}</span>
          </span>
        )}
        <span>
          Call Wall: <span className="font-mono text-blue-400/40">{callWall.toLocaleString('en-IN')}</span>
        </span>
        <span>
          Put Wall: <span className="font-mono text-amber-400/40">{putWall.toLocaleString('en-IN')}</span>
        </span>
        <span className="ml-auto text-white/25 italic hidden md:inline">{meta.desc}</span>
      </div>

      {/* Chart */}
      <div className="h-[240px] md:h-[300px]" role="img" aria-label={`${meta.label} exposure chart — Call vs Put per strike`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id={`${gId}-gexCall`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ADE80" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#4ADE80" stopOpacity={0.15} />
            </linearGradient>
            <linearGradient id={`${gId}-gexPut`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.15} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="strike"
            tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v)}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }}
            tickFormatter={(v: number) => fmtCompact(v)}
            width={50}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelFormatter={(strike: number) => `Strike: ${strike.toLocaleString('en-IN')}`}
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)} ${meta.unit}`,
              name === 'call' ? 'Call' : name === 'put' ? 'Put' : 'Net',
            ]}
          />

          {/* Zero line */}
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.06)" />

          {/* ATM marker */}
          {atmDataStrike && (
            <ReferenceLine
              x={atmDataStrike}
              stroke="rgba(139, 92, 246, 0.35)"
              strokeDasharray="6 3"
              label={{ value: 'ATM', fill: 'rgba(139,92,246,0.5)', fontSize: 8, position: 'top' }}
            />
          )}

          {/* Gamma Flip marker (shown for all exposure metrics) */}
          {gammaFlip != null && data.length > 0 && (
            <ReferenceLine
              x={data.reduce((c, d) => Math.abs(d.strike - gammaFlip) < Math.abs(c.strike - gammaFlip) ? d : c, data[0])?.strike}
              stroke="rgba(251, 191, 36, 0.4)"
              strokeDasharray="4 4"
              label={{ value: 'Flip', fill: 'rgba(251,191,36,0.5)', fontSize: 8, position: 'top' }}
            />
          )}

          {/* Bars */}
          <Bar
            dataKey="call"
            fill={`url(#${gId}-gexCall)`}
            radius={[3, 3, 0, 0]}
            maxBarSize={20}
          />
          <Bar
            dataKey="put"
            fill={`url(#${gId}-gexPut)`}
            radius={[0, 0, 3, 3]}
            maxBarSize={20}
          />

          {/* Net exposure line */}
          <Line
            type="monotone"
            dataKey="net"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            activeDot={{ r: 3, fill: '#fff', strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1 px-1 text-[8px] text-white/30">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2.5 rounded-sm bg-blue-400/50 inline-block" /> Call
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2.5 rounded-sm bg-amber-400/50 inline-block" /> Put
        </span>
        <span className="flex items-center gap-1">
          <span className="h-px w-3 border-t border-dashed border-white/40 inline-block" /> Net
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-px bg-violet-500/50 inline-block" /> ATM
        </span>
        {gammaFlip != null && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-px bg-amber-400/50 inline-block" /> Gamma Flip
          </span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SUB-VIEW 2: IV Smile Curves
// ═══════════════════════════════════════════════════════════════════

function IVSmileChart({ chain, underlyingPrice, atmStrike }: {
  chain: IOptionStrike[];
  underlyingPrice: number;
  atmStrike: number;
}) {
  const gId = React.useId();
  const smileData = useMemo(() => {
    return chain
      .filter((s) => s.ce_iv != null || s.pe_iv != null)
      .map((s) => ({
        strike: s.strike,
        ceIV: s.ce_iv != null ? s.ce_iv * 100 : null,
        peIV: s.pe_iv != null ? s.pe_iv * 100 : null,
      }));
  }, [chain]);

  // Compute context metrics
  const { atmIV, skew, spread } = useMemo(() => {
    const atm = chain.find((s) => s.strike === atmStrike);
    const atmCeIV = atm?.ce_iv ?? null;
    const atmPeIV = atm?.pe_iv ?? null;
    const iv = atmCeIV != null && atmPeIV != null ? ((atmCeIV + atmPeIV) / 2) * 100 : null;
    const sp = atmCeIV != null && atmPeIV != null ? (atmPeIV - atmCeIV) * 100 : null;

    // Skew: compare 5-strike OTM put IV vs 5-strike OTM call IV
    const atmIdx = chain.findIndex((s) => s.strike === atmStrike);
    let sk: number | null = null;
    if (atmIdx >= 5 && atmIdx < chain.length - 5) {
      const otmPut = chain[atmIdx - 5]?.pe_iv;
      const otmCall = chain[atmIdx + 5]?.ce_iv;
      if (otmPut != null && otmCall != null) {
        sk = (otmPut - otmCall) * 100;
      }
    }

    return { atmIV: iv, skew: sk, spread: sp };
  }, [chain, atmStrike]);

  const atmDataStrike = smileData.length > 0
    ? smileData.reduce(
        (closest, d) => Math.abs(d.strike - underlyingPrice) < Math.abs(closest.strike - underlyingPrice) ? d : closest,
        smileData[0],
      )?.strike
    : undefined;

  if (smileData.length === 0) {
    return (
      <div className={cn(S.inner, 'flex items-center justify-center')} style={{ height: 260 }}>
        <span className={T.caption}>IV data not available for current chain</span>
      </div>
    );
  }

  return (
    <div>
      {/* Context metrics */}
      <div className="flex items-center gap-4 px-1 mb-3 text-[9px] text-white/35">
        {atmIV != null && (
          <span>
            ATM IV: <span className="font-mono font-semibold text-white/50">{atmIV.toFixed(1)}%</span>
          </span>
        )}
        {skew != null && (
          <span>
            Skew: <span className={cn('font-mono font-semibold', skew > 0 ? 'text-red-400/50' : 'text-emerald-400/50')}>
              {skew > 0 ? '+' : ''}{skew.toFixed(1)}%
            </span>
          </span>
        )}
        {spread != null && (
          <span>
            Put-Call Spread: <span className="font-mono text-white/35">{spread > 0 ? '+' : ''}{spread.toFixed(1)}%</span>
          </span>
        )}
        <span className="ml-auto text-white/25 italic hidden md:inline">IV across strikes — steeper skew = more downside hedging</span>
      </div>

      <div className="h-[260px] md:h-[320px]" role="img" aria-label="IV Smile chart — Call IV vs Put IV across strikes">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={smileData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id={`${gId}-ceIV`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4ADE80" stopOpacity={0.8} />
              <stop offset="50%" stopColor="#4ADE80" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#4ADE80" stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id={`${gId}-peIV`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.8} />
              <stop offset="50%" stopColor="#FBBF24" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.8} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="strike"
            tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v)}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }}
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            width={40}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelFormatter={(strike: number) => `Strike: ${strike.toLocaleString('en-IN')}`}
            formatter={(value: number, name: string) => [
              `${value.toFixed(1)}%`,
              name === 'ceIV' ? 'CE IV' : 'PE IV',
            ]}
          />

          {/* ATM marker */}
          {atmDataStrike && (
            <ReferenceLine
              x={atmDataStrike}
              stroke="rgba(139, 92, 246, 0.3)"
              strokeDasharray="6 3"
              label={{ value: 'ATM', fill: 'rgba(139,92,246,0.4)', fontSize: 8, position: 'top' }}
            />
          )}

          <Line
            type="monotone"
            dataKey="ceIV"
            stroke={`url(#${gId}-ceIV)`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: '#4ADE80', strokeWidth: 0 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="peIV"
            stroke={`url(#${gId}-peIV)`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: '#FBBF24', strokeWidth: 0 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1 px-1 text-[8px] text-white/30">
        <span className="flex items-center gap-1">
          <span className="h-px w-3 bg-blue-400/60 inline-block" /> CE IV
        </span>
        <span className="flex items-center gap-1">
          <span className="h-px w-3 bg-amber-400/60 inline-block" /> PE IV
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-px bg-violet-500/40 inline-block" /> ATM
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SUB-VIEW 3: Heatmap Grid (preserved from original)
// ═══════════════════════════════════════════════════════════════════

function HeatmapGrid({ chain, atmStrike }: {
  chain: IOptionStrike[];
  atmStrike: number;
}) {
  const [selectedGreek, setSelectedGreek] = useState<GreekKey>('iv');

  // Cap visible strikes to ±15 around ATM for readability
  const visibleChain = React.useMemo(() => {
    if (chain.length <= 30) return chain;
    const atmIdx = chain.reduce(
      (closest, s, i) => Math.abs(s.strike - atmStrike) < Math.abs(chain[closest].strike - atmStrike) ? i : closest,
      0,
    );
    const start = Math.max(0, atmIdx - 15);
    const end = Math.min(chain.length, atmIdx + 16);
    return chain.slice(start, end);
  }, [chain, atmStrike]);

  const greeks: { key: GreekKey; label: string }[] = [
    { key: 'iv', label: 'IV' },
    { key: 'delta', label: 'Delta' },
    { key: 'gamma', label: 'Gamma' },
    { key: 'theta', label: 'Theta' },
    { key: 'vega', label: 'Vega' },
    { key: 'vanna', label: 'Vanna' },
    { key: 'charm', label: 'Charm' },
    { key: 'volga', label: 'Volga' },
  ];

  const getVal = (s: IOptionStrike, side: 'ce' | 'pe', greek: GreekKey): number | null => {
    const key = `${side}_${greek}` as keyof IOptionStrike;
    return s[key] as number | null;
  };

  const fmtGreek = (val: number | null, greek: GreekKey): string => {
    if (val == null) return '—';
    switch (greek) {
      case 'iv': return `${(val * 100).toFixed(1)}`;
      case 'delta': return val.toFixed(3);
      case 'gamma': return val.toFixed(5);
      case 'theta': return val.toFixed(1);
      case 'vega': return val.toFixed(1);
      case 'vanna': return val.toFixed(3);
      case 'charm': return val.toFixed(4);
      case 'volga': return val.toFixed(1);
      default: return val.toFixed(2);
    }
  };

  return (
    <div className="space-y-3">
      {/* Greek selector */}
      <div className="flex items-center gap-1.5 px-1">
        {greeks.map((g) => (
          <button
            key={g.key}
            onClick={() => setSelectedGreek(g.key)}
            className={cn(
              'px-3 py-1.5 md:py-1 text-[10px] font-semibold rounded-full transition-all min-h-[32px] md:min-h-0',
              selectedGreek === g.key
                ? 'bg-brand-violet/20 text-brand-violet border border-brand-violet/30'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10',
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="grid" style={{ gridTemplateColumns: `60px repeat(${visibleChain.length}, minmax(36px, 1fr))` }}>
          {/* Header: strike prices */}
          <div className="text-[8px] text-muted-foreground px-1 py-2 flex items-end justify-center font-semibold">
            Strike
          </div>
          {visibleChain.map((s) => (
            <div
              key={`h-${s.strike}`}
              className={cn(
                'text-[8px] px-0.5 py-2 text-center font-mono',
                s.strike === atmStrike ? 'text-brand-blue font-bold' : 'text-muted-foreground',
              )}
              style={{ writingMode: 'vertical-rl', minHeight: 40 }}
            >
              {s.strike >= 1000 ? `${(s.strike / 1000).toFixed(1)}K` : s.strike}
            </div>
          ))}

          {/* CE row */}
          <div className="text-[9px] font-semibold text-blue-400 px-1 py-1 flex items-center">CE</div>
          {visibleChain.map((s) => {
            const val = getVal(s, 'ce', selectedGreek);
            return (
              <div
                key={`ce-${s.strike}`}
                className={cn(
                  'text-[9px] font-mono text-center py-1 px-0.5 border border-white/[0.03] transition-all hover:border-white/15',
                  s.strike === atmStrike && 'ring-1 ring-brand-blue/30',
                )}
                style={{ backgroundColor: greekHeatColor(val, selectedGreek) }}
                title={`CE ${selectedGreek.toUpperCase()}: ${fmtGreek(val, selectedGreek)} @ ${s.strike}`}
              >
                {fmtGreek(val, selectedGreek)}
              </div>
            );
          })}

          {/* PE row */}
          <div className="text-[9px] font-semibold text-amber-400 px-1 py-1 flex items-center">PE</div>
          {visibleChain.map((s) => {
            const val = getVal(s, 'pe', selectedGreek);
            return (
              <div
                key={`pe-${s.strike}`}
                className={cn(
                  'text-[9px] font-mono text-center py-1 px-0.5 border border-white/[0.03] transition-all hover:border-white/15',
                  s.strike === atmStrike && 'ring-1 ring-brand-blue/30',
                )}
                style={{ backgroundColor: greekHeatColor(val, selectedGreek) }}
                title={`PE ${selectedGreek.toUpperCase()}: ${fmtGreek(val, selectedGreek)} @ ${s.strike}`}
              >
                {fmtGreek(val, selectedGreek)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Color legend */}
      <div className="flex items-center gap-3 px-1 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-3 rounded bg-red-400/30 inline-block" /> Negative
        </span>
        <div className="flex h-2 flex-1 max-w-[200px] rounded-full overflow-hidden">
          <div className="flex-1 bg-red-500/30" />
          <div className="flex-1 bg-white/[0.03]" />
          <div className="flex-1 bg-emerald-500/15" />
          <div className="flex-1 bg-emerald-500/30" />
          <div className="flex-1 bg-emerald-500/45" />
        </div>
        <span className="flex items-center gap-1">
          <span className="h-2 w-3 rounded bg-emerald-400/40 inline-block" /> Positive
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Greeks View
// ═══════════════════════════════════════════════════════════════════

const SUB_VIEWS: { id: GreeksSubView; label: string }[] = [
  { id: 'exposure', label: 'Exposure' },
  { id: 'smile', label: 'IV Smile' },
  { id: 'heatmap', label: 'Heatmap' },
];

export function GreeksView({ chain, underlyingPrice, atmStrike, lotSize, zeroGammaLevel, callWallStrike, putWallStrike, dealerRegime, gexPredictedRangeLow, gexPredictedRangeHigh, netGex }: GreeksViewProps) {
  const [subView, setSubView] = useState<GreeksSubView>('exposure');

  return (
    <div className="space-y-2">
      {/* Sub-view selector */}
      <div className="flex items-center gap-1 px-1">
        {SUB_VIEWS.map((sv) => (
          <button
            key={sv.id}
            onClick={() => setSubView(sv.id)}
            className={cn(
              'px-2.5 py-1 md:py-0.5 text-[10px] font-medium rounded-full transition-all min-h-[32px] md:min-h-0 flex items-center',
              subView === sv.id
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white/70',
            )}
          >
            {sv.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {subView === 'exposure' && (
        <ExposureChart
          chain={chain}
          underlyingPrice={underlyingPrice}
          lotSize={lotSize}
          zeroGammaLevel={zeroGammaLevel}
          callWallStrike={callWallStrike}
          putWallStrike={putWallStrike}
          dealerRegime={dealerRegime}
          gexPredictedRangeLow={gexPredictedRangeLow}
          gexPredictedRangeHigh={gexPredictedRangeHigh}
          netGex={netGex}
        />
      )}
      {subView === 'smile' && (
        <IVSmileChart
          chain={chain}
          underlyingPrice={underlyingPrice}
          atmStrike={atmStrike}
        />
      )}
      {subView === 'heatmap' && (
        <HeatmapGrid
          chain={chain}
          atmStrike={atmStrike}
        />
      )}
    </div>
  );
}
