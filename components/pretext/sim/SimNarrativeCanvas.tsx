'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { prepare, layout, type PreparedText } from '@chenglou/pretext';
import { PretextCanvas } from '../PretextCanvas';
import { useReducedMotion } from '../useReducedMotion';
import { useMobileDetect } from '../useMobileDetect';
import { colorWithAlpha, drawSonarPulse } from '../canvasEffects';
import { SIM_FONTS, SIM_TEXT } from './simCanvasTokens';

interface SimNarrativeCanvasProps {
  /** The AI narrative text to render */
  narrative: string;
  /** Whether the narrative is loading */
  loading?: boolean;
  /** Accent color for glow effects */
  accentColor?: string;
  className?: string;
}

const CHARS_PER_SEC = 40;
const LINE_HEIGHT = 16;
const FONT = '400 11px Sora, system-ui, sans-serif';
const PAD_X = 16;
const PAD_Y = 12;
const LEFT_BAR_WIDTH = 2;
const LEFT_BAR_GAP = 12;

export function SimNarrativeCanvas({
  narrative,
  loading = false,
  accentColor = 'rgba(167, 139, 250, 1)',
  className,
}: SimNarrativeCanvasProps) {
  const reduced = useReducedMotion();
  const isMobile = useMobileDetect();
  const startTimeRef = useRef(0);
  const handleRef = useRef<PreparedText | null>(null);
  const [lineCount, setLineCount] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  // Prepare text with Pretext for line-breaking
  useEffect(() => {
    if (!narrative) return;
    document.fonts.ready.then(() => {
      handleRef.current = prepare(narrative, FONT);
      // Estimate line count based on container width
      const containerW = containerRef.current?.offsetWidth ?? 400;
      const availW = containerW - PAD_X * 2 - LEFT_BAR_WIDTH - LEFT_BAR_GAP;
      const result = layout(handleRef.current, availW, LINE_HEIGHT);
      setLineCount(result.lineCount);
    });
  }, [narrative]);

  // Reset animation when narrative changes
  useEffect(() => {
    startTimeRef.current = 0;
  }, [narrative]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      if (startTimeRef.current === 0) startTimeRef.current = time;
      const elapsed = (time - startTimeRef.current) / 1000;

      const textX = PAD_X + LEFT_BAR_WIDTH + LEFT_BAR_GAP;
      const textY = PAD_Y;

      // Left accent bar
      ctx.save();
      ctx.fillStyle = colorWithAlpha(accentColor, 0.5);
      ctx.fillRect(PAD_X, PAD_Y, LEFT_BAR_WIDTH, h - PAD_Y * 2);
      ctx.restore();

      // Sonar pulse traveling down the left bar
      const barH = h - PAD_Y * 2;
      const sonarCycle = 4;
      const sonarT = (elapsed % sonarCycle) / sonarCycle;
      const sonarY = PAD_Y + sonarT * barH;
      ctx.save();
      ctx.globalAlpha = (1 - sonarT) * 0.3;
      const sonarGrad = ctx.createRadialGradient(PAD_X + 1, sonarY, 0, PAD_X + 1, sonarY, 8);
      sonarGrad.addColorStop(0, colorWithAlpha(accentColor, 0.5));
      sonarGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = sonarGrad;
      ctx.beginPath();
      ctx.arc(PAD_X + 1, sonarY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (loading) {
        // Loading dots animation
        ctx.save();
        ctx.font = SIM_FONTS.tiny;
        ctx.fillStyle = SIM_TEXT.muted;
        ctx.textBaseline = 'top';
        ctx.fillText('Generating analysis', textX, textY + 4);
        for (let i = 0; i < 3; i++) {
          const dotAlpha = 0.3 + Math.sin(time * 0.005 + i * 1.5) * 0.4;
          ctx.fillStyle = colorWithAlpha(accentColor, dotAlpha);
          ctx.beginPath();
          ctx.arc(textX + 110 + i * 8, textY + 10, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        return;
      }

      if (!narrative) return;

      // Typewriter: reveal characters progressively
      const totalChars = narrative.length;
      const revealedChars = Math.min(totalChars, Math.floor(elapsed * CHARS_PER_SEC));
      const isComplete = revealedChars >= totalChars;

      // Render text line by line using Pretext layout
      const availW = w - textX - PAD_X;
      const handle = handleRef.current;
      if (!handle) {
        // Fallback: simple canvas text if Pretext handle not ready
        ctx.save();
        ctx.font = FONT;
        ctx.fillStyle = SIM_TEXT.secondary;
        ctx.textBaseline = 'top';
        ctx.fillText(narrative.slice(0, revealedChars), textX, textY);
        ctx.restore();
        return;
      }

      // Use Pretext layout for proper line breaks
      const layoutResult = layout(handle, availW, LINE_HEIGHT);

      // Render character by character with glow on newest characters
      ctx.save();
      ctx.font = FONT;
      ctx.textBaseline = 'top';

      let charIdx = 0;
      const displayText = narrative.slice(0, revealedChars);
      // Split by lines using layout info
      const lines: string[] = [];
      let remaining = displayText;
      const fullLines: string[] = [];
      // Get full text lines first
      let fullRemaining = narrative;
      for (let line = 0; line < layoutResult.lineCount; line++) {
        // Approximate: Pretext gives us lineCount, we split by fitting text
        // Use binary search per line
        let bestFit = '';
        for (let end = 1; end <= fullRemaining.length; end++) {
          const testStr = fullRemaining.slice(0, end);
          const testHandle = prepare(testStr, FONT);
          const testLayout = layout(testHandle, availW, LINE_HEIGHT);
          if (testLayout.lineCount <= 1) {
            bestFit = testStr;
          } else {
            break;
          }
        }
        // Find word boundary
        if (bestFit.length < fullRemaining.length) {
          const lastSpace = bestFit.lastIndexOf(' ');
          if (lastSpace > 0) bestFit = bestFit.slice(0, lastSpace + 1);
        }
        fullLines.push(bestFit);
        fullRemaining = fullRemaining.slice(bestFit.length);
        if (fullRemaining.length === 0) break;
      }

      // Now render revealed chars across lines
      let charsLeft = revealedChars;
      for (let lineIdx = 0; lineIdx < fullLines.length; lineIdx++) {
        const lineText = fullLines[lineIdx];
        const visibleLen = Math.min(charsLeft, lineText.length);
        if (visibleLen <= 0) break;

        const visibleText = lineText.slice(0, visibleLen);
        const ly = textY + lineIdx * LINE_HEIGHT;

        // Base text
        const breatheAlpha = isComplete
          ? 0.58 + Math.sin(time * 0.001) * 0.02
          : 0.6;
        ctx.fillStyle = colorWithAlpha('rgba(255,255,255,1)', breatheAlpha);
        ctx.fillText(visibleText, textX, ly);

        // Glow on the newest few characters
        if (!isComplete && visibleLen === Math.min(charsLeft, lineText.length) && charsLeft <= lineText.length) {
          const glowStart = Math.max(0, visibleLen - 3);
          const glowText = visibleText.slice(glowStart);
          const glowX = textX + ctx.measureText(visibleText.slice(0, glowStart)).width;
          ctx.save();
          ctx.shadowColor = accentColor;
          ctx.shadowBlur = 8;
          ctx.fillStyle = colorWithAlpha(accentColor, 0.7);
          ctx.fillText(glowText, glowX, ly);
          ctx.restore();
        }

        charsLeft -= visibleLen;
      }

      ctx.restore();

      // Disclaimer at bottom
      if (isComplete) {
        ctx.save();
        ctx.font = SIM_FONTS.tiny;
        ctx.fillStyle = SIM_TEXT.ghost;
        ctx.textBaseline = 'bottom';
        ctx.fillText('AI-generated analysis. Not investment advice.', textX, h - 6);
        ctx.restore();
      }
    },
    [narrative, loading, accentColor],
  );

  // Reduced motion fallback
  if (reduced) {
    return (
      <div className={`rounded-xl border border-indigo-500/10 bg-gradient-to-r from-indigo-500/[0.03] to-violet-500/[0.03] px-4 py-3 ${className ?? ''}`}>
        {loading ? (
          <span className="text-[10px] text-white/25">Generating analysis...</span>
        ) : narrative ? (
          <>
            <p className="text-[11px] leading-relaxed text-white/60 whitespace-pre-line">{narrative}</p>
            <p className="mt-2.5 text-[9px] text-white/15 italic">AI-generated analysis. Not investment advice.</p>
          </>
        ) : null}
      </div>
    );
  }

  const canvasH = Math.max(80, PAD_Y * 2 + lineCount * LINE_HEIGHT + 20);

  return (
    <div
      ref={containerRef}
      className={`relative rounded-xl border border-indigo-500/10 bg-gradient-to-r from-indigo-500/[0.03] to-violet-500/[0.03] overflow-hidden ${className ?? ''}`}
      style={{ height: canvasH }}
    >
      <PretextCanvas
        draw={draw}
        fps={isMobile ? 30 : 60}
        ariaLabel={narrative ? `AI Analysis: ${narrative.slice(0, 100)}...` : 'AI Analysis loading'}
      />
    </div>
  );
}
