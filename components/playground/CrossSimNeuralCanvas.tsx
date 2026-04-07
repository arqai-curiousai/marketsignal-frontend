'use client';

import React, { useRef, useCallback, useMemo } from 'react';
import { PretextCanvas } from '@/components/pretext/PretextCanvas';
import { useMobileDetect } from '@/components/pretext/useMobileDetect';
import {
  colorWithAlpha,
  drawGlowingNode,
  drawConnection,
  drawDataPulse,
  drawSonarPulse,
  drawSimTooltip,
} from '@/components/pretext/canvasEffects';
import { drawTextWithOpacity } from '@/components/pretext/textRenderer';
import { SIM_FONTS, SIM_TEXT, TAB_ACCENT } from '@/components/pretext/sim/simCanvasTokens';
import { useSimulationContextSafe } from '@/context/SimulationContext';

interface CrossSimNeuralCanvasProps {
  activeTab: string;
  className?: string;
}

interface InsightEdge {
  fromTab: string;
  toTab: string;
  text: string;
}

const SIM_NODE_IDS = ['volatility', 'regimes', 'montecarlo', 'portfolio', 'backtesting', 'riskscore', 'scenarios', 'factors'] as const;

const SIM_NODE_LABELS: Record<string, string> = {
  volatility: 'VOL',
  regimes: 'REG',
  montecarlo: 'MC',
  portfolio: 'PORT',
  backtesting: 'BT',
  riskscore: 'RISK',
  scenarios: 'STRESS',
  factors: 'FAC',
};

/** Extract structured insights from simulation context */
function deriveInsights(ctx: ReturnType<typeof useSimulationContextSafe>): InsightEdge[] {
  if (!ctx) return [];
  const edges: InsightEdge[] = [];

  if (ctx.regime && ctx.volatility) {
    const regimeLabel = ctx.regime.currentState.label;
    const volPct = ctx.volatility.regime.percentile;
    const volLevel = volPct < 25 ? 'low' : volPct < 75 ? 'average' : 'elevated';
    edges.push({
      fromTab: 'regimes',
      toTab: 'volatility',
      text: `${regimeLabel} regime, ${volLevel} vol (P${volPct.toFixed(0)})`,
    });
  }

  if (ctx.riskScore && ctx.portfolio) {
    edges.push({
      fromTab: 'riskscore',
      toTab: 'portfolio',
      text: `Risk ${ctx.riskScore.compositeScore} (${ctx.riskScore.zone.label}), best: ${ctx.portfolio.bestStrategy}`,
    });
  }

  if (ctx.montecarlo && ctx.backtest) {
    const prob = (ctx.montecarlo.regimeAware.riskMetrics.probProfit * 100).toFixed(0);
    edges.push({
      fromTab: 'montecarlo',
      toTab: 'backtesting',
      text: `${prob}% profit probability`,
    });
  }

  if (ctx.scenario) {
    const worst = ctx.scenario.perStockImpact[0];
    if (worst) {
      edges.push({
        fromTab: 'scenarios',
        toTab: 'portfolio',
        text: `${ctx.scenario.scenario.label}: ${worst.ticker} ${(worst.deltaReturn * 100).toFixed(1)}pp`,
      });
    }
  }

  return edges;
}

export function CrossSimNeuralCanvas({ activeTab, className }: CrossSimNeuralCanvasProps) {
  const isMobile = useMobileDetect();
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const ctx = useSimulationContextSafe();

  const insights = useMemo(() => deriveInsights(ctx), [ctx]);

  // Which tabs have data
  const hasData = useMemo(() => {
    if (!ctx) return new Set<string>();
    const s = new Set<string>();
    if (ctx.volatility) s.add('volatility');
    if (ctx.regime) s.add('regimes');
    if (ctx.montecarlo) s.add('montecarlo');
    if (ctx.portfolio) s.add('portfolio');
    if (ctx.backtest) s.add('backtesting');
    if (ctx.riskScore) s.add('riskscore');
    if (ctx.scenario) s.add('scenarios');
    return s;
  }, [ctx]);

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);
  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  const draw = useCallback(
    (ctxCanvas: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const mouse = mouseRef.current;
      const nodeCount = SIM_NODE_IDS.length;
      const nodeSpacing = w / (nodeCount + 1);
      const cy = h / 2;

      // Node positions
      const nodePositions: Record<string, { x: number; y: number }> = {};
      SIM_NODE_IDS.forEach((id, i) => {
        nodePositions[id] = { x: nodeSpacing * (i + 1), y: cy };
      });

      // ── Insight connections ──
      insights.forEach((edge, ei) => {
        const from = nodePositions[edge.fromTab];
        const to = nodePositions[edge.toTab];
        if (!from || !to) return;

        const edgeColor = TAB_ACCENT[edge.fromTab] ?? 'rgba(167, 139, 250, 1)';
        const curveOff = 15 + ei * 5;

        drawConnection(ctxCanvas, from.x, from.y, to.x, to.y, edgeColor, 0.12, -curveOff);

        // Data pulse along edge
        const pulseCycle = 4000 + ei * 500;
        const pulseT = (time % pulseCycle) / pulseCycle;
        drawDataPulse(ctxCanvas, from.x, from.y, to.x, to.y, pulseT, edgeColor, 2, -curveOff);

        // Insight text at midpoint (desktop only)
        if (!isMobile) {
          const mx = (from.x + to.x) / 2;
          const my = cy - curveOff - 6;
          const textAlpha = 0.25 + Math.sin(time * 0.001 + ei) * 0.05;
          drawTextWithOpacity(ctxCanvas, edge.text, mx, my, SIM_FONTS.tiny, SIM_TEXT.secondary, textAlpha);
          // Center the text
          ctxCanvas.save();
          ctxCanvas.font = SIM_FONTS.tiny;
          const tw = ctxCanvas.measureText(edge.text).width;
          ctxCanvas.restore();
        }
      });

      // ── Nodes ──
      SIM_NODE_IDS.forEach((id) => {
        const pos = nodePositions[id];
        const color = TAB_ACCENT[id] ?? 'rgba(167, 139, 250, 1)';
        const active = hasData.has(id);
        const isCurrent = activeTab === id;
        const nodeR = isMobile ? 6 : 8;

        const intensity = active ? (isCurrent ? 0.9 : 0.5) : 0.1;
        drawGlowingNode(ctxCanvas, pos.x, pos.y, nodeR, color, intensity, time * 0.002);

        // Active tab sonar
        if (isCurrent) {
          const sonarT = (time % 3000) / 3000;
          drawSonarPulse(ctxCanvas, pos.x, pos.y, 16, sonarT, color);
        }

        // Label below
        ctxCanvas.save();
        ctxCanvas.font = SIM_FONTS.tiny;
        ctxCanvas.textAlign = 'center';
        ctxCanvas.textBaseline = 'top';
        ctxCanvas.fillStyle = colorWithAlpha(color, active ? 0.5 : 0.15);
        ctxCanvas.fillText(SIM_NODE_LABELS[id] ?? id, pos.x, pos.y + nodeR + 4);
        ctxCanvas.restore();
      });
    },
    [insights, hasData, activeTab, isMobile],
  );

  if (insights.length === 0 && hasData.size === 0) return null;

  return (
    <div className={`relative ${className ?? ''}`} style={{ height: isMobile ? 60 : 80 }}>
      <PretextCanvas
        draw={draw}
        fps={isMobile ? 30 : 60}
        ariaLabel={`Cross-simulation insights: ${insights.map((e) => e.text).join('; ')}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
