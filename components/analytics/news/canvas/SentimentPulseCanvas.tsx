'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { prepare, layout } from '@chenglou/pretext';
import { PretextCanvas } from '@/components/landing/pretext/PretextCanvas';
import { useMobileDetect } from '@/components/landing/pretext/useMobileDetect';
import {
  drawSonarPulse,
  colorWithAlpha,
} from '@/components/landing/pretext/canvasEffects';
import { drawWaveform, drawGridLines } from './canvasDashboardEffects';
import type { IGeoSentiment, INewsArticle } from '@/types/analytics';
import { REGION_METADATA, ALL_REGIONS, type NewsRegion } from '../constants';

/* ── Constants ── */

const LABEL_FONT = '600 9px Sora, system-ui, sans-serif';
const BUFFER_SIZE = 200; // rolling data points per region
const DESKTOP_HEIGHT = 96;
const MOBILE_HEIGHT = 64;
const MOBILE_MAX_CHANNELS = 3;

interface RegionChannel {
  region: string;
  color: string;
  label: string;
  labelWidth: number;
  buffer: number[];
  spikeEffects: { progress: number; channelY: number }[];
}

interface SentimentPulseCanvasProps {
  geoSentiment: IGeoSentiment[];
  breakingArticles: INewsArticle[];
  activeRegions: Set<NewsRegion>;
}

export function SentimentPulseCanvas({
  geoSentiment,
  breakingArticles,
  activeRegions,
}: SentimentPulseCanvasProps) {
  const isMobile = useMobileDetect();
  const channelsRef = useRef<RegionChannel[]>([]);
  const readyRef = useRef(false);
  const lastBreakingCountRef = useRef(0);

  // Get visible regions
  const visibleRegions = useCallback((): string[] => {
    const all = ALL_REGIONS.filter(r => r !== 'all');
    const active = activeRegions.size === 0
      ? all
      : all.filter(r => activeRegions.has(r));
    if (isMobile && active.length > MOBILE_MAX_CHANNELS) {
      return active.slice(0, MOBILE_MAX_CHANNELS);
    }
    return active;
  }, [activeRegions, isMobile]);

  // Initialize channels
  useEffect(() => {
    document.fonts.ready.then(() => {
      const regions = visibleRegions();
      const channels: RegionChannel[] = regions.map(region => {
        const meta = REGION_METADATA[region];
        const label = meta?.displayName || region;

        // Measure label width with pretext
        const handle = prepare(label, LABEL_FONT);
        let lo = 0, hi = 120;
        for (let i = 0; i < 14; i++) {
          const mid = (lo + hi) / 2;
          if (layout(handle, mid, 10).lineCount <= 1) hi = mid;
          else lo = mid;
        }

        // Preserve existing buffer if same region
        const existing = channelsRef.current.find(c => c.region === region);
        const buffer = existing?.buffer || new Array(BUFFER_SIZE).fill(0);

        return {
          region,
          color: meta?.color || '#64748B',
          label,
          labelWidth: Math.ceil(hi),
          buffer,
          spikeEffects: existing?.spikeEffects || [],
        };
      });

      channelsRef.current = channels;
      readyRef.current = true;
    });
  }, [visibleRegions]);

  // Update sentiment values from geo data
  useEffect(() => {
    if (!readyRef.current) return;
    const channels = channelsRef.current;

    for (const ch of channels) {
      const geo = geoSentiment.find(g => g.region === ch.region);
      const value = geo?.avg_sentiment ?? 0;
      // Push new value, shift buffer
      ch.buffer.push(value);
      if (ch.buffer.length > BUFFER_SIZE) {
        ch.buffer.shift();
      }
    }
  }, [geoSentiment]);

  // Detect new breaking articles → inject spike
  useEffect(() => {
    if (!readyRef.current) return;
    const newCount = breakingArticles.length;
    if (newCount > lastBreakingCountRef.current) {
      // Find regions of new breaking articles
      const newArticles = breakingArticles.slice(0, newCount - lastBreakingCountRef.current);
      for (const article of newArticles) {
        const articleRegions = article.regions || [];
        for (const ch of channelsRef.current) {
          if (articleRegions.includes(ch.region) || articleRegions.length === 0) {
            // Inject spike into buffer
            const last = ch.buffer[ch.buffer.length - 1] || 0;
            ch.buffer.push(last + 0.8);
            ch.buffer.push(last + 0.4);
            ch.buffer.push(last - 0.2);
            if (ch.buffer.length > BUFFER_SIZE + 3) {
              ch.buffer.splice(0, 3);
            }
            // Add sonar spike effect
            ch.spikeEffects.push({ progress: 0, channelY: 0 });
          }
        }
      }
    }
    lastBreakingCountRef.current = newCount;
  }, [breakingArticles]);

  // Draw callback
  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const channels = channelsRef.current;
    if (!readyRef.current || channels.length === 0) return;

    const labelMargin = 48;
    const chartLeft = labelMargin;
    const chartWidth = width - labelMargin - 8;
    const channelCount = channels.length;
    const channelHeight = height / channelCount;

    // Background grid
    drawGridLines(ctx, width, height, channelHeight, 'rgba(255, 255, 255, 0.02)');

    for (let i = 0; i < channelCount; i++) {
      const ch = channels[i];
      const channelY = i * channelHeight;
      const midY = channelY + channelHeight / 2;

      // Zero line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(chartLeft, midY);
      ctx.lineTo(width - 8, midY);
      ctx.stroke();

      // Channel separator
      if (i > 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, channelY);
        ctx.lineTo(width, channelY);
        ctx.stroke();
      }

      // Region label
      ctx.font = LABEL_FONT;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillStyle = colorWithAlpha(ch.color, 0.5);
      ctx.fillText(ch.label, 6, midY);

      // Small sentiment dot next to label
      const lastVal = ch.buffer[ch.buffer.length - 1] || 0;
      const dotColor = lastVal > 0.15 ? '#10B981' : lastVal < -0.15 ? '#EF4444' : '#64748B';
      ctx.fillStyle = dotColor;
      ctx.beginPath();
      ctx.arc(ch.labelWidth + 12, midY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Waveform — scale buffer points to fit chart width
      const visiblePoints = Math.min(ch.buffer.length, Math.floor(chartWidth));
      const startIdx = ch.buffer.length - visiblePoints;
      const scaled: number[] = [];
      for (let j = startIdx; j < ch.buffer.length; j++) {
        scaled.push(ch.buffer[j]);
      }

      // Save/restore for clipping to chart area
      ctx.save();
      ctx.beginPath();
      ctx.rect(chartLeft, channelY, chartWidth, channelHeight);
      ctx.clip();

      drawWaveform(ctx, scaled, ch.color, channelY, channelHeight, 0.5);
      ctx.restore();

      // Spike sonar effects
      for (let s = ch.spikeEffects.length - 1; s >= 0; s--) {
        const spike = ch.spikeEffects[s];
        spike.progress += 0.012;
        if (spike.progress >= 1) {
          ch.spikeEffects.splice(s, 1);
          continue;
        }
        drawSonarPulse(ctx, width - 20, midY, 25, spike.progress, ch.color);
      }
    }

    // Gentle breathing glow on right edge (live data indicator)
    const glowAlpha = 0.03 + Math.sin(time * 0.003) * 0.015;
    const liveGrad = ctx.createLinearGradient(width - 30, 0, width, 0);
    liveGrad.addColorStop(0, 'transparent');
    liveGrad.addColorStop(1, colorWithAlpha('#FBBF24', glowAlpha));
    ctx.fillStyle = liveGrad;
    ctx.fillRect(width - 30, 0, 30, height);
  }, []);

  // Reduced motion fallback
  const fallback = (
    <div className="flex items-center gap-3 px-3 py-2">
      {visibleRegions().map(region => {
        const meta = REGION_METADATA[region];
        const geo = geoSentiment.find(g => g.region === region);
        const score = geo?.avg_sentiment ?? 0;
        return (
          <div key={region} className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/40">{meta?.displayName}</span>
            <div className="w-12 h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.abs(score) * 100}%`,
                  backgroundColor: score > 0.15 ? '#10B981' : score < -0.15 ? '#EF4444' : '#64748B',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  const canvasHeight = isMobile ? MOBILE_HEIGHT : DESKTOP_HEIGHT;

  return (
    <div
      className="relative rounded-lg border border-white/[0.04] bg-white/[0.01] overflow-hidden"
      style={{ height: canvasHeight }}
    >
      <PretextCanvas
        draw={draw}
        fps={30}
        fallback={fallback}
      />
    </div>
  );
}
