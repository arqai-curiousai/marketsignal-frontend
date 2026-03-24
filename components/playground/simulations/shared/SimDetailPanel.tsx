'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export function SimDetailPanel({ open, onOpenChange, title, children }: Props) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={
          isMobile
            ? 'max-h-[70vh] rounded-t-2xl bg-slate-950 border-white/[0.06]'
            : 'w-[420px] bg-slate-950 border-white/[0.06]'
        }
      >
        <SheetHeader>
          <SheetTitle className="text-white/80 text-sm font-medium">{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 overflow-y-auto">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
