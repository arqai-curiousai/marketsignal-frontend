'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api/apiClient';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
} from 'lucide-react';
import Link from 'next/link';

interface AgentDetail {
  bias: string;
  confidence: number;
  reasoning: string;
}

interface SignalDetail {
  ticker: string;
  exchange: string;
  action: string;
  confidence: number;
  conflict_type: string;
  market_maker: AgentDetail;
  retail: AgentDetail;
  price_at_signal: number | null;
  generated_at: string;
  is_eod: boolean;
}

const actionConfig: Record<string, { color: string; bg: string; icon: typeof TrendingUp }> = {
  BUY: { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', icon: TrendingUp },
  SELL: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: TrendingDown },
  HOLD: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: Minus },
};

const conflictConfig: Record<string, { label: string; color: string }> = {
  divergence: { label: 'Divergence', color: 'border-brand-violet/50 text-brand-violet' },
  alignment: { label: 'Alignment', color: 'border-brand-emerald/50 text-brand-emerald' },
  uncertain: { label: 'Uncertain', color: 'border-yellow-500/50 text-yellow-400' },
};

export default function SignalDetailPage() {
  const { id } = useParams();
  const ticker = typeof id === 'string' ? id.toUpperCase() : '';
  const [signal, setSignal] = useState<SignalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSignal = async () => {
      if (!ticker) return;
      const result = await apiClient.get<SignalDetail>(
        `/api/signals/${ticker}/detail`
      );
      if (result.success) {
        setSignal(result.data);
      } else {
        setError(result.error.detail || 'Failed to load signal');
      }
      setIsLoading(false);
    };
    loadSignal();
  }, [ticker]);

  if (isLoading) {
    return (
      <div className="container py-24 text-center text-muted-foreground">
        Loading signal data...
      </div>
    );
  }

  if (error || !signal) {
    return (
      <div className="container py-24 text-center">
        <p className="text-muted-foreground mb-4">
          {error || 'No signal found for this ticker.'}
        </p>
        <Link href="/signals">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pulse
          </Button>
        </Link>
      </div>
    );
  }

  const action = actionConfig[signal.action] || actionConfig.HOLD;
  const conflict = conflictConfig[signal.conflict_type] || conflictConfig.uncertain;
  const ActionIcon = action.icon;

  return (
    <div className="container py-12 px-6 max-w-5xl">
      <Link
        href="/signals"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-white mb-8 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
        Back to Pulse
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white">{signal.ticker}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={`${action.bg} border ${action.color} gap-1`}>
            <ActionIcon className="h-3.5 w-3.5" />
            {signal.action}
          </Badge>
          <Badge variant="outline" className={conflict.color}>
            {conflict.label}
          </Badge>
          {signal.is_eod && (
            <Badge variant="outline" className="border-blue-500/50 text-blue-400">
              EOD
            </Badge>
          )}
        </div>
      </div>

      {/* Confidence + Price row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <Card className="p-5 bg-white/5 border-white/10">
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
            Confidence
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            {(signal.confidence * 100).toFixed(0)}%
          </div>
          <Progress value={signal.confidence * 100} className="h-2" />
        </Card>
        <Card className="p-5 bg-white/5 border-white/10">
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
            Price at Signal
          </div>
          <div className="text-2xl font-bold text-white">
            {signal.price_at_signal != null
              ? `\u20B9${signal.price_at_signal.toLocaleString('en-IN')}`
              : 'N/A'}
          </div>
        </Card>
        <Card className="p-5 bg-white/5 border-white/10">
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
            Generated
          </div>
          <div className="text-sm font-medium text-white flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {new Date(signal.generated_at).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </div>
        </Card>
      </div>

      {/* Dual Agent Comparison */}
      <h2 className="text-sm font-semibold text-white uppercase tracking-widest mb-6">
        Agent Analysis
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Market Maker */}
        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Market Maker</h3>
              <p className="text-xs text-muted-foreground">Institutional / Smart Money</p>
            </div>
            <Badge variant="outline" className="text-xs capitalize">
              {signal.market_maker.bias}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-muted-foreground">Confidence</span>
            <Progress value={signal.market_maker.confidence * 100} className="h-1.5 flex-1" />
            <span className="text-xs text-white font-medium">
              {(signal.market_maker.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {signal.market_maker.reasoning || 'No reasoning provided.'}
          </p>
        </Card>

        {/* Retail Investor */}
        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Retail Investor</h3>
              <p className="text-xs text-muted-foreground">Crowd Sentiment</p>
            </div>
            <Badge variant="outline" className="text-xs capitalize">
              {signal.retail.bias}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-muted-foreground">Confidence</span>
            <Progress value={signal.retail.confidence * 100} className="h-1.5 flex-1" />
            <span className="text-xs text-white font-medium">
              {(signal.retail.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {signal.retail.reasoning || 'No reasoning provided.'}
          </p>
        </Card>
      </div>

      {/* Actions + Disclaimer */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <Link
          href={`/assistant?q=Explain the ${signal.action} signal for ${signal.ticker} with ${signal.conflict_type} conflict type`}
        >
          <Button className="bg-brand-blue hover:bg-brand-blue/90 text-white gap-2">
            <MessageSquare className="h-4 w-4" />
            Explain with AI
          </Button>
        </Link>
      </div>

      <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          This signal was generated by two independent AI agents analyzing market data
          from institutional and retail perspectives.
          <br /><br />
          <span className="text-white font-medium uppercase tracking-tighter">
            Information only — not investment advice.
          </span>
        </p>
      </div>
    </div>
  );
}
