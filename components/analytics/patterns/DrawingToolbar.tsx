'use client';

import React from 'react';
import {
  Minus,
  MoveHorizontal,
  BarChart3,
  Square,
  Eraser,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DrawingTool } from './DrawingCanvas';

// ─── Types ──────────────────────────────────────────────────

interface DrawingToolbarProps {
  activeTool: DrawingTool | null;
  onSelectTool: (tool: DrawingTool | null) => void;
  onClearAll: () => void;
  hasDrawings: boolean;
}

// ─── Tool definitions ───────────────────────────────────────

const TOOLS: {
  id: DrawingTool;
  label: string;
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>;
  rotate?: boolean;
}[] = [
  { id: 'trendline', label: 'Trendline', shortcut: 'T', icon: Minus, rotate: true },
  { id: 'horizontal', label: 'Horizontal', shortcut: 'H', icon: MoveHorizontal },
  { id: 'fibonacci', label: 'Fibonacci', shortcut: 'F', icon: BarChart3 },
  { id: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: Square },
  { id: 'eraser', label: 'Eraser', shortcut: 'E', icon: Eraser },
];

// ─── Component ──────────────────────────────────────────────

export function DrawingToolbar({
  activeTool,
  onSelectTool,
  onClearAll,
  hasDrawings,
}: DrawingToolbarProps) {
  return (
    <div
      className={cn(
        'absolute right-2 top-1/2 -translate-y-1/2 z-10',
        'flex flex-col items-center gap-1',
        'bg-black/40 backdrop-blur-sm border border-white/[0.06] rounded-xl p-1',
        'opacity-50 hover:opacity-100 focus-within:opacity-100 active:opacity-100',
        'transition-opacity duration-200'
      )}
    >
      <span className="text-[7px] text-white/40 font-semibold uppercase tracking-widest mb-0.5 select-none">
        Draw
      </span>
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onSelectTool(activeTool === tool.id ? null : tool.id)}
          className={cn(
            'p-1.5 rounded-lg transition-all flex flex-col items-center gap-0.5',
            activeTool === tool.id
              ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40'
              : 'bg-white/5 text-white/30 hover:text-white/60 hover:bg-white/10'
          )}
          title={`${tool.label} (${tool.shortcut})`}
        >
          <tool.icon
            className={cn(
              'h-3.5 w-3.5',
              tool.rotate && 'rotate-[-45deg]'
            )}
          />
          <span className="text-[8px] text-white/20 font-mono leading-none">{tool.shortcut}</span>
        </button>
      ))}

      {/* Divider */}
      {hasDrawings && (
        <>
          <div className="w-full h-px bg-white/10 my-0.5" />
          <button
            onClick={onClearAll}
            className="p-1.5 rounded-lg transition-all bg-white/5 text-white/30 hover:text-rose-400 hover:bg-rose-500/10"
            title="Clear all drawings"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
