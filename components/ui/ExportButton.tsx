'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportOption {
  label: string;
  icon: React.ReactNode;
  onClick: () => void | Promise<void>;
}

interface ExportButtonProps {
  options: ExportOption[];
  className?: string;
}

export function ExportButton({ options, className }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleClick = useCallback(async (fn: () => void | Promise<void>) => {
    setLoading(true);
    setOpen(false);
    try {
      await fn();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:text-white transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
        Export
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div role="menu" className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-lg border border-white/10 bg-[#1a1f2e] shadow-xl overflow-hidden">
            {options.map((opt, i) => (
              <button
                key={i}
                role="menuitem"
                onClick={() => handleClick(opt.onClick)}
                className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
