'use client';

import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
    mode: ViewMode;
    onChange: (mode: ViewMode) => void;
    className?: string;
}

export function ViewToggle({ mode, onChange, className }: ViewToggleProps) {
    return (
        <div className={cn("flex items-center p-1 bg-white/5 rounded-lg border border-white/10", className)}>
            <button
                onClick={() => onChange('list')}
                className={cn(
                    "p-2 rounded-md transition-all duration-200",
                    mode === 'list'
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
                aria-label="List view"
            >
                <List className="w-4 h-4" />
            </button>
            <button
                onClick={() => onChange('grid')}
                className={cn(
                    "p-2 rounded-md transition-all duration-200",
                    mode === 'grid'
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
                aria-label="Grid view"
            >
                <LayoutGrid className="w-4 h-4" />
            </button>
        </div>
    );
}

export default ViewToggle;
