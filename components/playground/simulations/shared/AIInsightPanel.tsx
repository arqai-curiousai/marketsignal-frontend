'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AIInsightPanelProps {
  /** AI-generated narrative text (markdown). Empty string = not yet loaded. */
  narrative: string;
  /** Whether the narrative is currently loading. */
  loading?: boolean;
  /** Callback to request a fresh narrative (bypasses cache). */
  onRegenerate?: () => void;
  className?: string;
}

export function AIInsightPanel({
  narrative,
  loading = false,
  onRegenerate,
  className,
}: AIInsightPanelProps) {
  const [expanded, setExpanded] = useState(true);

  // Persist collapsed state to localStorage
  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  if (!narrative && !loading) return null;

  return (
    <div
      className={cn(
        'rounded-xl border border-indigo-500/10 bg-gradient-to-r from-indigo-500/[0.03] to-violet-500/[0.03]',
        'overflow-hidden transition-all',
        className,
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={toggleExpanded}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
        <span className="text-[11px] font-semibold text-indigo-400/80 tracking-wide uppercase">
          AI Analysis
        </span>
        <div className="flex-1" />
        {onRegenerate && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-white/20 hover:text-indigo-400 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              onRegenerate();
            }}
            disabled={loading}
            title="Regenerate analysis"
          >
            <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
          </Button>
        )}
        <ChevronDown
          className={cn(
            'h-3 w-3 text-white/20 transition-transform',
            !expanded && '-rotate-90',
          )}
        />
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              {loading ? (
                <div className="flex items-center gap-2 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-indigo-400/50"
                        animate={{
                          opacity: [0.3, 1, 0.3],
                          scale: [0.8, 1.1, 0.8],
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-white/25">Generating analysis...</span>
                </div>
              ) : (
                <>
                  <p className="text-[11px] leading-relaxed text-white/60 whitespace-pre-line">
                    {narrative}
                  </p>
                  <p className="mt-2.5 text-[9px] text-white/15 italic">
                    AI-generated analysis. Not investment advice.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
