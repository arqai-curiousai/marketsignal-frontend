'use client';

import React from 'react';
import { SimKPIStrip } from '@/components/playground/simulations/shared/SimKPIStrip';
import type { SimKPI } from '@/components/playground/simulations/shared/SimKPIStrip';
import type { IRiskScoreResult } from '@/types/simulation';
import { fmtScoreFull, getZoneForScore } from './risk-tokens';
import { fmtDecimal, fmtPercentAbs } from '@/components/playground/simulations/shared/sim-tokens';

interface Props {
  data: IRiskScoreResult;
  className?: string;
}

export function RiskKPIRow({ data, className }: Props) {
  const zoneConfig = getZoneForScore(data.compositeScore);

  // Extract sub-score values for KPIs
  const findSub = (name: string) =>
    data.subScores.find((s) => s.name === name);

  const beta = findSub('market_risk');
  const hhi = findSub('concentration');
  const vol = findSub('volatility');
  const cvar = findSub('tail_risk');

  // Compute meaningful display values from sub-score details
  const betaVal = beta?.detail?.beta as number | undefined;
  const hhiVal = hhi?.detail?.hhi as number | undefined;
  const volVal = vol?.detail?.annualized_vol as number | undefined;
  const cvarVal = cvar?.detail?.cvar_95 as number | undefined;

  const kpis: SimKPI[] = [
    {
      label: 'Composite',
      value: fmtScoreFull(data.compositeScore),
      colorHex: zoneConfig.hex,
    },
    {
      label: 'Zone',
      value: zoneConfig.label,
      colorHex: zoneConfig.hex,
    },
    {
      label: 'Beta',
      value: betaVal != null ? fmtDecimal(betaVal, 2) : `${Math.round(beta?.score ?? 0)}/99`,
    },
    {
      label: 'HHI',
      value: hhiVal != null ? fmtDecimal(hhiVal, 3) : `${Math.round(hhi?.score ?? 0)}/99`,
    },
    {
      label: 'Volatility',
      value: volVal != null ? fmtPercentAbs(volVal) : `${Math.round(vol?.score ?? 0)}/99`,
    },
    {
      label: 'CVaR',
      value: cvarVal != null ? fmtPercentAbs(cvarVal) : `${Math.round(cvar?.score ?? 0)}/99`,
    },
  ];

  return <SimKPIStrip kpis={kpis} className={className} />;
}
