'use client';

import { Diamond } from 'lucide-react';

export function CommodityDashboard() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <Diamond className="h-12 w-12 mb-4 opacity-30" />
      <p className="text-lg font-medium">Commodity Analytics</p>
      <p className="text-sm mt-1 text-muted-foreground/70">
        Coming Soon — MCX/COMEX data integration in progress
      </p>
      <p className="text-xs mt-3 text-muted-foreground/50 max-w-md text-center">
        Gold, Silver, Crude Oil, Natural Gas, and Copper analytics with pattern detection,
        seasonality heatmaps, and real-time price tracking will be available once a
        commodity data provider is integrated.
      </p>
    </div>
  );
}
