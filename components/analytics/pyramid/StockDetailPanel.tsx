'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  getStockFundamentals,
  getStockOwnership,
  getStockFilings,
} from '@/src/lib/api/analyticsApi';
import apiClient from '@/src/lib/api/apiClient';
import type {
  IStockFundamentals,
  IOwnershipSummary,
  IFilingSummary,
} from './constants';
import { CompanySnapshot } from './CompanySnapshot';
import { ValuationScorecard } from './ValuationScorecard';
import { FinancialHealth } from './FinancialHealth';
import { OwnershipPanel } from './OwnershipPanel';
import { CorporateFilings } from './CorporateFilings';
import { TechnicalSnapshot } from './TechnicalSnapshot';

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
type PatternData = Parameters<typeof TechnicalSnapshot>[0]['patternData'];

interface StockDetailPanelProps {
  ticker: string;
  onClose: () => void;
}

export function StockDetailPanel({ ticker, onClose }: StockDetailPanelProps) {
  const [fundamentals, setFundamentals] = useState<IStockFundamentals | null>(null);
  const [ownership, setOwnership] = useState<IOwnershipSummary | null>(null);
  const [filings, setFilings] = useState<IFilingSummary | null>(null);
  const [patternData, setPatternData] = useState<PatternData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);

      // Fetch all data in parallel
      const [fundResult, ownResult, filResult] = await Promise.all([
        getStockFundamentals(ticker),
        getStockOwnership(ticker),
        getStockFilings(ticker),
      ]);

      if (cancelled) return;

      if (fundResult.success) setFundamentals(fundResult.data);
      if (ownResult.success) setOwnership(ownResult.data);
      if (filResult.success) setFilings(filResult.data);

      // Try to fetch pattern data (may not exist)
      try {
        const patResult = await apiClient.get(`/api/analytics/${ticker}/patterns`);
        if (!cancelled && patResult.success) {
          setPatternData(patResult.data as PatternData);
        }
      } catch {
        // Pattern data is optional
      }

      if (!cancelled) setLoading(false);
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Close button */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Company Intelligence
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-white/[0.06] transition-colors"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Section A: Company Snapshot */}
      {fundamentals && <CompanySnapshot data={fundamentals} />}

      <div className="border-t border-white/[0.06]" />

      {/* Section B: Valuation Scorecard */}
      {fundamentals?.key_statistics && (
        <>
          <ValuationScorecard
            stats={fundamentals.key_statistics}
            medians={fundamentals.sector_medians}
          />
          <div className="border-t border-white/[0.06]" />
        </>
      )}

      {/* Section C: Financial Health */}
      {fundamentals && (
        <>
          <FinancialHealth
            income={fundamentals.quarterly_financials.income_statement}
            balance={fundamentals.quarterly_financials.balance_sheet}
          />
          <div className="border-t border-white/[0.06]" />
        </>
      )}

      {/* Section D: Ownership */}
      {ownership && (
        <>
          <OwnershipPanel data={ownership} />
          <div className="border-t border-white/[0.06]" />
        </>
      )}

      {/* Section E: Corporate Filings */}
      {filings && (
        <>
          <CorporateFilings data={filings} />
          <div className="border-t border-white/[0.06]" />
        </>
      )}

      {/* Section F: Technical Snapshot */}
      <TechnicalSnapshot patternData={patternData} />
    </div>
  );
}
