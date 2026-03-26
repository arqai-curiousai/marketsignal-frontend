'use client';

import type { IPortfolioOptimization } from '@/types/simulation';
import { fmtReturn, fmtWeight, fmtSharpe, getStrategyColor } from './portfolio-tokens';
import { SimKPIStrip, type SimKPI } from '../shared/SimKPIStrip';
import { formatNumber } from '@/src/lib/exchange/formatting';

interface Props {
  data: IPortfolioOptimization;
  className?: string;
}

export function PortfolioKPIRow({ data, className }: Props) {
  const best = data.strategies.find((s) => s.mode === data.bestStrategy);
  if (!best) return null;

  const bestColor = getStrategyColor(data.bestStrategy);

  // Diversification ratio: sum of individual vols / portfolio vol
  // Approximate from risk contributions
  const diversificationRatio = best.riskContribution.length > 0
    ? best.riskContribution.reduce((sum, r) => sum + r.weight, 0) /
      Math.max(best.metrics.annualVolatility, 0.001)
    : null;

  const kpis: SimKPI[] = [
    {
      label: 'Expected Return',
      value: fmtReturn(best.metrics.annualReturn),
      colorHex: best.metrics.annualReturn >= 0 ? '#4ADE80' : '#FB7185',
    },
    {
      label: 'Volatility',
      value: fmtWeight(best.metrics.annualVolatility),
    },
    {
      label: 'Sharpe Ratio',
      value: fmtSharpe(best.metrics.sharpe),
      colorHex: bestColor,
    },
    {
      label: 'Max Drawdown',
      value: fmtReturn(best.metrics.maxDrawdown),
      colorHex: '#FB7185',
    },
    {
      label: 'Div. Ratio',
      value: diversificationRatio != null ? diversificationRatio.toFixed(2) : 'N/A',
    },
    {
      label: 'Data Points',
      value: formatNumber(data.dataPoints),
    },
  ];

  return <SimKPIStrip kpis={kpis} className={className} />;
}
