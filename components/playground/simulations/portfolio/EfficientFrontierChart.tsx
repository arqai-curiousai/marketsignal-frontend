'use client';

import React, { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type {
  IEfficientFrontierPoint,
  IPortfolioStrategy,
  IIndividualStock,
} from '@/types/simulation';
import { T, S } from '@/components/playground/pyramid/tokens';
import {
  getStrategyColor,
  getStrategyLabel,
  fmtReturn,
  fmtWeight,
  fmtSharpe,
  STRATEGY_COLORS,
} from './portfolio-tokens';

interface Props {
  frontier: IEfficientFrontierPoint[];
  strategies: IPortfolioStrategy[];
  individualStocks: IIndividualStock[];
  activeStrategy?: string;
  riskFreeRate?: number;
  className?: string;
}

// ─── Tooltip ─────────────────────────────────────────────────────

interface FrontierTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name?: string;
      type: 'frontier' | 'strategy' | 'stock';
      x: number;
      y: number;
      sharpe?: number;
      mode?: string;
    };
  }>;
}

function FrontierTooltip({ active, payload }: FrontierTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-lg border border-white/[0.08] bg-black/90 backdrop-blur-sm px-3 py-2 shadow-xl">
      {d.name && (
        <p className="text-[10px] font-semibold text-white/70 mb-1">{d.name}</p>
      )}
      <div className="space-y-0.5 text-[10px]">
        <p>
          Return: <span className="font-semibold text-amber-400">{fmtReturn(d.y)}</span>
        </p>
        <p>
          Volatility: <span className="font-semibold text-blue-400">{fmtWeight(d.x)}</span>
        </p>
        {d.sharpe != null && (
          <p className="text-white/40">
            Sharpe: {fmtSharpe(d.sharpe)}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Pulsing dot for active strategy ────────────────────────────

function PulsingDot({ cx, cy, fill }: { cx: number; cy: number; fill: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={fill} opacity={0.15}>
        <animate
          attributeName="r"
          values="8;14;8"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.15;0.05;0.15"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={cx} cy={cy} r={5} fill={fill} stroke="rgba(0,0,0,0.5)" strokeWidth={1.5} />
    </g>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function EfficientFrontierChart({
  frontier,
  strategies,
  individualStocks,
  activeStrategy,
  riskFreeRate = 0.065,
  className,
}: Props) {
  // Build data points
  const { frontierData, strategyData, stockData, domain } = useMemo(() => {
    const fData = frontier.map((p) => ({
      x: p.volatility,
      y: p.return,
      sharpe: p.sharpe,
      type: 'frontier' as const,
      name: undefined as string | undefined,
      mode: undefined as string | undefined,
    }));

    const sData = strategies.map((s) => ({
      x: s.metrics.annualVolatility,
      y: s.metrics.annualReturn,
      sharpe: s.metrics.sharpe,
      type: 'strategy' as const,
      name: getStrategyLabel(s.mode),
      mode: s.mode,
    }));

    const iData = individualStocks.map((s) => ({
      x: s.annualVolatility,
      y: s.annualReturn,
      sharpe: undefined as number | undefined,
      type: 'stock' as const,
      name: s.ticker,
      mode: undefined as string | undefined,
    }));

    // Compute domains
    const allX = [...fData.map((d) => d.x), ...sData.map((d) => d.x), ...iData.map((d) => d.x)];
    const allY = [...fData.map((d) => d.y), ...sData.map((d) => d.y), ...iData.map((d) => d.y)];

    const xMin = Math.max(0, Math.min(...allX) * 0.85);
    const xMax = Math.max(...allX) * 1.15;
    const yMin = Math.min(...allY, riskFreeRate) * (Math.min(...allY) >= 0 ? 0.85 : 1.15);
    const yMax = Math.max(...allY) * 1.15;

    return {
      frontierData: fData,
      strategyData: sData,
      stockData: iData,
      domain: { x: [xMin, xMax] as [number, number], y: [yMin, yMax] as [number, number] },
    };
  }, [frontier, strategies, individualStocks, riskFreeRate]);

  // CML line: from risk-free rate through max sharpe point
  const maxSharpeStrategy = strategies.reduce(
    (best, s) => (s.metrics.sharpe > (best?.metrics.sharpe ?? -Infinity) ? s : best),
    strategies[0],
  );

  const cmlPoints = useMemo(() => {
    if (!maxSharpeStrategy) return [];
    const tangentVol = maxSharpeStrategy.metrics.annualVolatility;
    const tangentRet = maxSharpeStrategy.metrics.annualReturn;
    const slope = (tangentRet - riskFreeRate) / tangentVol;
    const xEnd = domain.x[1];
    return [
      { x: 0, y: riskFreeRate },
      { x: xEnd, y: riskFreeRate + slope * xEnd },
    ];
  }, [maxSharpeStrategy, riskFreeRate, domain.x]);

  if (frontier.length === 0) {
    return (
      <div className={cn(S.card, 'p-4 flex items-center justify-center', className)}>
        <p className="text-xs text-muted-foreground py-8">
          Insufficient data for efficient frontier.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className={cn(T.heading, 'text-white/80')}>Efficient Frontier</h4>
        <span className={cn(T.badge, 'text-white/30')}>Mean-Variance</span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 10, right: 15, left: 5, bottom: 10 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.03)"
          />
          <XAxis
            dataKey="x"
            type="number"
            name="Volatility"
            domain={domain.x}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            label={{
              value: 'Volatility',
              position: 'bottom',
              fill: 'rgba(255,255,255,0.2)',
              fontSize: 9,
              offset: -2,
            }}
          />
          <YAxis
            dataKey="y"
            type="number"
            name="Return"
            domain={domain.y}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            width={50}
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            label={{
              value: 'Return',
              angle: -90,
              position: 'insideLeft',
              fill: 'rgba(255,255,255,0.2)',
              fontSize: 9,
              offset: 10,
            }}
          />

          <Tooltip content={<FrontierTooltip />} />

          {/* Risk-free rate reference */}
          <ReferenceLine
            y={riskFreeRate}
            stroke="rgba(148,163,184,0.2)"
            strokeDasharray="4 4"
          />

          {/* CML dashed line */}
          {cmlPoints.length === 2 && (
            <ReferenceLine
              segment={[
                { x: cmlPoints[0].x, y: cmlPoints[0].y },
                { x: cmlPoints[1].x, y: cmlPoints[1].y },
              ]}
              stroke="rgba(251,191,36,0.2)"
              strokeDasharray="6 4"
              strokeWidth={1}
            />
          )}

          {/* Frontier curve */}
          <Scatter
            data={frontierData}
            fill="#818CF8"
            line={{ stroke: '#818CF8', strokeWidth: 1.5 }}
            lineType="joint"
            shape="circle"
            animationBegin={0}
            animationDuration={1200}
            animationEasing="ease-out"
          >
            {frontierData.map((_, idx) => (
              <Cell
                key={`frontier-${idx}`}
                fill="#818CF8"
                opacity={0.4}
                r={2}
              />
            ))}
          </Scatter>

          {/* Individual stocks */}
          <Scatter
            data={stockData}
            shape="circle"
            animationBegin={300}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {stockData.map((_, idx) => (
              <Cell
                key={`stock-${idx}`}
                fill="#94A3B8"
                opacity={0.35}
                r={3}
              />
            ))}
          </Scatter>

          {/* Strategy portfolios */}
          <Scatter
            data={strategyData}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            shape={(props: any) => {
              const { cx, cy } = props as { cx: number; cy: number };
              const entry = props.payload as { mode?: string };
              const mode = entry?.mode ?? '';
              const color = getStrategyColor(mode);
              const isActive = mode === activeStrategy;

              if (isActive) {
                return <PulsingDot cx={cx} cy={cy} fill={color} />;
              }

              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={color}
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth={1.5}
                />
              );
            }}
            animationBegin={600}
            animationDuration={600}
            animationEasing="ease-out"
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
        {Object.entries(STRATEGY_COLORS).map(([mode, color]) => (
          <span key={mode} className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                backgroundColor: color,
                opacity: mode === activeStrategy ? 1 : 0.6,
                boxShadow: mode === activeStrategy ? `0 0 6px ${color}` : 'none',
              }}
            />
            <span className={cn(
              'text-[8px]',
              mode === activeStrategy ? 'text-white/60' : 'text-white/25',
            )}>
              {getStrategyLabel(mode)}
            </span>
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-slate-400 opacity-35 shrink-0" />
          <span className="text-[8px] text-white/25">Stocks</span>
        </span>
      </div>
    </motion.div>
  );
}
