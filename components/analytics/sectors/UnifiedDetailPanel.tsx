'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { ISectorAnalytics, SectorTimeframe } from '@/types/analytics';
import { SectorDetailPanel } from './SectorDetailPanel';
import { StockDetailPanel } from '../pyramid/StockDetailPanel';

type DetailMode = 'overview' | 'sector' | 'stock';

interface UnifiedDetailPanelProps {
  mode: DetailMode;
  sectors: ISectorAnalytics[];
  selectedSector: ISectorAnalytics | null;
  selectedStock: string | null;
  timeframe: SectorTimeframe;
  onSectorSelect: (sector: ISectorAnalytics | null) => void;
  onDrillOpen: (sector: ISectorAnalytics) => void;
  onStockClose: () => void;
}

export function UnifiedDetailPanel({
  mode,
  sectors,
  selectedSector,
  selectedStock,
  timeframe,
  onSectorSelect,
  onDrillOpen,
  onStockClose,
}: UnifiedDetailPanelProps) {
  // Stock detail mode — inline Company Intelligence panel
  if (mode === 'stock' && selectedStock) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`stock-${selectedStock}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="overflow-y-auto max-h-[calc(100vh-220px)]"
        >
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={onStockClose}
              aria-label="Back to sector"
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-brand-blue/50 focus-visible:outline-none"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <span className="text-[10px] text-muted-foreground">
              Back to {selectedSector?.sector ?? 'sectors'}
            </span>
          </div>
          <StockDetailPanel ticker={selectedStock} onClose={onStockClose} />
        </motion.div>
      </AnimatePresence>
    );
  }

  // Overview + sector modes — delegate to existing SectorDetailPanel
  return (
    <SectorDetailPanel
      selectedSector={selectedSector}
      allSectors={sectors}
      timeframe={timeframe}
      onSectorSelect={onSectorSelect}
      onDrillOpen={onDrillOpen}
    />
  );
}
