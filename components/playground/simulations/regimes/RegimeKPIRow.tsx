'use client';

import type { IRegimeAnalysis } from '@/types/simulation';
import { getRegimeColor, fmtProb, fmtDays } from './regime-tokens';
import { SimKPIStrip, type SimKPI } from '../shared/SimKPIStrip';
import { formatNumber } from '@/src/lib/exchange/formatting';

interface Props {
  data: IRegimeAnalysis;
  className?: string;
}

export function RegimeKPIRow({ data, className }: Props) {
  const currentColor = getRegimeColor(data.currentState.label);

  // Find highest self-transition probability (persistence)
  let maxPersistence = 0;
  for (const row of data.transitionMatrix) {
    for (const cell of row) {
      if (cell.fromLabel === cell.toLabel && cell.probability > maxPersistence) {
        maxPersistence = cell.probability;
      }
    }
  }

  const kpis: SimKPI[] = [
    {
      label: 'Current Regime',
      value: currentColor.label,
      colorHex: currentColor.hex,
    },
    {
      label: 'Confidence',
      value: fmtProb(data.currentState.probability),
    },
    {
      label: 'Duration',
      value: fmtDays(data.currentState.durationDays),
    },
    {
      label: 'States',
      value: `${data.nStates}`,
    },
    {
      label: 'Persistence',
      value: fmtProb(maxPersistence),
    },
    {
      label: 'Data Points',
      value: formatNumber(data.dataPoints),
    },
  ];

  return <SimKPIStrip kpis={kpis} className={className} />;
}
