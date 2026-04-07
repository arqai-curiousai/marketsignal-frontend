'use client';

import { useRef, useCallback, useState } from 'react';
import { PretextCanvas } from '@/components/landing/pretext/PretextCanvas';
import { useMobileDetect } from '@/components/landing/pretext/useMobileDetect';
import { drawSonarPulse } from '@/components/landing/pretext/canvasEffects';
import { useForexData } from '../ForexDataProvider';
import { changePctToHsl, FONT_CODE_SM, FONT_VALUE_SM, SONAR_CYCLE_MS } from './canvasConstants';
import { cn } from '@/lib/utils';
import { ALL_FOREX_PAIRS } from '../constants';

/* ── Pair lookup for click mapping ── */
const PAIR_SET = new Set<string>(ALL_FOREX_PAIRS);
const INVERSE_MAP = new Map<string, string>();
for (const p of ALL_FOREX_PAIRS) {
  const [b, q] = p.split('/');
  INVERSE_MAP.set(`${q}/${b}`, p);
}

function findPair(row: string, col: string): string | null {
  const direct = `${row}/${col}`;
  if (PAIR_SET.has(direct)) return direct;
  const inv = `${col}/${row}`;
  if (PAIR_SET.has(inv)) return inv;
  return null;
}

interface Props {
  onSelectPair: (pair: string) => void;
}

type HeatmapMode = 'g10' | 'full' | 'exotics';
type Timeframe = '1d' | '1w' | '1m';

export function CrossRatesHeatmapCanvas({ onSelectPair }: Props) {
  const isMobile = useMobileDetect();
  const { crossRates, selectedPair } = useForexData();
  const [mode, setMode] = useState<HeatmapMode>('g10');
  const [timeframe, setTimeframe] = useState<Timeframe>('1d');
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredCellRef = useRef<{ row: number; col: number } | null>(null);
  const clickRef = useRef<{ x: number; y: number } | null>(null);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      if (!crossRates) return;

      const currencies = crossRates.currencies;
      const matrix = crossRates.matrix;
      const n = currencies.length;
      if (n === 0) return;

      const headerH = 28;
      const headerW = isMobile ? 28 : 36;
      const cellW = Math.min(48, (w - headerW) / n);
      const cellH = Math.min(28, (h - headerH - 20) / n);
      const startX = headerW;
      const startY = headerH;
      const mouse = mouseRef.current;

      hoveredCellRef.current = null;

      // Find selected pair cells
      const [selBase, selQuote] = selectedPair.split('/');
      const selRowIdx = currencies.indexOf(selBase);
      const selColIdx = currencies.indexOf(selQuote);

      // Column headers
      ctx.save();
      ctx.font = FONT_CODE_SM;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      currencies.forEach((c, i) => {
        const x = startX + i * cellW + cellW / 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText(c, x, headerH - 4);
      });
      ctx.restore();

      // Row headers
      ctx.save();
      ctx.font = FONT_CODE_SM;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      currencies.forEach((c, i) => {
        const y = startY + i * cellH + cellH / 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText(c, headerW - 4, y);
      });
      ctx.restore();

      // Cells
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const x = startX + c * cellW;
          const y = startY + r * cellH;

          if (r === c) {
            // Diagonal — faint mark
            ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
            continue;
          }

          const cell = matrix[r]?.[c];
          if (!cell) continue;

          const changePct = cell.change_pct ?? 0;
          const bgColor = changePctToHsl(changePct);

          // Check hover
          const isHovered = mouse &&
            mouse.x >= x && mouse.x < x + cellW &&
            mouse.y >= y && mouse.y < y + cellH;

          if (isHovered) {
            hoveredCellRef.current = { row: r, col: c };
          }

          const isSelected = r === selRowIdx && c === selColIdx;

          // Cell background
          ctx.save();
          ctx.fillStyle = bgColor;
          ctx.globalAlpha = isHovered ? 0.65 : isSelected ? 0.55 : 0.35;
          ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
          ctx.globalAlpha = 1;

          // Glow on hover
          if (isHovered) {
            ctx.shadowColor = bgColor;
            ctx.shadowBlur = 10;
            ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
            ctx.shadowBlur = 0;
          }
          ctx.restore();

          // Selected pair ring
          if (isSelected) {
            drawSonarPulse(
              ctx, x + cellW / 2, y + cellH / 2,
              Math.min(cellW, cellH) * 0.6,
              (time % SONAR_CYCLE_MS) / SONAR_CYCLE_MS,
              'rgba(96, 165, 250, 0.5)',
            );
            ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
          }

          // Row/column highlight on hover
          if (hoveredCellRef.current) {
            const hc = hoveredCellRef.current;
            if (r === hc.row || c === hc.col) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
              ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
            }
          }

          // Value text (change%)
          if (cellW > 30) {
            ctx.save();
            ctx.font = FONT_VALUE_SM;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const absChange = Math.abs(changePct);
            ctx.fillStyle = absChange > 0.4
              ? 'rgba(255, 255, 255, 0.85)'
              : 'rgba(255, 255, 255, 0.5)';
            const sign = changePct >= 0 ? '+' : '';
            ctx.fillText(
              `${sign}${changePct.toFixed(2)}`,
              x + cellW / 2,
              y + cellH / 2,
            );
            ctx.restore();
          }
        }
      }

      // Hover tooltip
      if (hoveredCellRef.current && !isMobile) {
        const { row, col } = hoveredCellRef.current;
        const cell = matrix[row]?.[col];
        if (cell) {
          const pair = `${currencies[row]}/${currencies[col]}`;
          const tooltipX = startX + col * cellW + cellW;
          const tooltipY = startY + row * cellH;

          const cardW = 120;
          const cardH = 36;
          const tx = Math.min(tooltipX + 4, w - cardW - 4);
          const ty = Math.min(tooltipY, h - cardH - 4);

          ctx.save();
          ctx.fillStyle = 'rgba(8, 10, 20, 0.92)';
          ctx.beginPath();
          ctx.roundRect(tx, ty, cardW, cardH, 4);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.font = '600 9px Sora, system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.fillText(pair, tx + 8, ty + 6);

          ctx.font = FONT_VALUE_SM;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          const rate = cell.rate != null ? cell.rate.toFixed(4) : '—';
          const pct = cell.change_pct;
          const pctStr = `${pct >= 0 ? '+' : ''}${pct.toFixed(3)}%`;
          ctx.fillText(`${rate}  ${pctStr}`, tx + 8, ty + 20);
          ctx.restore();
        }
      }
    },
    [crossRates, selectedPair, isMobile],
  );

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
    hoveredCellRef.current = null;
  }, []);

  const handleMouseDown = useCallback((x: number, y: number) => {
    clickRef.current = { x, y };
  }, []);

  const handleMouseUp = useCallback(() => {
    clickRef.current = null;
    const hc = hoveredCellRef.current;
    if (!hc || !crossRates) return;
    const currencies = crossRates.currencies;
    const row = currencies[hc.row];
    const col = currencies[hc.col];
    if (row && col && row !== col) {
      const pair = findPair(row, col);
      if (pair) onSelectPair(pair);
    }
  }, [crossRates, onSelectPair]);

  return (
    <div className="space-y-2">
      {/* Mode + Timeframe pills (DOM) */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex gap-0.5">
          {(['g10', 'full', 'exotics'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'px-2 py-0.5 text-[10px] rounded-full font-medium transition-colors capitalize',
                mode === m
                  ? 'bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/30'
                  : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.06]',
              )}
            >
              {m === 'g10' ? 'G10' : m}
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-white/[0.06]" />
        <div className="flex gap-0.5">
          {(['1d', '1w', '1m'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                'px-2 py-0.5 text-[10px] rounded-full font-medium transition-colors uppercase',
                timeframe === tf
                  ? 'bg-white/[0.1] text-white'
                  : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.06]',
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative" style={{ height: isMobile ? 280 : 360 }}>
        <PretextCanvas
          draw={draw}
          fallback={
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground/40">
              Cross-Rates Matrix
            </div>
          }
          fps={30}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          cursor="pointer"
        />
      </div>
    </div>
  );
}
