'use client';

import { Network } from 'lucide-react';

export function ContagionDashboard() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-4">
        <Network className="h-8 w-8 text-cyan-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">Contagion Network</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Network contagion analysis and systemic risk mapping. Coming soon.
      </p>
    </div>
  );
}
