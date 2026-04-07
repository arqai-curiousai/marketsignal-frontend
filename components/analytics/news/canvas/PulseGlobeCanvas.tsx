'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { prepare, layout } from '@chenglou/pretext';
import { PretextCanvas } from '@/components/landing/pretext/PretextCanvas';
import { useMobileDetect } from '@/components/landing/pretext/useMobileDetect';
import {
  drawGlowingNode,
  drawConnection,
  drawDataPulse,
  drawBreakingPulse,
  colorWithAlpha,
} from '@/components/landing/pretext/canvasEffects';
import { drawDashInfoCard, drawSentimentDot } from './canvasDashboardEffects';
import type { IGeoSentiment, INewsArticle } from '@/types/analytics';
import { REGION_METADATA, type NewsRegion } from '../constants';
import GeoSentimentMap from '../GeoSentimentMap';

/* ── Layout ── */

/** Geographic-ish positions as percentage of canvas width/height */
const REGION_POSITIONS: Record<string, { xPct: number; yPct: number }> = {
  americas:         { xPct: 0.14, yPct: 0.45 },
  europe:           { xPct: 0.40, yPct: 0.22 },
  scandinavia:      { xPct: 0.58, yPct: 0.15 },
  india:            { xPct: 0.55, yPct: 0.55 },
  asia_pacific:     { xPct: 0.82, yPct: 0.38 },
  emerging_markets: { xPct: 0.24, yPct: 0.80 },
};

const CONNECTIONS: [string, string][] = [
  ['americas', 'europe'],
  ['europe', 'scandinavia'],
  ['europe', 'india'],
  ['india', 'asia_pacific'],
  ['asia_pacific', 'emerging_markets'],
  ['americas', 'emerging_markets'],
];

const LABEL_FONT = '600 10px Sora, system-ui, sans-serif';
const DETAIL_FONT = '400 9px Inter, system-ui, sans-serif';
const DESKTOP_HEIGHT = 280;
const MOBILE_HEIGHT = 180;

/* ── Types ── */

interface RegionNode {
  region: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  color: string;
  label: string;
  flag: string;
  labelWidth: number;
  breathePhase: number;
  intensity: number;
  articleCount: number;
  breakingCount: number;
  sentiment: number;
  currencies: string;
}

interface FlowParticle {
  connIdx: number;
  progress: number;
  speed: number;
}

interface PulseGlobeCanvasProps {
  geoSentiment: IGeoSentiment[];
  activeRegions: Set<NewsRegion>;
  breakingArticles: INewsArticle[];
  onRegionClick: (region: NewsRegion) => void;
  onRegionHover?: (region: NewsRegion | null) => void;
}

export function PulseGlobeCanvas({
  geoSentiment,
  activeRegions,
  breakingArticles: _breakingArticles,
  onRegionClick,
  onRegionHover,
}: PulseGlobeCanvasProps) {
  const isMobile = useMobileDetect();
  const nodesRef = useRef<RegionNode[]>([]);
  const particlesRef = useRef<FlowParticle[]>([]);
  const hoveredRef = useRef<number>(-1);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const readyRef = useRef(false);
  const breakingPulsesRef = useRef<{ nodeIdx: number; progress: number }[]>([]);

  // Initialize nodes
  useEffect(() => {
    document.fonts.ready.then(() => {
      const regionKeys = Object.keys(REGION_POSITIONS);
      const nodes: RegionNode[] = regionKeys.map(region => {
        const meta = REGION_METADATA[region];
        const pos = REGION_POSITIONS[region];
        const label = meta?.displayName || region;

        // Measure label
        const handle = prepare(label, LABEL_FONT);
        let lo = 0, hi = 120;
        for (let i = 0; i < 14; i++) {
          const mid = (lo + hi) / 2;
          if (layout(handle, mid, 11).lineCount <= 1) hi = mid;
          else lo = mid;
        }

        return {
          region,
          x: 0,
          y: 0,
          targetX: pos.xPct,
          targetY: pos.yPct,
          radius: 12,
          color: meta?.color || '#64748B',
          label,
          flag: meta?.flag || '',
          labelWidth: Math.ceil(hi),
          breathePhase: Math.random() * Math.PI * 2,
          intensity: 0.5,
          articleCount: 0,
          breakingCount: 0,
          sentiment: 0,
          currencies: meta?.primaryCurrencies || '',
        };
      });

      nodesRef.current = nodes;

      // Initialize particles
      const particles: FlowParticle[] = [];
      for (let i = 0; i < CONNECTIONS.length; i++) {
        const count = isMobile ? 1 : 2;
        for (let j = 0; j < count; j++) {
          particles.push({
            connIdx: i,
            progress: Math.random(),
            speed: 0.002 + Math.random() * 0.002,
          });
        }
      }
      particlesRef.current = particles;
      readyRef.current = true;
    });
  }, [isMobile]);

  // Update node data from geo sentiment
  useEffect(() => {
    if (!readyRef.current) return;
    const nodes = nodesRef.current;
    for (const node of nodes) {
      const geo = geoSentiment.find(g => g.region === node.region);
      if (geo) {
        node.articleCount = geo.article_count;
        node.breakingCount = geo.breaking_count;
        node.sentiment = geo.avg_sentiment;
        node.radius = 10 + Math.min(geo.article_count * 0.4, 22);
        node.intensity = Math.min(Math.abs(geo.avg_sentiment) * 3, 1);
      }
    }
  }, [geoSentiment]);

  // Detect breaking pulses
  useEffect(() => {
    if (!readyRef.current) return;
    const nodes = nodesRef.current;
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].breakingCount > 0) {
        const existing = breakingPulsesRef.current.find(p => p.nodeIdx === i);
        if (!existing) {
          breakingPulsesRef.current.push({ nodeIdx: i, progress: 0 });
        }
      }
    }
  }, [geoSentiment]);

  // Mouse handlers
  const handleMouseMove = useCallback((mx: number, my: number) => {
    mouseRef.current = { x: mx, y: my };
    const nodes = nodesRef.current;
    let found = -1;
    for (let i = 0; i < nodes.length; i++) {
      const dx = mx - nodes[i].x;
      const dy = my - nodes[i].y;
      if (Math.sqrt(dx * dx + dy * dy) < nodes[i].radius + 8) {
        found = i;
        break;
      }
    }
    hoveredRef.current = found;
    if (onRegionHover) {
      onRegionHover(found >= 0 ? nodes[found].region as NewsRegion : null);
    }
  }, [onRegionHover]);

  const handleMouseDown = useCallback(() => {
    const idx = hoveredRef.current;
    if (idx >= 0 && idx < nodesRef.current.length) {
      onRegionClick(nodesRef.current[idx].region as NewsRegion);
    }
  }, [onRegionClick]);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
    hoveredRef.current = -1;
    if (onRegionHover) onRegionHover(null);
  }, [onRegionHover]);

  // Draw
  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, _time: number) => {
    const nodes = nodesRef.current;
    if (!readyRef.current || nodes.length === 0) return;
    sizeRef.current = { w: width, h: height };

    // Update positions with spring interpolation
    for (const node of nodes) {
      const tx = node.targetX * width;
      const ty = node.targetY * height;
      node.x += (tx - node.x) * 0.05;
      node.y += (ty - node.y) * 0.05;
      node.breathePhase += 0.02;
    }

    // Determine active set
    const isActive = (region: string) =>
      activeRegions.size === 0 || activeRegions.has(region as NewsRegion);

    // Draw connections
    for (let i = 0; i < CONNECTIONS.length; i++) {
      const [from, to] = CONNECTIONS[i];
      const fromNode = nodes.find(n => n.region === from);
      const toNode = nodes.find(n => n.region === to);
      if (!fromNode || !toNode) continue;

      const connActive = isActive(from) || isActive(to);
      const alpha = connActive ? 0.08 : 0.03;
      drawConnection(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, '#94A3B8', alpha);
    }

    // Draw particles along connections
    const particles = particlesRef.current;
    for (const p of particles) {
      p.progress += p.speed;
      if (p.progress > 1) p.progress -= 1;

      const [from, to] = CONNECTIONS[p.connIdx];
      const fromNode = nodes.find(n => n.region === from);
      const toNode = nodes.find(n => n.region === to);
      if (!fromNode || !toNode) continue;

      const connActive = isActive(from) || isActive(to);
      if (!connActive) continue;

      drawDataPulse(
        ctx,
        fromNode.x, fromNode.y,
        toNode.x, toNode.y,
        p.progress,
        fromNode.color,
        isMobile ? 1.2 : 1.5,
      );
    }

    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const active = isActive(node.region);
      const hovered = hoveredRef.current === i;
      const nodeAlpha = active ? 1 : 0.3;

      ctx.globalAlpha = nodeAlpha;

      drawGlowingNode(
        ctx,
        node.x,
        node.y,
        hovered ? node.radius * 1.15 : node.radius,
        node.color,
        node.intensity,
        node.breathePhase,
      );

      // Label below node
      ctx.font = LABEL_FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = colorWithAlpha(node.color, hovered ? 0.9 : 0.6);
      ctx.fillText(node.label, node.x, node.y + node.radius + 6);

      // Article count badge
      if (node.articleCount > 0) {
        ctx.font = DETAIL_FONT;
        ctx.fillStyle = colorWithAlpha('#fff', hovered ? 0.5 : 0.2);
        ctx.fillText(`${node.articleCount}`, node.x, node.y + node.radius + 18);
      }

      // Sentiment dot inside node
      drawSentimentDot(ctx, node.x, node.y, node.sentiment, 3);

      ctx.globalAlpha = 1;
    }

    // Breaking pulse rings
    for (let i = breakingPulsesRef.current.length - 1; i >= 0; i--) {
      const pulse = breakingPulsesRef.current[i];
      pulse.progress += 0.008;
      if (pulse.progress >= 1) {
        // Restart if still breaking
        const node = nodes[pulse.nodeIdx];
        if (node && node.breakingCount > 0) {
          pulse.progress = 0;
        } else {
          breakingPulsesRef.current.splice(i, 1);
          continue;
        }
      }
      const node = nodes[pulse.nodeIdx];
      if (node) {
        drawBreakingPulse(ctx, node.x, node.y, node.radius * 3, pulse.progress);
      }
    }

    // Hover info card
    const hovIdx = hoveredRef.current;
    if (hovIdx >= 0 && hovIdx < nodes.length) {
      const node = nodes[hovIdx];
      const sign = node.sentiment >= 0 ? '+' : '';
      const sentimentLabel = node.sentiment > 0.15 ? 'Bullish' : node.sentiment < -0.15 ? 'Bearish' : 'Neutral';
      const sentColor = node.sentiment > 0.15 ? '#10B981' : node.sentiment < -0.15 ? '#EF4444' : '#64748B';

      drawDashInfoCard(
        ctx,
        node.x + node.radius + 4,
        node.y,
        [
          { label: node.flag + ' ' + node.label, value: '', color: node.color },
          { label: 'Sentiment', value: `${sentimentLabel} (${sign}${node.sentiment.toFixed(2)})`, color: sentColor },
          { label: 'Articles', value: `${node.articleCount}` },
          { label: 'Breaking', value: `${node.breakingCount}`, color: node.breakingCount > 0 ? '#EF4444' : undefined },
          { label: 'Currencies', value: node.currencies },
        ],
        170,
      );
    }
  }, [activeRegions, isMobile]);

  const canvasHeight = isMobile ? MOBILE_HEIGHT : DESKTOP_HEIGHT;

  return (
    <div
      className="relative rounded-lg border border-white/[0.04] bg-white/[0.01] overflow-hidden"
      style={{ height: canvasHeight }}
    >
      <PretextCanvas
        draw={draw}
        fps={30}
        cursor={hoveredRef.current >= 0 ? 'pointer' : 'default'}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        fallback={
          <GeoSentimentMap
            geoSentiment={geoSentiment}
            activeRegions={activeRegions}
            onRegionClick={onRegionClick}
            compact
          />
        }
      />
    </div>
  );
}
