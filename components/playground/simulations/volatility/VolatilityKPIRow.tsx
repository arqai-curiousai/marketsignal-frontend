'use client';

import type { IVolatilityAnalysis } from '@/types/simulation';
import { getRegimeConfig, fmtVol, fmtPctl } from './vol-tokens';
import { SimKPIStrip, type SimKPI } from '../shared/SimKPIStrip';
import { formatNumber } from '@/src/lib/exchange/formatting';

interface Props {
  data: IVolatilityAnalysis;
  className?: string;
}

export function VolatilityKPIRow({ data, className }: Props) {
  const regimeConfig = getRegimeConfig(data.regime.regime);

  // Yang-Zhang current vol
  const yz = data.estimators.find((e) => e.name === 'yang_zhang');
  const currentVol = yz?.currentValue ?? data.regime.currentVol;

  // Vol change: compare current vs rolling series start
  const rolling21 = data.rollingSeries['21'];
  let volChange: number | null = null;
  if (rolling21 && rolling21.values.length >= 6) {
    const prev = rolling21.values[rolling21.values.length - 6];
    const curr = rolling21.values[rolling21.values.length - 1];
    if (prev > 0) {
      volChange = (curr - prev) / prev;
    }
  }

  const kpis: SimKPI[] = [
    {
      label: 'Yang-Zhang Vol',
      value: fmtVol(currentVol),
    },
    {
      label: 'Regime',
      value: regimeConfig.label,
      colorHex: regimeConfig.hex,
    },
    {
      label: 'Percentile',
      value: fmtPctl(data.regime.percentile),
    },
    {
      label: 'GARCH 5d',
      value: data.garch
        ? fmtVol(data.garch.forecastSeries.length >= 5 ? data.garch.forecastSeries[4].meanVol : data.garch.currentVol)
        : 'N/A',
    },
    {
      label: 'Vol Change (5d)',
      value: volChange != null ? `${volChange >= 0 ? '+' : ''}${(volChange * 100).toFixed(1)}%` : 'N/A',
    },
    {
      label: 'Data Points',
      value: formatNumber(data.dataPoints),
    },
  ];

  return <SimKPIStrip kpis={kpis} className={className} />;
}
