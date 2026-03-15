'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAssetCorrelations, getAutocorrelation } from '@/src/lib/api/analyticsApi';
import type { IAssetCorrelations, IAutocorrelation } from '@/types/analytics';
import { ASSET_MAP, corrColor } from './constants';

interface AssetExplorerProps {
  selectedAssets: string[];
  window: string;
  method: string;
  onPairSelect: (pair: [string, string] | null) => void;
}

export function AssetExplorer({
  selectedAssets,
  window: windowValue,
  method,
  onPairSelect,
}: AssetExplorerProps) {
  const [data, setData] = useState<IAssetCorrelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [acfData, setAcfData] = useState<IAutocorrelation | null>(null);
  const [showAcf, setShowAcf] = useState(false);

  const focusTicker = selectedAssets.length > 0 ? selectedAssets[0] : null;

  useEffect(() => {
    if (!focusTicker) {
      setData(null);
      setAcfData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setAcfData(null);

    getAssetCorrelations(focusTicker, windowValue, method).then((result) => {
      if (cancelled) return;
      if (result.success && result.data && !('error' in result.data)) {
        setData(result.data);
      } else {
        setData(null);
      }
      setLoading(false);
    });

    // Fetch autocorrelation non-blocking
    const windowMap: Record<string, number> = { '30d': 30, '90d': 90, '180d': 180, '365d': 365 };
    const exchange = ASSET_MAP.get(focusTicker)?.type === 'stock' ? 'NSE' : ASSET_MAP.get(focusTicker)?.type === 'currency' ? 'FX' : 'CMDTY';
    getAutocorrelation(focusTicker, exchange, windowMap[windowValue] ?? 90).then((result) => {
      if (cancelled) return;
      if (result.success && result.data && !('error' in result.data)) {
        setAcfData(result.data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [focusTicker, windowValue, method]);

  if (!focusTicker) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Select an asset to explore its correlations
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading correlations for {ASSET_MAP.get(focusTicker)?.name ?? focusTicker}...
      </div>
    );
  }

  if (!data || data.peers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No correlation data available for {ASSET_MAP.get(focusTicker)?.name ?? focusTicker}
      </div>
    );
  }

  const sorted = [...data.peers].sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  const mostCorrelated = data.most_correlated;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
        <span>
          <span className="text-white/80 font-medium">{data.total_peers}</span> peers
        </span>
        <span>
          avg:{' '}
          <span
            className="font-medium"
            style={{ color: corrColor(data.avg_correlation) }}
          >
            {data.avg_correlation.toFixed(3)}
          </span>
        </span>
        {mostCorrelated && (
          <span>
            most:{' '}
            <span className="text-white/80 font-medium">
              {ASSET_MAP.get(mostCorrelated.peer)?.name ?? mostCorrelated.peer}
            </span>{' '}
            <span style={{ color: corrColor(mostCorrelated.correlation) }}>({mostCorrelated.correlation.toFixed(3)})</span>
          </span>
        )}
      </div>

      {/* Bar chart */}
      <div className="max-h-[600px] overflow-y-auto space-y-1 pr-1">
        {sorted.map((peer) => {
          const asset = ASSET_MAP.get(peer.peer);
          const label = asset?.name ?? peer.peer;
          const corr = peer.correlation;
          const absWidth = Math.abs(corr) * 50;
          const isPositive = corr >= 0;

          return (
            <button
              key={peer.peer}
              type="button"
              onClick={() => onPairSelect([focusTicker, peer.peer])}
              className={cn(
                'flex items-center w-full gap-2 py-1.5 px-1 rounded-md',
                'hover:bg-white/5 transition-colors cursor-pointer text-left group'
              )}
            >
              {/* Ticker label */}
              <span
                className="w-20 text-xs text-white/80 truncate shrink-0 group-hover:text-white transition-colors"
                title={label}
              >
                {label}
              </span>

              {/* Bar container */}
              <div className="flex-1 relative h-5">
                {/* Center line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />

                {/* Bar */}
                <div
                  className="absolute top-0.5 bottom-0.5 rounded-sm transition-all"
                  style={{
                    backgroundColor: corrColor(corr),
                    width: `${absWidth}%`,
                    ...(isPositive
                      ? { left: '50%' }
                      : { right: '50%' }),
                    opacity: 0.8,
                  }}
                />
              </div>

              {/* Value label */}
              <span
                className="w-12 text-xs font-mono text-right shrink-0"
                style={{ color: corrColor(corr) }}
              >
                {corr >= 0 ? '+' : ''}
                {corr.toFixed(3)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Autocorrelation (ACF) */}
      {acfData && (
        <div className="border-t border-white/10 pt-2 mt-2">
          <button
            onClick={() => setShowAcf(!showAcf)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-white transition-colors px-1 mb-1"
          >
            <BarChart3 className="h-3 w-3" />
            Autocorrelation (ACF)
            <span className="text-[10px] text-muted-foreground/60 ml-1">
              {acfData.significant_lags.length > 0
                ? `${acfData.significant_lags.length} significant lag${acfData.significant_lags.length > 1 ? 's' : ''}`
                : 'no significant lags'}
            </span>
          </button>

          {showAcf && (
            <div className="px-1 space-y-1.5">
              {/* ACF bar chart */}
              <div className="flex items-end gap-px h-20">
                {acfData.lags.map((lag, i) => {
                  const val = acfData.acf[i];
                  const isSignificant = acfData.significant_lags.includes(lag);
                  const barHeight = Math.abs(val) * 100;
                  const isPos = val >= 0;

                  return (
                    <div key={lag} className="flex-1 flex flex-col items-center justify-end h-full relative" title={`Lag ${lag}: ${val.toFixed(3)}`}>
                      {/* Zero line positioned at 50% */}
                      <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10" />

                      {/* Bar */}
                      <div
                        className={cn('w-full rounded-sm min-w-[3px]', isSignificant ? 'opacity-100' : 'opacity-50')}
                        style={{
                          height: `${barHeight / 2}%`,
                          backgroundColor: isSignificant ? corrColor(val) : '#71717A',
                          position: 'absolute',
                          ...(isPos ? { bottom: '50%' } : { top: '50%' }),
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Lag labels */}
              <div className="flex gap-px">
                {acfData.lags.map((lag) => (
                  <div key={lag} className="flex-1 text-center text-[7px] text-muted-foreground/60">
                    {lag % 5 === 0 ? lag : ''}
                  </div>
                ))}
              </div>

              {/* Interpretation */}
              <p className="text-[10px] text-muted-foreground px-0.5">{acfData.interpretation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
