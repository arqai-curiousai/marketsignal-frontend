'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { prepare, layout } from '@chenglou/pretext';
import { PretextCanvas } from '@/components/landing/pretext/PretextCanvas';
import { useMobileDetect } from '@/components/landing/pretext/useMobileDetect';
import {
  drawDataPulse,
  colorWithAlpha,
} from '@/components/landing/pretext/canvasEffects';
import {
  drawStreamBand,
  drawPhaseDot,
  drawTimeAxis,
  type StreamPoint,
} from './canvasDashboardEffects';
import type { IStoryArc } from '@/types/analytics';

/* ── Constants ── */

const LABEL_FONT = '600 10px Sora, system-ui, sans-serif';
const TICKER_FONT = '500 8px Inter, system-ui, sans-serif';
const TIME_FONT = '400 8px Inter, system-ui, sans-serif';
const DESKTOP_HEIGHT = 200;
const MOBILE_HEIGHT = 140;
const MOBILE_MAX_STORIES = 3;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 24; // for time axis
const PADDING_X = 16;

const PHASE_COLORS: Record<string, string> = {
  breaking: '#EF4444',
  developing: '#F59E0B',
  analysis: '#818CF8',
  reaction: '#3B82F6',
  concluded: '#64748B',
};

const STORY_COLORS = ['#FBBF24', '#3B82F6', '#10B981', '#A78BFA', '#F59E0B', '#EF4444'];

/* ── Types ── */

interface StoryStream {
  story: IStoryArc;
  color: string;
  points: StreamPoint[];
  labelX: number;
  labelY: number;
  label: string;
  labelWidth: number;
  phaseMarkers: { x: number; y: number; phase: string }[];
  tickerLabels: { text: string; x: number; y: number }[];
  particleProgress: number;
}

interface StoryArcCanvasProps {
  stories: IStoryArc[];
  onSelectStory: (story: IStoryArc) => void;
}

export function StoryArcCanvas({ stories, onSelectStory }: StoryArcCanvasProps) {
  const isMobile = useMobileDetect();
  const streamsRef = useRef<StoryStream[]>([]);
  const hoveredRef = useRef<number>(-1);
  const readyRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0 });

  // Build streams from stories
  useEffect(() => {
    const visibleStories = isMobile
      ? stories.slice(0, MOBILE_MAX_STORIES)
      : stories.slice(0, 6);

    if (visibleStories.length === 0) {
      streamsRef.current = [];
      readyRef.current = false;
      return;
    }

    document.fonts.ready.then(() => {
      // Compute time range across all stories
      let minTime = Infinity, maxTime = -Infinity;
      for (const story of visibleStories) {
        const t0 = new Date(story.first_article_at).getTime();
        const t1 = new Date(story.latest_article_at).getTime();
        if (t0 < minTime) minTime = t0;
        if (t1 > maxTime) maxTime = t1;
      }
      // Add padding
      const timeRange = maxTime - minTime || 3600000; // 1h minimum
      minTime -= timeRange * 0.05;
      maxTime += timeRange * 0.05;
      const totalRange = maxTime - minTime;

      const streams: StoryStream[] = visibleStories.map((story, idx) => {
        const color = STORY_COLORS[idx % STORY_COLORS.length];
        const label = story.story_label.length > 35
          ? story.story_label.slice(0, 32) + '...'
          : story.story_label;

        // Measure label
        const handle = prepare(label, LABEL_FONT);
        let lo = 0, hi = 400;
        for (let i = 0; i < 16; i++) {
          const mid = (lo + hi) / 2;
          if (layout(handle, mid, 11).lineCount <= 1) hi = mid;
          else lo = mid;
        }
        const labelWidth = Math.ceil(hi);

        // Build stream points from sentiment trajectory
        const trajectory = story.sentiment_trajectory || [];
        const baseThickness = Math.min(story.article_count * 3, 30);

        const points: StreamPoint[] = [];
        if (trajectory.length >= 2) {
          for (const pt of trajectory) {
            const t = new Date(pt.timestamp).getTime();
            const xPct = (t - minTime) / totalRange;
            points.push({
              x: xPct, // will be scaled in draw
              y: 0, // will be set per-stream in draw
              thickness: baseThickness * (0.5 + Math.abs(pt.score) * 0.5),
              sentiment: pt.score,
            });
          }
        } else {
          // Fallback: just start and end
          const t0 = new Date(story.first_article_at).getTime();
          const t1 = new Date(story.latest_article_at).getTime();
          points.push({
            x: (t0 - minTime) / totalRange,
            y: 0,
            thickness: baseThickness * 0.3,
            sentiment: 0,
          });
          points.push({
            x: ((t0 + t1) / 2 - minTime) / totalRange,
            y: 0,
            thickness: baseThickness,
            sentiment: story.sentiment_trajectory?.[0]?.score ?? 0,
          });
          points.push({
            x: (t1 - minTime) / totalRange,
            y: 0,
            thickness: baseThickness * 0.5,
            sentiment: story.sentiment_trajectory?.[story.sentiment_trajectory.length - 1]?.score ?? 0,
          });
        }

        // Phase markers
        const phaseMarkers: { x: number; y: number; phase: string }[] = [];
        const seenPhases = new Set<string>();
        for (const pt of trajectory) {
          if (!seenPhases.has(pt.phase)) {
            seenPhases.add(pt.phase);
            const t = new Date(pt.timestamp).getTime();
            phaseMarkers.push({
              x: (t - minTime) / totalRange,
              y: 0,
              phase: pt.phase,
            });
          }
        }

        // Ticker labels
        const tickerLabels = story.tickers.slice(0, 3).map((ticker) => ({
          text: ticker,
          x: 0,
          y: 0,
        }));

        // Find peak point for label placement
        const peakIdx = points.reduce((best, p, i) =>
          p.thickness > (points[best]?.thickness ?? 0) ? i : best, 0);

        return {
          story,
          color,
          points,
          labelX: points[peakIdx]?.x ?? 0.5,
          labelY: 0,
          label,
          labelWidth,
          phaseMarkers,
          tickerLabels,
          particleProgress: Math.random(),
        };
      });

      streamsRef.current = streams;
      readyRef.current = true;
    });
  }, [stories, isMobile]);

  // Mouse handlers
  const handleMouseMove = useCallback((mx: number, my: number) => {
    const streams = streamsRef.current;
    const { w, h } = sizeRef.current;
    if (!w || !h || streams.length === 0) return;

    const chartH = h - PADDING_TOP - PADDING_BOTTOM;
    const streamH = chartH / streams.length;

    let found = -1;
    for (let i = 0; i < streams.length; i++) {
      const streamTop = PADDING_TOP + i * streamH;
      const streamBot = streamTop + streamH;
      if (my >= streamTop && my <= streamBot) {
        found = i;
        break;
      }
    }
    hoveredRef.current = found;
  }, []);

  const handleMouseDown = useCallback(() => {
    const idx = hoveredRef.current;
    if (idx >= 0 && idx < streamsRef.current.length) {
      onSelectStory(streamsRef.current[idx].story);
    }
  }, [onSelectStory]);

  const handleMouseLeave = useCallback(() => {
    hoveredRef.current = -1;
  }, []);

  // Draw
  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, _time: number) => {
    const streams = streamsRef.current;
    if (!readyRef.current || streams.length === 0) return;
    sizeRef.current = { w: width, h: height };

    const chartH = height - PADDING_TOP - PADDING_BOTTOM;
    const streamCount = streams.length;
    const streamH = chartH / streamCount;
    const chartLeft = PADDING_X;
    const chartRight = width - PADDING_X;
    const chartW = chartRight - chartLeft;

    for (let i = 0; i < streamCount; i++) {
      const stream = streams[i];
      const streamMidY = PADDING_TOP + i * streamH + streamH / 2;
      const isHovered = hoveredRef.current === i;

      // Scale points to canvas coordinates
      const scaledPoints: StreamPoint[] = stream.points.map(p => ({
        x: chartLeft + p.x * chartW,
        y: streamMidY,
        thickness: p.thickness * (isHovered ? 1.2 : 1),
        sentiment: p.sentiment,
      }));

      // Draw stream band
      drawStreamBand(ctx, scaledPoints, stream.color, isHovered ? 0.35 : 0.2);

      // Phase markers along the stream
      for (const marker of stream.phaseMarkers) {
        const mx = chartLeft + marker.x * chartW;
        drawPhaseDot(ctx, mx, streamMidY, marker.phase, isHovered ? 5 : 3.5);
      }

      // Particle flow for active (non-concluded) stories
      if (stream.story.story_phase !== 'concluded') {
        stream.particleProgress += 0.004;
        if (stream.particleProgress > 1) stream.particleProgress -= 1;

        if (scaledPoints.length >= 2) {
          const firstPt = scaledPoints[0];
          const lastPt = scaledPoints[scaledPoints.length - 1];
          drawDataPulse(
            ctx,
            firstPt.x, firstPt.y,
            lastPt.x, lastPt.y,
            stream.particleProgress,
            stream.color,
            1.5,
          );
        }
      }

      // Story label
      const labelScreenX = chartLeft + stream.labelX * chartW;
      const labelY = streamMidY - (scaledPoints[0]?.thickness ?? 10) / 2 - 8;

      ctx.save();
      ctx.font = LABEL_FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = colorWithAlpha(stream.color, isHovered ? 0.9 : 0.6);

      // Ensure label stays in bounds
      const clampedX = Math.max(chartLeft + stream.labelWidth / 2, Math.min(chartRight - stream.labelWidth / 2, labelScreenX));
      ctx.fillText(stream.label, clampedX, labelY);
      ctx.restore();

      // Phase badge next to label
      const phaseColor = PHASE_COLORS[stream.story.story_phase] || '#64748B';
      ctx.font = TICKER_FONT;
      ctx.textAlign = 'left';
      ctx.fillStyle = colorWithAlpha(phaseColor, 0.7);
      const phaseText = stream.story.story_phase;
      ctx.fillText(phaseText, clampedX + stream.labelWidth / 2 + 6, labelY - 1);

      // Ticker pills below stream
      ctx.font = TICKER_FONT;
      ctx.textAlign = 'center';
      ctx.fillStyle = colorWithAlpha('#fff', isHovered ? 0.35 : 0.18);
      const tickerY = streamMidY + (scaledPoints[0]?.thickness ?? 10) / 2 + 10;
      const tickers = stream.story.tickers.slice(0, 3);
      const tickerSpacing = 40;
      const tickerStartX = clampedX - ((tickers.length - 1) * tickerSpacing) / 2;
      for (let t = 0; t < tickers.length; t++) {
        ctx.fillText(tickers[t], tickerStartX + t * tickerSpacing, tickerY);
      }

      // Article count
      ctx.font = TICKER_FONT;
      ctx.textAlign = 'right';
      ctx.fillStyle = colorWithAlpha('#fff', 0.15);
      ctx.fillText(`${stream.story.article_count} articles`, chartRight, streamMidY + 3);
    }

    // Time axis
    const timeLabels: { x: number; text: string }[] = [];
    const labelCount = isMobile ? 3 : 5;
    for (let i = 0; i <= labelCount; i++) {
      const xPct = i / labelCount;
      const x = chartLeft + xPct * chartW;

      // We don't have absolute times stored, so show relative labels
      const labels = isMobile
        ? ['Start', 'Mid', 'Now']
        : ['Earliest', '', 'Midpoint', '', 'Latest'];
      if (labels[i]) {
        timeLabels.push({ x, text: labels[i] });
      }
    }
    drawTimeAxis(ctx, timeLabels, height - PADDING_BOTTOM + 4, width, '#fff', TIME_FONT);

    // Hover highlight line
    if (hoveredRef.current >= 0) {
      const hIdx = hoveredRef.current;
      const streamTop = PADDING_TOP + hIdx * streamH;
      ctx.strokeStyle = colorWithAlpha(streams[hIdx].color, 0.06);
      ctx.lineWidth = streamH;
      ctx.beginPath();
      ctx.moveTo(0, streamTop + streamH / 2);
      ctx.lineTo(width, streamTop + streamH / 2);
      ctx.stroke();
    }
  }, [isMobile]);

  if (stories.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-white/[0.04] bg-white/[0.01] text-white/20 text-xs"
        style={{ height: isMobile ? MOBILE_HEIGHT : DESKTOP_HEIGHT }}>
        No active stories
      </div>
    );
  }

  const canvasHeight = isMobile ? MOBILE_HEIGHT : DESKTOP_HEIGHT;

  // Reduced motion fallback — story card carousel
  const fallback = (
    <div className="flex gap-2 overflow-x-auto p-2 scrollbar-hide">
      {stories.slice(0, 5).map(story => (
        <button
          key={story.id}
          onClick={() => onSelectStory(story)}
          className="shrink-0 w-48 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-left hover:bg-white/[0.04] transition-colors"
        >
          <span
            className="text-[9px] font-medium px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: `${PHASE_COLORS[story.story_phase] || '#64748B'}22`,
              color: PHASE_COLORS[story.story_phase] || '#64748B',
            }}
          >
            {story.story_phase}
          </span>
          <div className="text-[12px] text-white/70 font-medium line-clamp-2 leading-snug mt-1.5">
            {story.story_label}
          </div>
          <div className="flex gap-1 mt-1.5">
            {story.tickers.slice(0, 3).map(t => (
              <span key={t} className="text-[9px] text-white/30 bg-white/[0.04] rounded px-1.5 py-0.5">
                {t}
              </span>
            ))}
          </div>
        </button>
      ))}
    </div>
  );

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
        fallback={fallback}
      />
    </div>
  );
}
