'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, ArrowRightLeft, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NSE_FOREX_PAIRS } from './constants';
import { getCurrencyOverview } from '@/src/lib/api/analyticsApi';

/* ─── Types ───────────────────────────────────────────────────────────────── */

type CalcTab = 'pip' | 'position';

/** Pip value config per pair: pip size, typical quote decimals */
const PIP_CONFIG: Record<string, { pipSize: number; decimals: number }> = {
  // JPY pairs: 1 pip = 0.01
  'USD/JPY': { pipSize: 0.01, decimals: 2 },
  'EUR/JPY': { pipSize: 0.01, decimals: 2 },
  'GBP/JPY': { pipSize: 0.01, decimals: 2 },
  'AUD/JPY': { pipSize: 0.01, decimals: 2 },
  'NZD/JPY': { pipSize: 0.01, decimals: 2 },
  'CAD/JPY': { pipSize: 0.01, decimals: 2 },
  'CHF/JPY': { pipSize: 0.01, decimals: 2 },
  'JPY/INR': { pipSize: 0.01, decimals: 4 },
  // INR pairs: 1 pip = 0.0025
  'USD/INR': { pipSize: 0.0025, decimals: 4 },
  'EUR/INR': { pipSize: 0.0025, decimals: 4 },
  'GBP/INR': { pipSize: 0.0025, decimals: 4 },
};

const DEFAULT_PIP = { pipSize: 0.0001, decimals: 4 };

/** Standard lot sizes */
const LOT_OPTIONS = [
  { label: 'Standard (100K)', value: 100_000 },
  { label: 'Mini (10K)', value: 10_000 },
  { label: 'Micro (1K)', value: 1_000 },
  { label: 'NSE (1 lot = 1K)', value: 1_000 },
] as const;

/** Account currency options */
const ACCOUNT_CURRENCIES = ['USD', 'INR', 'EUR', 'GBP'] as const;

/* ─── Pip Calculator ─────────────────────────────────────────────────────── */

function PipCalculator({ selectedPair, liveRates }: { selectedPair: string; liveRates: Map<string, number> }) {
  const [pair, setPair] = useState(selectedPair);
  const [pips, setPips] = useState('10');
  const [lotIndex, setLotIndex] = useState(0);
  const [accountCcy, setAccountCcy] = useState<string>('USD');
  const [conversionRate, setConversionRate] = useState('1');

  // Sync pair from parent when CommandBar changes
  useEffect(() => { setPair(selectedPair); }, [selectedPair]);

  const config = PIP_CONFIG[pair] ?? DEFAULT_PIP;
  const lotSize = LOT_OPTIONS[lotIndex].value;

  // Auto-populate conversion rate from live data
  useEffect(() => {
    const quoteCcy = pair.split('/')[1];
    if (quoteCcy === accountCcy) return;
    const rateKey = `${quoteCcy}/${accountCcy}`;
    const rate = liveRates.get(rateKey);
    if (rate) setConversionRate(rate.toFixed(4));
  }, [pair, accountCcy, liveRates]);

  const result = useMemo(() => {
    const pipCount = parseFloat(pips) || 0;
    const convRate = parseFloat(conversionRate) || 1;
    const quoteCcy = pair.split('/')[1];

    // Pip value in quote currency = pip_size × lot_size × pip_count
    const pipValueQuote = config.pipSize * lotSize * pipCount;

    // Convert to account currency
    let pipValueAccount = pipValueQuote;
    if (quoteCcy !== accountCcy) {
      pipValueAccount = pipValueQuote * convRate;
    }

    return {
      pipValueQuote: pipValueQuote,
      pipValueAccount: pipValueAccount,
      quoteCcy,
      onePipValue: config.pipSize * lotSize,
    };
  }, [pair, pips, lotIndex, accountCcy, conversionRate, config, lotSize]);

  return (
    <div className="space-y-4">
      {/* Pair selector */}
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Currency Pair">
          <select
            value={pair}
            onChange={e => setPair(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-sky-500/40"
          >
            {NSE_FOREX_PAIRS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </FieldGroup>

        <FieldGroup label="Lot Size">
          <select
            value={lotIndex}
            onChange={e => setLotIndex(Number(e.target.value))}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500/40"
          >
            {LOT_OPTIONS.map((opt, i) => (
              <option key={opt.value} value={i}>{opt.label}</option>
            ))}
          </select>
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Number of Pips">
          <input
            type="number"
            value={pips}
            onChange={e => setPips(e.target.value)}
            min="0"
            step="1"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-sky-500/40"
          />
        </FieldGroup>

        <FieldGroup label="Account Currency">
          <select
            value={accountCcy}
            onChange={e => setAccountCcy(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500/40"
          >
            {ACCOUNT_CURRENCIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </FieldGroup>
      </div>

      {/* Conversion rate (only if account ccy differs from quote ccy) */}
      {accountCcy !== result.quoteCcy && (
        <FieldGroup label={`${result.quoteCcy}/${accountCcy} Rate`}>
          <input
            type="number"
            value={conversionRate}
            onChange={e => setConversionRate(e.target.value)}
            min="0"
            step="0.0001"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-sky-500/40"
            placeholder="Enter conversion rate"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            How many {accountCcy} per 1 {result.quoteCcy}
          </p>
        </FieldGroup>
      )}

      {/* Results */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Results</h4>
        <div className="grid grid-cols-2 gap-4">
          <ResultCard
            label="1 Pip Value"
            value={`${result.onePipValue.toFixed(config.decimals > 2 ? 4 : 2)} ${result.quoteCcy}`}
            sublabel={`Lot: ${lotSize.toLocaleString()}`}
          />
          <ResultCard
            label={`${pips || '0'} Pips Value`}
            value={`${result.pipValueQuote.toFixed(2)} ${result.quoteCcy}`}
            sublabel="In quote currency"
          />
          {accountCcy !== result.quoteCcy && (
            <ResultCard
              label={`Value in ${accountCcy}`}
              value={`${result.pipValueAccount.toFixed(2)} ${accountCcy}`}
              sublabel={`@ ${conversionRate} ${result.quoteCcy}/${accountCcy}`}
              highlight
            />
          )}
          <ResultCard
            label="Pip Size"
            value={config.pipSize.toString()}
            sublabel={pair.includes('JPY') ? 'JPY pair (0.01)' : pair.includes('INR') ? 'INR pair (0.0025)' : 'Standard (0.0001)'}
          />
        </div>
      </div>

      {/* Info box */}
      <div className="flex gap-2 p-3 rounded-lg bg-sky-500/5 border border-sky-500/10">
        <Info className="h-3.5 w-3.5 text-sky-400 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-sky-300/70 leading-relaxed">
          For NSE currency futures, 1 lot = 1,000 units. Pip sizes: INR pairs = 0.0025, JPY pairs = 0.01, others = 0.0001.
        </p>
      </div>
    </div>
  );
}

/* ─── Position Size Calculator ───────────────────────────────────────────── */

function PositionSizeCalculator({ selectedPair, liveRates }: { selectedPair: string; liveRates: Map<string, number> }) {
  const [pair, setPair] = useState(selectedPair);
  const [accountBalance, setAccountBalance] = useState('100000');
  const [riskPct, setRiskPct] = useState('1');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [accountCcy, setAccountCcy] = useState<string>('INR');
  const [conversionRate, setConversionRate] = useState('1');

  // Sync pair from parent when CommandBar changes
  useEffect(() => { setPair(selectedPair); }, [selectedPair]);

  const config = PIP_CONFIG[pair] ?? DEFAULT_PIP;

  // Auto-populate conversion rate from live data
  useEffect(() => {
    const quoteCcy = pair.split('/')[1];
    if (quoteCcy === accountCcy) return;
    const rateKey = `${quoteCcy}/${accountCcy}`;
    const rate = liveRates.get(rateKey);
    if (rate) setConversionRate(rate.toFixed(4));
  }, [pair, accountCcy, liveRates]);

  const result = useMemo(() => {
    const balance = parseFloat(accountBalance) || 0;
    const risk = parseFloat(riskPct) || 0;
    const entry = parseFloat(entryPrice) || 0;
    const sl = parseFloat(stopLoss) || 0;
    const convRate = parseFloat(conversionRate) || 1;
    const quoteCcy = pair.split('/')[1];

    if (!entry || !sl || entry === sl) {
      return null;
    }

    const riskAmount = balance * (risk / 100);
    const slDistance = Math.abs(entry - sl);
    const slPips = slDistance / config.pipSize;

    // Value of 1 pip for 1 standard lot (100K)
    const pipValuePerStdLot = config.pipSize * 100_000;

    // Pip value in account currency
    let pipValueInAcctCcy = pipValuePerStdLot;
    if (quoteCcy !== accountCcy) {
      pipValueInAcctCcy = pipValuePerStdLot * convRate;
    }

    // Position size in lots
    const positionLots = slPips > 0 && pipValueInAcctCcy > 0
      ? riskAmount / (slPips * pipValueInAcctCcy)
      : 0;

    const positionUnits = positionLots * 100_000;

    // NSE lots (1 lot = 1,000 units)
    const nseLots = Math.floor(positionUnits / 1_000);

    return {
      riskAmount,
      slDistance,
      slPips: Math.round(slPips * 10) / 10,
      positionLots: Math.round(positionLots * 100) / 100,
      positionUnits: Math.round(positionUnits),
      nseLots,
      quoteCcy,
      direction: entry > sl ? 'LONG' : 'SHORT',
    };
  }, [pair, accountBalance, riskPct, entryPrice, stopLoss, accountCcy, conversionRate, config]);

  return (
    <div className="space-y-4">
      {/* Pair + Account Balance */}
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Currency Pair">
          <select
            value={pair}
            onChange={e => setPair(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-sky-500/40"
          >
            {NSE_FOREX_PAIRS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </FieldGroup>

        <FieldGroup label="Account Currency">
          <select
            value={accountCcy}
            onChange={e => setAccountCcy(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500/40"
          >
            {ACCOUNT_CURRENCIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label={`Account Balance (${accountCcy})`}>
          <input
            type="number"
            value={accountBalance}
            onChange={e => setAccountBalance(e.target.value)}
            min="0"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-sky-500/40"
          />
        </FieldGroup>

        <FieldGroup label="Risk %">
          <div className="relative">
            <input
              type="number"
              value={riskPct}
              onChange={e => setRiskPct(e.target.value)}
              min="0.1"
              max="100"
              step="0.1"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 pr-8 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-sky-500/40"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
          </div>
          {/* Quick risk buttons */}
          <div className="flex gap-1 mt-1.5">
            {['0.5', '1', '2', '3'].map(v => (
              <button
                key={v}
                onClick={() => setRiskPct(v)}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
                  riskPct === v
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.06]'
                )}
              >
                {v}%
              </button>
            ))}
          </div>
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Entry Price">
          <input
            type="number"
            value={entryPrice}
            onChange={e => setEntryPrice(e.target.value)}
            step={config.pipSize}
            placeholder={`e.g. ${pair === 'USD/INR' ? '83.5000' : pair === 'EUR/USD' ? '1.0850' : '150.00'}`}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-sky-500/40 placeholder:text-white/20"
          />
        </FieldGroup>

        <FieldGroup label="Stop Loss">
          <input
            type="number"
            value={stopLoss}
            onChange={e => setStopLoss(e.target.value)}
            step={config.pipSize}
            placeholder={`e.g. ${pair === 'USD/INR' ? '83.2500' : pair === 'EUR/USD' ? '1.0800' : '149.00'}`}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-sky-500/40 placeholder:text-white/20"
          />
        </FieldGroup>
      </div>

      {/* Conversion rate */}
      {result && accountCcy !== result.quoteCcy && (
        <FieldGroup label={`${result.quoteCcy}/${accountCcy} Rate`}>
          <input
            type="number"
            value={conversionRate}
            onChange={e => setConversionRate(e.target.value)}
            min="0"
            step="0.0001"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-sky-500/40"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            How many {accountCcy} per 1 {result.quoteCcy}
          </p>
        </FieldGroup>
      )}

      {/* Results */}
      {result && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Position Size</h4>
            <span className={cn(
              'text-[10px] font-semibold px-2 py-0.5 rounded',
              result.direction === 'LONG'
                ? 'bg-sky-500/10 text-sky-400'
                : 'bg-orange-500/10 text-orange-400'
            )}>
              {result.direction}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ResultCard
              label="Risk Amount"
              value={`${result.riskAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${accountCcy}`}
              sublabel={`${riskPct}% of balance`}
            />
            <ResultCard
              label="SL Distance"
              value={`${result.slPips} pips`}
              sublabel={`${result.slDistance.toFixed(config.decimals)} price`}
            />
            <ResultCard
              label="Standard Lots"
              value={result.positionLots.toFixed(2)}
              sublabel={`${result.positionUnits.toLocaleString()} units`}
              highlight
            />
            <ResultCard
              label="NSE Lots"
              value={result.nseLots.toString()}
              sublabel={`${(result.nseLots * 1_000).toLocaleString()} units`}
              highlight
            />
            <ResultCard
              label="Mini Lots"
              value={(result.positionLots * 10).toFixed(1)}
              sublabel="10K per lot"
            />
            <ResultCard
              label="Micro Lots"
              value={(result.positionLots * 100).toFixed(0)}
              sublabel="1K per lot"
            />
          </div>
        </div>
      )}

      {!result && entryPrice && stopLoss && (
        <div className="text-center text-xs text-muted-foreground py-4">
          Entry and stop loss must be different values.
        </div>
      )}

      {/* Risk guidelines */}
      <div className="flex gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
        <Info className="h-3.5 w-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-amber-300/70 leading-relaxed">
          Professional risk management: risk 0.5-2% per trade. Never risk more than 5% of account on a single position.
        </p>
      </div>
    </div>
  );
}

/* ─── Shared Components ──────────────────────────────────────────────────── */

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function ResultCard({
  label,
  value,
  sublabel,
  highlight,
}: {
  label: string;
  value: string;
  sublabel: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      'rounded-lg p-3 border',
      highlight
        ? 'bg-sky-500/5 border-sky-500/10'
        : 'bg-white/[0.02] border-white/[0.06]'
    )}>
      <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
      <p className={cn(
        'text-sm font-semibold font-mono tabular-nums',
        highlight ? 'text-sky-400' : 'text-foreground'
      )}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sublabel}</p>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

const ANIM = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

export function ForexCalculators({ selectedPair }: { selectedPair: string }) {
  const [activeTab, setActiveTab] = useState<CalcTab>('pip');
  const [liveRates, setLiveRates] = useState<Map<string, number>>(new Map());

  // Fetch live rates once on mount for auto-populating conversion rates
  useEffect(() => {
    getCurrencyOverview()
      .then(res => {
        if (!res.success || !res.data?.pairs) return;
        const rateMap = new Map<string, number>();
        for (const p of res.data.pairs) {
          rateMap.set(p.ticker, p.price);
          // Also store inverse for reverse lookups
          const [base, quote] = p.ticker.split('/');
          if (p.price > 0) {
            rateMap.set(`${quote}/${base}`, 1 / p.price);
          }
        }
        setLiveRates(rateMap);
      })
      .catch(() => { /* silent — calculators still work with manual input */ });
  }, []);

  const tabs: Array<{ id: CalcTab; label: string; icon: typeof Calculator }> = [
    { id: 'pip', label: 'Pip Calculator', icon: Calculator },
    { id: 'position', label: 'Position Size', icon: ArrowRightLeft },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <motion.div {...ANIM}>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors',
                  isActive
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-white/70 hover:bg-white/[0.04]'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="calcTabBg"
                    className="absolute inset-0 rounded-lg bg-white/[0.08] border border-white/[0.06]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="h-3.5 w-3.5 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Calculator content */}
      <motion.div
        key={activeTab}
        {...ANIM}
        className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.15)]"
      >
        <div className="flex items-center gap-2 mb-5">
          {activeTab === 'pip' ? (
            <Calculator className="h-4 w-4 text-emerald-400" />
          ) : (
            <ArrowRightLeft className="h-4 w-4 text-violet-400" />
          )}
          <h3 className="text-sm font-medium">
            {activeTab === 'pip' ? 'Pip Value Calculator' : 'Position Size Calculator'}
          </h3>
        </div>

        {activeTab === 'pip' ? (
          <PipCalculator selectedPair={selectedPair} liveRates={liveRates} />
        ) : (
          <PositionSizeCalculator selectedPair={selectedPair} liveRates={liveRates} />
        )}
      </motion.div>
    </div>
  );
}
