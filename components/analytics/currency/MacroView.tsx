'use client';

import { motion } from 'framer-motion';
import { CentralBankDashboard } from './CentralBankDashboard';
import { CarryTradeTable } from './CarryTradeTable';
import { EconomicCalendar } from './EconomicCalendar';
import { CurrencyNewsPanel } from './CurrencyNewsPanel';

const ANIM = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

export function MacroView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left column: Central Bank + Carry */}
      <motion.div {...ANIM} className="space-y-4">
        <CentralBankDashboard />
        <CarryTradeTable />
      </motion.div>

      {/* Right column: Calendar + News */}
      <motion.div {...ANIM} transition={{ ...ANIM.transition, delay: 0.08 }} className="space-y-4">
        <EconomicCalendar />
        <CurrencyNewsPanel pair="USD/INR" />
      </motion.div>
    </div>
  );
}
