'use client';

import React, { useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function SimFullscreen({ open, onClose, title, children, className }: Props) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col',
        'bg-[#0B0F19]',
        className,
      )}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
        <span className="text-sm text-white/70 font-medium">{title}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 w-7 p-0 text-white/40 hover:text-white/70"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content fills remaining space */}
      <div className="flex-1 overflow-auto p-4">{children}</div>
    </div>
  );
}
