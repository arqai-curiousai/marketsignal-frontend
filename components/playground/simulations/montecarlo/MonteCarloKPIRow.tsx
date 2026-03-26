'use client';

import type { IMonteCarloAnalysis } from '@/types/simulation';
import { fmtPrice, fmtPct, fmtProb, HORIZON_LABELS } from './mc-tokens';
import { SimKPIStrip, type SimKPI } from '../shared/SimKPIStrip';
import { formatNumber } from '@/src/lib/exchange/formatting';

/** Map named colors to hex values */
const COLOR_HEX: Record<string, string> = {
  green: '#34D399',
  amber: '#FBBF24',
  red: '#FB7185',
};

interface Props {
  data: IMonteCarloAnalysis;
  className?: string;
}

export function MonteCarloKPIRow({ data, className }: Props) {
  const rm = data.regimeAware.riskMetrics;
  const probProfit = rm.probProfit;
  const probColor = probProfit >= 0.6 ? 'green' : probProfit >= 0.4 ? 'amber' : 'red';
  const horizonLabel = HORIZON_LABELS[data.horizon] ?? `${data.horizon}d`;

  const kpis: SimKPI[] = [
    {
      label: 'Prob of Profit',
      value: fmtProb(probProfit),
      colorHex: COLOR_HEX[probColor],
    },
    {
      label: 'Expected Return',
      value: fmtPct(rm.expectedReturn),
      colorHex: rm.expectedReturn >= 0 ? COLOR_HEX.green : COLOR_HEX.red,
    },
    {
      label: 'Median Price',
      value: fmtPrice(data.regimeAware.finalDistribution.stats.median),
    },
    {
      label: 'VaR 5%',
      value: fmtPct(rm.var5),
      colorHex: COLOR_HEX.amber,
    },
    {
      label: 'Horizon',
      value: horizonLabel,
    },
    {
      label: 'Simulations',
      value: formatNumber(data.nPaths),
    },
  ];

  return <SimKPIStrip kpis={kpis} className={className} />;
}
