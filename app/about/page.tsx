'use client';

import React, { useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Eye,
  Globe2,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { fadeUp, blurIn, staggerContainer, EASE_OUT_EXPO } from '@/components/landing/animations';
import { PretextCanvas } from '@/components/landing/pretext/PretextCanvas';
import { useMobileDetect } from '@/components/landing/pretext/useMobileDetect';
import {
  drawGlowingNode,
  drawConnection,
  drawDataPulse,
  drawSonarPulse,
  drawOrbitalRing,
  colorWithAlpha,
  dist,
} from '@/components/landing/pretext/canvasEffects';

/* ═══════════════════════════════════════════════════════════
   Hero Canvas — Dual-Agent Architecture Visualization
   Two agent nodes (Market Maker + Retail) sending analysis
   to a central Resolver node, with market data flowing in.
   ═══════════════════════════════════════════════════════════ */

const EMERALD = 'rgba(110, 231, 183, 0.8)';
const BLUE = 'rgba(96, 165, 250, 0.8)';
const VIOLET = 'rgba(167, 139, 250, 0.8)';
const AMBER = 'rgba(251, 191, 36, 0.8)';

function HeroCanvas() {
  const isMobile = useMobileDetect();
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  // Node positions (computed on first draw)
  const nodesRef = useRef<{
    mm: { x: number; y: number; label: string };
    ri: { x: number; y: number; label: string };
    resolver: { x: number; y: number; label: string };
    data: { x: number; y: number; label: string }[];
    biases: string[];
    pulses: { from: number; to: number; progress: number; speed: number; color: string }[];
  } | null>(null);

  const sizeRef = useRef({ w: 0, h: 0 });

  const labelFont = isMobile ? '600 9px Sora, system-ui, sans-serif' : '600 11px Sora, system-ui, sans-serif';
  const smallFont = isMobile ? '400 7px Inter, system-ui, sans-serif' : '400 8px Inter, system-ui, sans-serif';
  const bigFont = isMobile ? '700 12px Sora, system-ui, sans-serif' : '700 14px Sora, system-ui, sans-serif';

  const initNodes = useCallback((w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const spread = Math.min(w, h) * 0.35;

    const dataLabels = isMobile
      ? ['NIFTY', 'EUR/USD', 'GOLD', 'VIX']
      : ['NIFTY 22,847', 'EUR/USD 1.0842', 'GOLD 2,847', 'VIX 23.1', 'CRUDE 72.30', 'SPX 5,412'];

    const dataNodes = dataLabels.map((label, i) => {
      const angle = -Math.PI / 2 + (i / dataLabels.length) * Math.PI * 2;
      const r = spread * (isMobile ? 0.85 : 0.95);
      return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, label };
    });

    const pulses: { from: number; to: number; progress: number; speed: number; color: string }[] = [];
    // Data → MM, Data → RI
    for (let i = 0; i < dataNodes.length; i++) {
      pulses.push({ from: i, to: -1, progress: Math.random(), speed: 0.002 + Math.random() * 0.002, color: EMERALD }); // to MM
      pulses.push({ from: i, to: -2, progress: Math.random(), speed: 0.002 + Math.random() * 0.002, color: BLUE }); // to RI
    }
    // MM → Resolver, RI → Resolver
    pulses.push({ from: -1, to: -3, progress: 0, speed: 0.003, color: EMERALD });
    pulses.push({ from: -1, to: -3, progress: 0.5, speed: 0.003, color: EMERALD });
    pulses.push({ from: -2, to: -3, progress: 0.2, speed: 0.003, color: BLUE });
    pulses.push({ from: -2, to: -3, progress: 0.7, speed: 0.003, color: BLUE });

    nodesRef.current = {
      mm: { x: cx - spread * 0.5, y: cy - spread * 0.3, label: 'Market Maker' },
      ri: { x: cx + spread * 0.5, y: cy - spread * 0.3, label: 'Retail Investor' },
      resolver: { x: cx, y: cy + spread * 0.35, label: 'Resolver' },
      data: dataNodes,
      biases: ['Accumulating', 'Distributing', 'Neutral', 'Bullish', 'Bearish', 'Confused'],
      pulses,
    };
  }, [isMobile]);

  const handleMouseMove = useCallback((x: number, y: number) => { mouseRef.current = { x, y }; }, []);
  const handleMouseLeave = useCallback(() => { mouseRef.current = null; }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
    if (sizeRef.current.w !== w || sizeRef.current.h !== h) {
      sizeRef.current = { w, h };
      initNodes(w, h);
    }
    const nodes = nodesRef.current;
    if (!nodes) return;

    const mouse = mouseRef.current;
    const cx = w / 2;
    const cy = h / 2;

    // Helper: get node position by index (-1=MM, -2=RI, -3=Resolver, 0+=data)
    const getPos = (idx: number) => {
      if (idx === -1) return nodes.mm;
      if (idx === -2) return nodes.ri;
      if (idx === -3) return nodes.resolver;
      return nodes.data[idx] ?? { x: cx, y: cy };
    };

    /* ── Sonar from resolver ── */
    const sonar = (time % 4000) / 4000;
    drawSonarPulse(ctx, nodes.resolver.x, nodes.resolver.y, Math.min(w, h) * 0.2, sonar, VIOLET);

    /* ── Connections: Data → Agents ── */
    nodes.data.forEach((d) => {
      const mmAlpha = mouse && dist(mouse.x, mouse.y, nodes.mm.x, nodes.mm.y) < 80 ? 0.12 : 0.04;
      const riAlpha = mouse && dist(mouse.x, mouse.y, nodes.ri.x, nodes.ri.y) < 80 ? 0.12 : 0.04;
      drawConnection(ctx, d.x, d.y, nodes.mm.x, nodes.mm.y, EMERALD, mmAlpha);
      drawConnection(ctx, d.x, d.y, nodes.ri.x, nodes.ri.y, BLUE, riAlpha);
    });

    /* ── Connections: Agents → Resolver ── */
    const mmResAlpha = mouse && dist(mouse.x, mouse.y, nodes.resolver.x, nodes.resolver.y) < 80 ? 0.18 : 0.07;
    drawConnection(ctx, nodes.mm.x, nodes.mm.y, nodes.resolver.x, nodes.resolver.y, EMERALD, mmResAlpha, 30);
    drawConnection(ctx, nodes.ri.x, nodes.ri.y, nodes.resolver.x, nodes.resolver.y, BLUE, mmResAlpha, -30);

    /* ── Data pulses ── */
    nodes.pulses.forEach((p) => {
      p.progress = (p.progress + p.speed) % 1;
      const from = getPos(p.from);
      const to = getPos(p.to);
      const curveOffset = p.to === -3 ? (p.from === -1 ? 30 : -30) : undefined;
      drawDataPulse(ctx, from.x, from.y, to.x, to.y, p.progress, p.color, 1.5, curveOffset);
    });

    /* ── Data nodes ── */
    nodes.data.forEach((d) => {
      const isHovered = mouse && dist(mouse.x, mouse.y, d.x, d.y) < 40;
      const intensity = isHovered ? 0.7 : 0.2;
      drawGlowingNode(ctx, d.x, d.y, isMobile ? 6 : 8, 'rgba(255,255,255,0.6)', intensity, time * 0.002);

      ctx.save();
      ctx.font = smallFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = colorWithAlpha('rgba(255,255,255,0.8)', isHovered ? 0.8 : 0.35);
      ctx.fillText(d.label, d.x, d.y + (isMobile ? 14 : 18));
      ctx.restore();
    });

    /* ── Agent nodes ── */
    const agentPairs: [typeof nodes.mm, string, string, string][] = [
      [nodes.mm, EMERALD, 'Market Maker', nodes.biases[Math.floor(time / 3000) % 3]],
      [nodes.ri, BLUE, 'Retail Investor', nodes.biases[3 + Math.floor((time + 1500) / 3000) % 3]],
    ];
    agentPairs.forEach(([node, color, label, bias]) => {
      const isHovered = mouse && dist(mouse.x, mouse.y, node.x, node.y) < 60;
      const intensity = isHovered ? 0.9 : 0.5;
      const r = isMobile ? 22 : 30;
      drawGlowingNode(ctx, node.x, node.y, r, color, intensity, time * 0.0018);

      ctx.save();
      ctx.font = labelFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = colorWithAlpha(color, 0.3);
      ctx.shadowBlur = isHovered ? 12 : 6;
      ctx.fillStyle = colorWithAlpha(color, isHovered ? 0.9 : 0.6);
      ctx.fillText(label, node.x, node.y - 4);
      ctx.shadowBlur = 0;
      ctx.font = smallFont;
      ctx.fillStyle = colorWithAlpha(color, isHovered ? 0.7 : 0.35);
      ctx.fillText(bias, node.x, node.y + 10);
      ctx.restore();

      // Hover: show confidence bar
      if (isHovered && !isMobile) {
        const conf = 0.65 + Math.sin(time * 0.001) * 0.15;
        const barW = 50;
        const barH = 4;
        const bx = node.x - barW / 2;
        const by = node.y + r + 20;
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(bx, by, barW, barH);
        ctx.fillStyle = colorWithAlpha(color, 0.5);
        ctx.fillRect(bx, by, barW * conf, barH);
        ctx.font = '400 7px Sora, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = colorWithAlpha(color, 0.5);
        ctx.fillText(`Confidence: ${Math.round(conf * 100)}%`, node.x, by + 14);
      }
    });

    /* ── Resolver node ── */
    const resHovered = mouse && dist(mouse.x, mouse.y, nodes.resolver.x, nodes.resolver.y) < 60;
    const resR = isMobile ? 26 : 36;
    drawGlowingNode(ctx, nodes.resolver.x, nodes.resolver.y, resR, VIOLET, resHovered ? 0.9 : 0.7, time * 0.0015);

    // Orbital rings around resolver
    if (!isMobile) {
      drawOrbitalRing(ctx, nodes.resolver.x, nodes.resolver.y, resR * 1.3, resR * 0.8, time * 0.0004, VIOLET, 0.1, [3, 6]);
      drawOrbitalRing(ctx, nodes.resolver.x, nodes.resolver.y, resR * 1.6, resR * 1.0, -time * 0.0003, VIOLET, 0.06, [2, 8]);
    }

    const outcomes = ['DIVERGENCE', 'CONSENSUS', 'MIXED'];
    const currentOutcome = outcomes[Math.floor(time / 4000) % 3];
    ctx.save();
    ctx.font = bigFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = colorWithAlpha(VIOLET, 0.4);
    ctx.shadowBlur = 10;
    ctx.fillStyle = colorWithAlpha(VIOLET, resHovered ? 0.95 : 0.7);
    ctx.fillText(currentOutcome, nodes.resolver.x, nodes.resolver.y - 3);
    ctx.shadowBlur = 0;
    ctx.font = smallFont;
    ctx.fillStyle = colorWithAlpha(VIOLET, 0.4);
    ctx.fillText('Signal Resolver', nodes.resolver.x, nodes.resolver.y + 12);
    ctx.restore();

    // Hover: show conflict details
    if (resHovered && !isMobile) {
      ctx.save();
      ctx.font = '400 8px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText('MM: Accumulating → RI: Bullish', nodes.resolver.x, nodes.resolver.y + resR + 16);
      ctx.fillStyle = colorWithAlpha(VIOLET, 0.5);
      ctx.fillText(`Type: ${currentOutcome} · Conviction: High`, nodes.resolver.x, nodes.resolver.y + resR + 28);
      ctx.restore();
    }

    /* ── Mouse glow ── */
    if (mouse) {
      const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 80);
      grad.addColorStop(0, 'rgba(110, 231, 183, 0.02)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 80, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [initNodes, isMobile, labelFont, smallFont, bigFont]);

  return (
    <PretextCanvas
      draw={draw}
      fps={isMobile ? 30 : 60}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 1 — Hero: Split layout with Architecture Canvas
   ═══════════════════════════════════════════════════════════ */

function ScrollIndicator() {
  return (
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.6, duration: 1 }}
    >
      <motion.div
        className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-white/5"
        animate={{ scaleY: [1, 0.6, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="w-1.5 h-1.5 rounded-full bg-white/20"
        animate={{ y: [0, 4, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

function HeroSection() {
  return (
    <section className="grain-overlay relative w-full min-h-[90vh] flex items-center px-6 pt-24 pb-20 overflow-hidden">
      {/* Aurora gradient mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-brand-emerald/[0.04] blur-[150px] rounded-full"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-10%] left-[-5%] w-[45%] h-[45%] bg-brand-violet/[0.04] blur-[130px] rounded-full"
          animate={{ x: [0, -20, 0], y: [0, 25, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-brand-blue/[0.03] blur-[120px] rounded-full"
          animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="container max-w-[1400px] mx-auto relative z-10 grid grid-cols-1 md:grid-cols-[52%_48%] gap-8 md:gap-4 items-center">
        {/* LEFT: Hero Copy */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          className="text-left"
        >
          <motion.span
            variants={fadeUp}
            className="inline-block text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-emerald rounded-full px-5 py-2 mb-8 gradient-border-animated"
          >
            About arQai
          </motion.span>

          <motion.h1
            variants={blurIn}
            className="font-display text-4xl sm:text-5xl md:text-5xl lg:text-6xl headline-xl text-white mb-8"
          >
            <span className="font-bold">Institutional-Grade</span>
            <br />
            <span className="font-light bg-gradient-to-r from-brand-emerald via-brand-blue to-brand-emerald bg-[length:200%_auto] bg-clip-text text-transparent">
              Market Intelligence
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed mb-4"
          >
            Meridian by arQai brings the same analytical tools used by institutional
            trading desks to every investor. Two independent AI agents analyze every data point.
            A deterministic resolver settles every disagreement.
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="text-base text-muted-foreground/70 max-w-md leading-relaxed"
          >
            No black boxes. No guesswork. Built in India. Watching the world.
          </motion.p>
        </motion.div>

        {/* RIGHT: Architecture Canvas */}
        <motion.div
          className="relative w-full h-[340px] md:h-[480px] lg:h-[560px]"
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(12px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ delay: 0.8, duration: 1.5, ease: EASE_OUT_EXPO }}
        >
          <HeroCanvas />
        </motion.div>
      </div>

      <ScrollIndicator />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Timeline Canvas — Mini canvas per milestone card
   ═══════════════════════════════════════════════════════════ */

function TimelineMiniCanvas({ type }: { type: 'agents' | 'exchanges' | 'forex' | 'analytics' | 'evolving' }) {
  const isMobile = useMobileDetect();

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
    const cx = w / 2;
    const cy = h / 2;

    switch (type) {
      case 'agents': {
        // Two agent nodes sending to a resolver
        const mmX = cx - w * 0.3;
        const riX = cx + w * 0.3;
        const resY = cy + h * 0.25;
        drawGlowingNode(ctx, mmX, cy - 8, 10, EMERALD, 0.4, time * 0.002);
        drawGlowingNode(ctx, riX, cy - 8, 10, BLUE, 0.4, time * 0.002 + 1);
        drawGlowingNode(ctx, cx, resY, 12, VIOLET, 0.5, time * 0.0015);
        drawConnection(ctx, mmX, cy - 8, cx, resY, EMERALD, 0.08, 15);
        drawConnection(ctx, riX, cy - 8, cx, resY, BLUE, 0.08, -15);
        const p1 = (time * 0.0003) % 1;
        const p2 = ((time * 0.0003) + 0.5) % 1;
        drawDataPulse(ctx, mmX, cy - 8, cx, resY, p1, EMERALD, 1.5, 15);
        drawDataPulse(ctx, riX, cy - 8, cx, resY, p2, BLUE, 1.5, -15);
        // Labels
        ctx.font = '600 7px Sora, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = colorWithAlpha(EMERALD, 0.5);
        ctx.fillText('MM', mmX, cy - 24);
        ctx.fillStyle = colorWithAlpha(BLUE, 0.5);
        ctx.fillText('RI', riX, cy - 24);
        ctx.fillStyle = colorWithAlpha(VIOLET, 0.5);
        ctx.fillText('RESOLVE', cx, resY + 22);
        break;
      }
      case 'exchanges': {
        // 5 exchange nodes in a semicircle
        const labels = ['NSE', 'NASDAQ', 'NYSE', 'LSE', 'HKSE'];
        labels.forEach((label, i) => {
          const angle = -Math.PI + (i / (labels.length - 1)) * Math.PI;
          const r = Math.min(w, h) * 0.32;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r * 0.6;
          drawGlowingNode(ctx, x, y, 8, EMERALD, 0.3, time * 0.002 + i);
          ctx.font = '500 6px Sora, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = colorWithAlpha(EMERALD, 0.45);
          ctx.fillText(label, x, y + 16);
        });
        // Center count
        ctx.font = '700 14px Sora, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillText('260+', cx, cy);
        ctx.font = '400 7px Sora, system-ui, sans-serif';
        ctx.fillText('stocks', cx, cy + 14);
        break;
      }
      case 'forex': {
        // Currency pairs flowing
        const pairs = ['EUR/USD', 'GBP/JPY', 'AUD/NZD', 'USD/INR', 'USD/CAD'];
        const sessionColors = [BLUE, AMBER, EMERALD, EMERALD, AMBER];
        pairs.forEach((pair, i) => {
          const y = 12 + (i / (pairs.length - 1)) * (h - 24);
          const drift = Math.sin(time * 0.001 + i * 1.2) * w * 0.1;
          const x = cx + drift;
          ctx.save();
          ctx.font = '500 8px Sora, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = colorWithAlpha(sessionColors[i], 0.2);
          ctx.shadowBlur = 6;
          ctx.fillStyle = colorWithAlpha(sessionColors[i], 0.4);
          ctx.fillText(pair, x, y);
          ctx.restore();
        });
        // "42" watermark
        ctx.font = '700 28px Sora, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillText('42', cx, cy);
        break;
      }
      case 'analytics': {
        // Correlation matrix mini
        const size = 5;
        const cellSize = Math.min(w, h) / (size + 2);
        const ox = cx - (size * cellSize) / 2;
        const oy = cy - (size * cellSize) / 2;
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const val = r === c ? 1 : Math.sin(r * 3 + c * 7 + time * 0.001) * 0.5 + 0.5;
            const isPos = val > 0.5;
            const intensity = Math.abs(val - 0.5) * 2;
            const color = isPos ? BLUE : AMBER;
            ctx.fillStyle = colorWithAlpha(color, intensity * 0.15);
            ctx.fillRect(ox + c * cellSize + 1, oy + r * cellSize + 1, cellSize - 2, cellSize - 2);
          }
        }
        break;
      }
      case 'evolving': {
        // Pulsing concentric rings
        for (let i = 0; i < 3; i++) {
          const phase = (time * 0.0008 + i * 0.33) % 1;
          drawSonarPulse(ctx, cx, cy, Math.min(w, h) * 0.4, phase, EMERALD);
        }
        ctx.font = '500 8px Sora, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillText('LIVE', cx, cy);
        break;
      }
    }
  }, [type, isMobile]);

  return (
    <div className="w-full h-[80px] relative mb-3">
      <PretextCanvas draw={draw} fps={30} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 2 — Timeline: Our Journey
   ═══════════════════════════════════════════════════════════ */

const milestones = [
  {
    year: '2024',
    title: 'The Dual-Agent Engine',
    canvasType: 'agents' as const,
    description:
      'Meridian launched with a first-of-its-kind analytical architecture: two independent AI agents — a Market Maker (institutional perspective) and a Retail Investor (crowd sentiment) — analyze every market snapshot. A deterministic conflict resolver maps their biases into actionable pattern classifications.',
  },
  {
    year: '2025 Q1',
    title: 'Multi-Exchange Expansion',
    canvasType: 'exchanges' as const,
    description:
      'Coverage expanded from NSE alone to 5 global stock exchanges — NASDAQ, NYSE, LSE, and HKSE — with 260+ tracked stocks. Sector intelligence dashboards brought heatmaps, relative rotation graphs, and valuation aggregates across all exchanges.',
  },
  {
    year: '2025 Q1',
    title: 'Forex Analytics & 42 Pairs',
    canvasType: 'forex' as const,
    description:
      'A dedicated forex analytics suite launched with 42 global currency pairs across 17 currencies: real-time heatmaps, currency strength meters, carry trade analysis, multi-timeframe technicals, and session tracking across Asia, London, and New York.',
  },
  {
    year: '2025 Q2',
    title: 'Analytics Intelligence Suite',
    canvasType: 'analytics' as const,
    description:
      'Deep analytics dashboards arrived — DCC-GARCH dynamic correlations, F&O option chain analysis with Greeks and GEX, multi-timeframe pattern detection, volatility intelligence with GARCH forecasts, and a news intelligence engine with sentiment scoring from 20+ sources.',
  },
  {
    year: 'Now',
    title: 'Always Evolving',
    canvasType: 'evolving' as const,
    description:
      'The platform keeps growing. The Simulation Lab, advanced portfolio analytics, and expanded AI capabilities are in continuous development. Every 5 minutes, the engine refreshes. Every day, the intelligence gets sharper.',
  },
];

function TimelineSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="w-full py-24 md:py-32 px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <div className="container max-w-3xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="mb-16 text-center"
        >
          <motion.span variants={fadeUp} className="section-label">
            Our Journey
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="font-display text-3xl sm:text-4xl md:text-5xl headline-xl text-white"
          >
            Built insight by insight
          </motion.h2>
        </motion.div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[23px] md:left-1/2 md:-translate-x-px top-0 bottom-0 w-[2px]">
            <motion.div
              className="w-full h-full bg-gradient-to-b from-brand-emerald via-brand-blue to-brand-violet"
              initial={{ scaleY: 0 }}
              animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: 'top' }}
            />
          </div>

          <div className="space-y-12">
            {milestones.map((milestone, i) => {
              const isEven = i % 2 === 0;
              return (
                <TimelineCard
                  key={i}
                  milestone={milestone}
                  index={i}
                  isEven={isEven}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineCard({
  milestone,
  index,
  isEven,
}: {
  milestone: (typeof milestones)[0];
  index: number;
  isEven: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex items-start gap-6 md:gap-0 ${
        isEven ? 'md:flex-row' : 'md:flex-row-reverse'
      }`}
    >
      {/* Dot on timeline */}
      <div className="absolute left-[16px] md:left-1/2 md:-translate-x-1/2 top-1 z-10">
        <motion.div
          className="w-4 h-4 rounded-full border-2 border-brand-emerald bg-brand-slate"
          animate={inView ? { boxShadow: '0 0 12px rgba(110, 231, 183, 0.5)' } : {}}
          transition={{ delay: 0.3 + index * 0.1 }}
        />
      </div>

      {/* Card */}
      <div className={`ml-12 md:ml-0 md:w-[calc(50%-2rem)] ${isEven ? 'md:pr-0 md:mr-auto' : 'md:pl-0 md:ml-auto'}`}>
        <div className="glass-card p-5 md:p-6">
          <TimelineMiniCanvas type={milestone.canvasType} />
          <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-emerald bg-brand-emerald/10 px-3 py-1 rounded-full mb-3">
            {milestone.year}
          </span>
          <h3 className="text-lg font-semibold text-white mb-2">{milestone.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {milestone.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Values Canvas — Mini visualization per value card
   ═══════════════════════════════════════════════════════════ */

function ValueMiniCanvas({ type }: { type: 'transparency' | 'global' | 'compliance' | 'tools' }) {
  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
    const cx = w / 2;
    const cy = h / 2;

    switch (type) {
      case 'transparency': {
        // Dual-agent nodes connected to a resolver
        const mmX = w * 0.18, riX = w * 0.82, resolverX = cx;
        const nodeY = cy - 4;
        const resolverY = cy + 18;

        // Connections
        drawConnection(ctx, mmX, nodeY, resolverX, resolverY, EMERALD, 0.1);
        drawConnection(ctx, riX, nodeY, resolverX, resolverY, BLUE, 0.1);

        // Data pulses
        const p1 = (time % 3000) / 3000;
        const p2 = ((time + 1500) % 3000) / 3000;
        drawDataPulse(ctx, mmX, nodeY, resolverX, resolverY, p1, EMERALD, 1.5);
        drawDataPulse(ctx, riX, nodeY, resolverX, resolverY, p2, BLUE, 1.5);

        // Nodes
        drawGlowingNode(ctx, mmX, nodeY, 10, EMERALD, 0.5, time * 0.002);
        drawGlowingNode(ctx, riX, nodeY, 10, BLUE, 0.5, time * 0.002 + 1);
        drawGlowingNode(ctx, resolverX, resolverY, 8, VIOLET, 0.6, time * 0.002 + 2);

        // Labels
        ctx.font = '600 7px Sora, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colorWithAlpha(EMERALD, 0.6);
        ctx.fillText('MM', mmX, nodeY);
        ctx.fillStyle = colorWithAlpha(BLUE, 0.6);
        ctx.fillText('RI', riX, nodeY);

        // Confidence bars next to resolver
        const barW = w * 0.22;
        const barX = cx - barW / 2;
        const mmConf = 0.78 + Math.sin(time * 0.001) * 0.05;
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(barX, resolverY + 12, barW, 4);
        ctx.fillStyle = colorWithAlpha(EMERALD, 0.4);
        ctx.fillRect(barX, resolverY + 12, barW * mmConf, 4);
        break;
      }
      case 'global': {
        // Mini globe outline with exchange dots
        const globeR = Math.min(w, h) * 0.28;

        // Globe circle
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.strokeStyle = BLUE;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(cx, cy, globeR, 0, Math.PI * 2);
        ctx.stroke();
        // Equator
        ctx.beginPath();
        ctx.ellipse(cx, cy, globeR, globeR * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Meridian
        ctx.beginPath();
        ctx.ellipse(cx, cy, globeR * 0.15, globeR, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Sonar from center
        drawSonarPulse(ctx, cx, cy, globeR * 0.6, (time % 3500) / 3500, BLUE);

        // Exchange dots
        const exchanges = ['NSE', 'NASDAQ', 'NYSE', 'LSE', 'HKSE', 'FX'];
        exchanges.forEach((ex, i) => {
          const angle = (i / exchanges.length) * Math.PI * 2 - Math.PI / 2;
          const r = globeR * 0.85;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r * 0.75;
          const breathe = Math.sin(time * 0.002 + i * 1.1) * 0.15;

          drawGlowingNode(ctx, x, y, 5, BLUE, 0.35 + breathe, time * 0.002 + i);
          drawConnection(ctx, cx, cy, x, y, BLUE, 0.04);

          ctx.font = '500 6px Sora, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = colorWithAlpha(BLUE, 0.5 + breathe);
          ctx.fillText(ex, x, y);
        });
        break;
      }
      case 'compliance': {
        // Shield shape with sonar rings and labels
        const shieldR = Math.min(w, h) * 0.22;

        // Shield outline
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.strokeStyle = VIOLET;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy - shieldR);
        ctx.quadraticCurveTo(cx + shieldR * 1.2, cy - shieldR * 0.4, cx + shieldR * 0.8, cy + shieldR * 0.3);
        ctx.quadraticCurveTo(cx, cy + shieldR * 1.1, cx, cy + shieldR * 1.1);
        ctx.quadraticCurveTo(cx, cy + shieldR * 1.1, cx - shieldR * 0.8, cy + shieldR * 0.3);
        ctx.quadraticCurveTo(cx - shieldR * 1.2, cy - shieldR * 0.4, cx, cy - shieldR);
        ctx.stroke();
        ctx.restore();

        // Sonar rings
        drawSonarPulse(ctx, cx, cy, shieldR * 1.2, (time % 4000) / 4000, VIOLET);
        drawSonarPulse(ctx, cx, cy, shieldR * 0.8, ((time + 2000) % 4000) / 4000, VIOLET);

        // Checkmark inside
        ctx.save();
        ctx.globalAlpha = 0.4 + Math.sin(time * 0.0015) * 0.1;
        ctx.strokeStyle = VIOLET;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy);
        ctx.lineTo(cx - 1, cy + 6);
        ctx.lineTo(cx + 8, cy - 5);
        ctx.stroke();
        ctx.restore();

        // Labels
        const lines = ['Analytics Only', 'No Advice', 'Compliant'];
        ctx.font = '500 7px Sora, system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        lines.forEach((line, i) => {
          const alpha = 0.35 + Math.sin(time * 0.0015 + i * 0.8) * 0.1;
          ctx.fillStyle = colorWithAlpha(VIOLET, alpha);
          ctx.fillText(line, w - 8, cy - 16 + i * 16);
        });
        break;
      }
      case 'tools': {
        // 4 nodes in 2x2 grid connected by network
        const tools = [
          { name: 'DCC-GARCH', x: w * 0.25, y: cy - 12 },
          { name: 'Greeks', x: w * 0.75, y: cy - 12 },
          { name: 'Patterns', x: w * 0.25, y: cy + 16 },
          { name: 'Monte Carlo', x: w * 0.75, y: cy + 16 },
        ];
        const SAGE = 'rgba(134, 239, 172, 0.8)';

        // Connections (full mesh)
        for (let i = 0; i < tools.length; i++) {
          for (let j = i + 1; j < tools.length; j++) {
            drawConnection(ctx, tools[i].x, tools[i].y, tools[j].x, tools[j].y, SAGE, 0.05);
          }
        }

        // Data pulses cycling
        const pulseIdx = Math.floor((time / 2000) % 4);
        const nextIdx = (pulseIdx + 1) % 4;
        const progress = ((time % 2000) / 2000);
        drawDataPulse(ctx, tools[pulseIdx].x, tools[pulseIdx].y, tools[nextIdx].x, tools[nextIdx].y, progress, SAGE, 1.5);

        // Nodes + labels
        tools.forEach((tool, i) => {
          const breathe = Math.sin(time * 0.002 + i * 1.5) * 0.12;
          drawGlowingNode(ctx, tool.x, tool.y, 6, SAGE, 0.4 + breathe, time * 0.002 + i);

          ctx.font = '500 7px Sora, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = colorWithAlpha(SAGE, 0.55 + breathe);
          ctx.fillText(tool.name, tool.x, tool.y);
        });
        break;
      }
    }
  }, [type]);

  return (
    <div className="w-full h-[80px] relative mb-3">
      <PretextCanvas draw={draw} fps={30} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 3 — Values: What We Believe
   ═══════════════════════════════════════════════════════════ */

const values = [
  {
    icon: Eye,
    title: 'AI Transparency',
    canvasType: 'transparency' as const,
    description:
      'Every analysis shows both agent perspectives — Market Maker and Retail Investor — plus the conflict type. You see why the AI decided, not just what it decided. Confidence scores are capped to prevent hallucination overreach.',
    color: 'emerald' as const,
  },
  {
    icon: Globe2,
    title: 'Built in India, Watching the World',
    canvasType: 'global' as const,
    description:
      'Built on NSE and NIFTY 50, then expanded to NASDAQ, NYSE, LSE, and HKSE. 42 forex pairs across 17 currencies — G10, Scandinavian, Asia-Pacific, and Emerging Markets. 5 MCX commodities and 20+ news sources across 6 regions.',
    color: 'blue' as const,
  },
  {
    icon: ShieldCheck,
    title: 'Information, Not Advice',
    canvasType: 'compliance' as const,
    description:
      'Meridian is an analytics platform, not a tipster. We surface patterns, data, and intelligence — never buy or sell recommendations. Regulatory-compliant by design, with content filtering built into every response.',
    color: 'violet' as const,
  },
  {
    icon: BarChart3,
    title: 'Institutional Tools for Everyone',
    canvasType: 'tools' as const,
    description:
      'DCC-GARCH correlations, F&O Greeks with gamma exposure, multi-timeframe pattern detection, volatility intelligence with GARCH forecasts. Tools that used to cost thousands per month, accessible to every trader.',
    color: 'sage' as const,
  },
];

const colorMap = {
  emerald: {
    glow: 'rgba(110, 231, 183, 0.15)',
    border: 'hover:border-brand-emerald/30',
    icon: 'text-brand-emerald',
    bg: 'bg-brand-emerald/10',
  },
  blue: {
    glow: 'rgba(74, 222, 128, 0.15)',
    border: 'hover:border-brand-blue/30',
    icon: 'text-brand-blue',
    bg: 'bg-brand-blue/10',
  },
  violet: {
    glow: 'rgba(34, 197, 94, 0.15)',
    border: 'hover:border-brand-violet/30',
    icon: 'text-brand-violet',
    bg: 'bg-brand-violet/10',
  },
  sage: {
    glow: 'rgba(134, 239, 172, 0.15)',
    border: 'hover:border-brand-sage/30',
    icon: 'text-brand-sage',
    bg: 'bg-brand-sage/10',
  },
};

function ValuesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="w-full py-24 md:py-32 px-6 relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="container max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="mb-16 text-center"
        >
          <motion.span variants={fadeUp} className="section-label">
            Our Principles
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="font-display text-3xl sm:text-4xl md:text-5xl headline-xl text-white"
          >
            What we believe
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {values.map((value) => {
            const Icon = value.icon;
            const colors = colorMap[value.color];
            return (
              <motion.div
                key={value.title}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`bento-card bg-white/[0.04] border-white/[0.06] group ${colors.border}`}
              >
                <ValueMiniCanvas type={value.canvasType} />
                <div className={`inline-flex p-2.5 rounded-xl ${colors.bg} mb-4`}>
                  <Icon className={`h-5 w-5 ${colors.icon}`} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-brand-emerald transition-colors duration-300">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   CTA Canvas — Converging data streams
   ═══════════════════════════════════════════════════════════ */

function CTACanvas() {
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; text: string; alpha: number }[] | null>(null);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, _time: number) => {
    const cx = w / 2;
    const cy = h / 2;

    // Lazy init
    if (!particlesRef.current) {
      const values = ['NIFTY', 'SPX', 'EUR/USD', 'GOLD', 'VIX', '22,847', '1.08', '2,847', '23.1', '72.30',
        'DCC-GARCH', 'Greeks', 'Monte Carlo', 'RSI', 'MACD', 'Patterns', 'Sectors', '260+'];
      particlesRef.current = values.map((text) => {
        const edge = Math.floor(Math.random() * 4);
        const x = edge === 0 ? Math.random() * w : edge === 1 ? w + 10 : edge === 2 ? Math.random() * w : -10;
        const y = edge === 0 ? -10 : edge === 1 ? Math.random() * h : edge === 2 ? h + 10 : Math.random() * h;
        return { x, y, vx: 0, vy: 0, text, alpha: 0.06 + Math.random() * 0.06 };
      });
    }

    const particles = particlesRef.current;
    particles.forEach((p) => {
      const dx = cx - p.x;
      const dy = cy - p.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = 0.3 / Math.pow(d, 0.8);
      p.vx += (dx / d) * force + (-dy / d) * force * 0.2;
      p.vy += (dy / d) * force + (dx / d) * force * 0.2;
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.x += p.vx;
      p.y += p.vy;

      if (d < 60) {
        p.alpha -= 0.01;
        if (p.alpha <= 0) {
          const edge = Math.floor(Math.random() * 4);
          p.x = edge === 0 ? Math.random() * w : edge === 1 ? w + 10 : edge === 2 ? Math.random() * w : -10;
          p.y = edge === 0 ? -10 : edge === 1 ? Math.random() * h : edge === 2 ? h + 10 : Math.random() * h;
          p.vx = 0;
          p.vy = 0;
          p.alpha = 0.06 + Math.random() * 0.06;
        }
      }
      if (p.alpha <= 0) return;

      const brightness = Math.min(1, 150 / d);
      ctx.save();
      ctx.globalAlpha = p.alpha * brightness;
      ctx.font = '400 8px Sora, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = colorWithAlpha(EMERALD, 0.7);
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    });
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <PretextCanvas draw={draw} fps={30} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 4 — CTA: Join The Platform
   ═══════════════════════════════════════════════════════════ */

const starPositions = [
  { left: '12%', top: '18%', delay: 0 },
  { left: '85%', top: '22%', delay: 0.8 },
  { left: '25%', top: '75%', delay: 1.2 },
  { left: '72%', top: '80%', delay: 0.4 },
  { left: '8%', top: '50%', delay: 1.6 },
  { left: '92%', top: '55%', delay: 0.6 },
  { left: '45%', top: '12%', delay: 1.0 },
  { left: '55%', top: '88%', delay: 1.4 },
];

function CTASection() {
  return (
    <section className="relative w-full py-32 md:py-40 px-6 overflow-hidden">
      {/* Aurora blobs */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-emerald/[0.07] blur-[180px] rounded-full pointer-events-none"
        animate={{ x: [0, 30, -20, 0], y: [0, -25, 15, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[40%] left-[35%] w-[400px] h-[400px] bg-brand-blue/[0.05] blur-[150px] rounded-full pointer-events-none"
        animate={{ x: [0, -25, 20, 0], y: [0, 20, -15, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[55%] left-[60%] w-[350px] h-[350px] bg-brand-violet/[0.04] blur-[140px] rounded-full pointer-events-none"
        animate={{ x: [0, 15, -30, 0], y: [0, -20, 25, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Converging data canvas */}
      <CTACanvas />

      {/* Star dots */}
      {starPositions.map((star, i) => (
        <motion.div
          key={i}
          aria-hidden="true"
          className="absolute w-1 h-1 rounded-full bg-white/30"
          style={{ left: star.left, top: star.top }}
          animate={{ opacity: [0.1, 0.5, 0.1], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 3, delay: star.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <div className="container max-w-3xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="font-display headline-xl text-4xl sm:text-5xl md:text-6xl text-white mb-5">
            <span className="font-bold">Ready to see the full picture?</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-lg mx-auto">
            Join the next generation of market intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button
                size="lg"
                className="h-14 px-10 text-base bg-brand-emerald text-brand-slate font-semibold hover:bg-brand-emerald/90 transition-all shadow-[0_0_30px_rgba(110,231,183,0.2),0_0_60px_rgba(110,231,183,0.1)] hover:shadow-[0_0_50px_rgba(110,231,183,0.3),0_0_80px_rgba(110,231,183,0.15)] rounded-xl"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/signals">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-10 text-base border-white/10 bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.08] text-white transition-all rounded-xl"
              >
                Explore the Platform
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Page Assembly
   ═══════════════════════════════════════════════════════════ */

export default function AboutPage() {
  return (
    <main className="flex flex-col">
      <HeroSection />
      <TimelineSection />
      <ValuesSection />
      <CTASection />
    </main>
  );
}
