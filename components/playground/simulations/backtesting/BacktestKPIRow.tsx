'use client';

import type { IBacktestAnalysis } from '@/types/simulation';
import {
  fmtReturn,
  fmtSharpe,
  getTrafficConfig,
} from './backtest-tokens';
import { SimKPIStrip, type SimKPI } from '../shared/SimKPIStrip';

interface Props {
  data: IBacktestAnalysis;
  className?: string;
}

export function BacktestKPIRow({ data, className }: Props) {
  const best = data.strategies.find((s) => s.name === data.bestStrategy);
  const bestReturn = best?.backtest.aggregate.totalReturnNet ?? null;
  const bestDeflatedSharpe = best?.deflatedSharpe.deflatedSharpe ?? null;

  // Find strategy with lowest overfit risk (green > yellow > red)
  const overfitRank: Record<string, number> = { green: 0, yellow: 1, red: 2 };
  const lowestOverfit = [...data.strategies].sort(
    (a, b) => (overfitRank[a.overfitting.trafficLight] ?? 2) - (overfitRank[b.overfitting.trafficLight] ?? 2),
  )[0];
  const lowestOverfitConfig = lowestOverfit ? getTrafficConfig(lowestOverfit.overfitting.trafficLight) : null;

  const kpis: SimKPI[] = [
    {
      label: 'Best Strategy',
      value: best?.label ?? '\u2014',
    },
    {
      label: 'Best Return (Net)',
      value: fmtReturn(bestReturn),
      colorHex: bestReturn != null && bestReturn >= 0 ? '#4ADE80' : '#FB7185',
    },
    {
      label: 'Best Sharpe (Defl.)',
      value: fmtSharpe(bestDeflatedSharpe),
      colorHex: bestDeflatedSharpe != null && bestDeflatedSharpe > 1 ? '#4ADE80' : undefined,
    },
    {
      label: 'Lowest Overfit Risk',
      value: lowestOverfitConfig?.label ?? '\u2014',
      colorHex: lowestOverfitConfig?.hex,
    },
    {
      label: 'Period',
      value: `${data.period.start} \u2013 ${data.period.end}`,
    },
    {
      label: 'Strategies Tested',
      value: String(data.strategies.length),
    },
  ];

  return <SimKPIStrip kpis={kpis} className={className} />;
}
