'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import {
  getCorrelations,
  getCrossAsset,
  getGlobalIndices,
  getEnhancedMatrix,
  getMST,
  getCommunities,
} from '@/src/lib/api/analyticsApi';
import type {
  ICorrelationMatrix,
  ICrossAssetCorrelation,
  IGlobalEffects,
  IEnhancedMatrix,
  IMST,
  ICommunityDetection,
} from '@/types/analytics';
import { type CorrelationMethod, type ViewMode } from './correlation/constants';
import { CorrelationToolbar, type ColorMode } from './correlation/CorrelationToolbar';
import { NetworkGraph } from './correlation/NetworkGraph';
import { HeatmapMatrix } from './correlation/HeatmapMatrix';
import { PairDetailPanel } from './correlation/PairDetailPanel';

export function CorrelationExplorer() {
  // ── Data state ──
  const [equityMatrix, setEquityMatrix] = useState<ICorrelationMatrix | null>(null);
  const [enhancedMatrix, setEnhancedMatrix] = useState<IEnhancedMatrix | null>(null);
  const [crossAssetPairs, setCrossAssetPairs] = useState<ICrossAssetCorrelation[]>([]);
  const [globalData, setGlobalData] = useState<IGlobalEffects | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // ── Selection state ──
  const [selectedAssets, setSelectedAssets] = useState<string[]>([
    'HDFCBANK', 'ICICIBANK', 'SBIN', 'TCS', 'INFY',
  ]);
  const [selectedPair, setSelectedPair] = useState<[string, string] | null>(null);

  // ── Controls ──
  const [windowValue, setWindowValue] = useState('90d');
  const [method, setMethod] = useState<CorrelationMethod>('pearson');
  const [minEdgeCorr, setMinEdgeCorr] = useState(0.2);
  const [viewMode, setViewMode] = useState<ViewMode>('network');

  // ── Network Intelligence (Phase 2) ──
  const [mstEnabled, setMstEnabled] = useState(false);
  const [mstData, setMstData] = useState<IMST | null>(null);
  const [colorMode, setColorMode] = useState<ColorMode>('type');
  const [communityData, setCommunityData] = useState<ICommunityDetection | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // Data Fetching
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setDataLoading(true);
      const [corrResult, enhancedResult, crossResult, globalResult] = await Promise.all([
        getCorrelations(windowValue, 'equity'),
        getEnhancedMatrix(windowValue, 'equity', method),
        getCrossAsset(undefined, undefined, 0.1),
        getGlobalIndices(),
      ]);

      if (cancelled) return;

      if (corrResult.success && corrResult.data) {
        setEquityMatrix(corrResult.data);
      }
      if (enhancedResult.success && enhancedResult.data && !('error' in enhancedResult.data)) {
        setEnhancedMatrix(enhancedResult.data);
      }
      if (crossResult.success && crossResult.data?.items) {
        setCrossAssetPairs(crossResult.data.items);
      }
      if (globalResult.success && globalResult.data) {
        setGlobalData(globalResult.data);
      }
      setDataLoading(false);
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [windowValue, method]);

  // MST fetch (on-demand when toggled)
  useEffect(() => {
    if (!mstEnabled || selectedAssets.length < 3) {
      setMstData(null);
      return;
    }
    const windowDays = parseInt(windowValue) || 90;
    getMST(selectedAssets, windowDays).then((result) => {
      if (result.success && result.data && !('error' in result.data)) {
        setMstData(result.data);
      }
    });
  }, [mstEnabled, selectedAssets, windowValue]);

  // Community detection (on-demand when color mode is community)
  useEffect(() => {
    if (colorMode !== 'community' || selectedAssets.length < 4) {
      setCommunityData(null);
      return;
    }
    const windowDays = parseInt(windowValue) || 90;
    getCommunities(selectedAssets, windowDays).then((result) => {
      if (result.success && result.data && !('error' in result.data)) {
        setCommunityData(result.data);
      }
    });
  }, [colorMode, selectedAssets, windowValue]);

  // ═══════════════════════════════════════════════════════════════
  // Correlation Lookup (shared by NetworkGraph and HeatmapMatrix)
  // ═══════════════════════════════════════════════════════════════

  const getCorr = useCallback(
    (a: string, b: string): number | null => {
      if (a === b) return 1;
      // Use enhanced matrix if available, fall back to basic
      const matrix = enhancedMatrix || equityMatrix;
      if (matrix?.matrix_data) {
        const key1 = `${a}:${b}`;
        const key2 = `${b}:${a}`;
        if (key1 in matrix.matrix_data) return matrix.matrix_data[key1];
        if (key2 in matrix.matrix_data) return matrix.matrix_data[key2];
      }
      // Cross-asset pairs
      const pair = crossAssetPairs.find(
        (p) =>
          (p.source_ticker === a && p.target_ticker === b) ||
          (p.source_ticker === b && p.target_ticker === a),
      );
      if (pair) return pair.correlation;
      return null;
    },
    [enhancedMatrix, equityMatrix, crossAssetPairs],
  );

  // ═══════════════════════════════════════════════════════════════
  // Asset Management
  // ═══════════════════════════════════════════════════════════════

  const addAsset = useCallback((ticker: string) => {
    setSelectedAssets((prev) => (prev.includes(ticker) ? prev : [...prev, ticker]));
  }, []);

  const removeAsset = useCallback(
    (ticker: string) => {
      setSelectedAssets((prev) => prev.filter((t) => t !== ticker));
      if (selectedPair && selectedPair.includes(ticker)) {
        setSelectedPair(null);
      }
    },
    [selectedPair],
  );

  const addGroup = useCallback((tickers: string[]) => {
    setSelectedAssets((prev) => {
      const set = new Set(prev);
      tickers.forEach((t) => set.add(t));
      return Array.from(set);
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelectedAssets([]);
    setSelectedPair(null);
  }, []);

  // ── Pair correlation value ──
  const pairCorrelation = useMemo(() => {
    if (!selectedPair || !selectedPair[1]) return null;
    return getCorr(selectedPair[0], selectedPair[1]);
  }, [selectedPair, getCorr]);

  // ═══════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <CorrelationToolbar
        selectedAssets={selectedAssets}
        window={windowValue}
        method={method}
        minEdgeCorr={minEdgeCorr}
        viewMode={viewMode}
        mstEnabled={mstEnabled}
        colorMode={colorMode}
        onAddAsset={addAsset}
        onAddGroup={addGroup}
        onRemoveAsset={removeAsset}
        onClearAll={clearAll}
        onWindowChange={setWindowValue}
        onMethodChange={setMethod}
        onMinEdgeCorrChange={setMinEdgeCorr}
        onViewModeChange={setViewMode}
        onMstToggle={setMstEnabled}
        onColorModeChange={setColorMode}
      />

      {/* ── Main Content: View + Detail Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active View */}
        <div className="lg:col-span-2">
          {viewMode === 'network' ? (
            <NetworkGraph
              selectedAssets={selectedAssets}
              getCorr={getCorr}
              minEdgeCorr={minEdgeCorr}
              selectedPair={selectedPair}
              onPairSelect={setSelectedPair}
              mstEdges={mstEnabled ? mstData?.edges ?? null : null}
              communityMap={colorMode === 'community' ? communityData?.node_community ?? null : null}
              hubNode={mstEnabled ? mstData?.hub_node ?? null : null}
            />
          ) : (
            <HeatmapMatrix
              matrix={enhancedMatrix}
              selectedAssets={selectedAssets}
              selectedPair={selectedPair}
              onPairSelect={setSelectedPair}
            />
          )}
        </div>

        {/* Detail Panel */}
        <PairDetailPanel
          selectedPair={selectedPair}
          pairCorrelation={pairCorrelation}
          window={windowValue}
          method={method}
          equityMatrix={equityMatrix}
          globalData={globalData}
          onAddAsset={addAsset}
          onPairSelect={setSelectedPair}
        />
      </div>
    </div>
  );
}
