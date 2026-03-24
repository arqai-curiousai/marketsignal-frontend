'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PLAYGROUND_SHORTCUTS } from '@/lib/hooks/usePlaygroundHotkeys';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SimShortcutHelp({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-slate-950 border-white/[0.08]">
        <DialogHeader>
          <DialogTitle className="text-white/80 text-sm">Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {PLAYGROUND_SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between">
              <span className="text-sm text-white/50">{s.description}</span>
              <kbd className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-xs font-mono text-white/70">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
