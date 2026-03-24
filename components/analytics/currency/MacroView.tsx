'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CentralBankDashboard } from './CentralBankDashboard';
import { CarryTradeTable } from './CarryTradeTable';
import { EconomicCalendar } from './EconomicCalendar';
import { CurrencyNewsPanel } from './CurrencyNewsPanel';
import { FIIFlowPanel } from './FIIFlowPanel';
import { CrossAssetPanel } from './CrossAssetPanel';
import { RBIReservesChart } from './RBIReservesChart';
import { CotDashboard } from './CotDashboard';

const ANIM = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface MacroViewProps {
  selectedPair?: string;
}

export function MacroView({ selectedPair = 'USD/INR' }: MacroViewProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [minutesAgo, setMinutesAgo] = useState(0);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(k => k + 1);
      setLastRefresh(Date.now());
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Update "minutes ago" display every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      setMinutesAgo(Math.floor((Date.now() - lastRefresh) / 60_000));
    }, 30_000);
    return () => clearInterval(timer);
  }, [lastRefresh]);

  const handleManualRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
    setLastRefresh(Date.now());
    setMinutesAgo(0);
  }, []);

  return (
    <div className="space-y-4">
      {/* Staleness indicator + manual refresh */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-[10px] text-muted-foreground">
          {minutesAgo === 0 ? 'Just updated' : `Updated ${minutesAgo}m ago`}
        </span>
        <button
          onClick={handleManualRefresh}
          className="p-1 rounded hover:bg-white/[0.06] transition-colors"
          title="Refresh macro data"
        >
          <RefreshCw className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[5fr_4fr] gap-5">
        {/* Left column: Central Bank + Carry + FII Flow + RBI Reserves */}
        <motion.div {...ANIM} className="space-y-4">
          <CentralBankDashboard key={`cb-${refreshKey}`} />
          <CarryTradeTable key={`ct-${refreshKey}`} />
          <FIIFlowPanel key={`fii-${refreshKey}`} />
          <RBIReservesChart key={`rbi-${refreshKey}`} />
        </motion.div>

        {/* Right column: Calendar + Cross-Asset + COT + News */}
        <motion.div {...ANIM} transition={{ ...ANIM.transition, delay: 0.08 }} className="space-y-4">
          <EconomicCalendar key={`cal-${refreshKey}`} />
          <CrossAssetPanel key={`ca-${refreshKey}`} />
          <CotDashboard key={`cot-${refreshKey}`} />
          <CurrencyNewsPanel key={`news-${refreshKey}`} pair={selectedPair} />
        </motion.div>
      </div>
    </div>
  );
}
