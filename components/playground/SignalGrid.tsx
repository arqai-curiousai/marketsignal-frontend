'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SignalDot } from './SignalDot';
import { getSignalLabel, getSignalBg } from '@/types/playground';
import type { IAlgoSignal } from '@/types/playground';

interface SignalGridProps {
  signals: IAlgoSignal[];
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatIndicators(indicators: Record<string, number>): string {
  return Object.entries(indicators)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' | ');
}

export function SignalGrid({ signals }: SignalGridProps) {
  if (signals.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        No signals yet. Algos will generate signals when OHLCV data is available.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-white/10 overflow-hidden"
    >
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-muted-foreground">Ticker</TableHead>
            <TableHead className="text-muted-foreground">Signal</TableHead>
            <TableHead className="text-muted-foreground">Confidence</TableHead>
            <TableHead className="text-muted-foreground hidden md:table-cell">Algorithm</TableHead>
            <TableHead className="text-muted-foreground hidden lg:table-cell">Indicators</TableHead>
            <TableHead className="text-muted-foreground hidden md:table-cell">Price</TableHead>
            <TableHead className="text-muted-foreground">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {signals.map((s, i) => (
            <motion.tr
              key={s.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="border-white/5 hover:bg-white/5 transition-colors"
            >
              <TableCell className="font-mono font-semibold text-white">
                {s.ticker}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <SignalDot signal={s.signal} size="sm" />
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold border ${getSignalBg(s.signal)}`}
                  >
                    {getSignalLabel(s.signal)}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-violet"
                      style={{ width: `${s.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(s.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell text-xs text-muted-foreground capitalize">
                {s.algoName.replace(/_/g, ' ')}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono max-w-[200px] truncate">
                {formatIndicators(s.indicators)}
              </TableCell>
              <TableCell className="hidden md:table-cell font-mono text-sm">
                {s.priceAtSignal != null ? `$${s.priceAtSignal.toFixed(2)}` : '—'}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatTime(s.generatedAt)}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </motion.div>
  );
}
