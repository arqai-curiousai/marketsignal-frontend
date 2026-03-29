import type { Metadata } from 'next';
import { PulseHero } from '@/components/landing/pulse/PulseHero';
import { TrustBar } from '@/components/landing/TrustBar';
import { PulseModules } from '@/components/landing/pulse/PulseModules';
import { SectorShowcase } from '@/components/landing/pulse/SectorShowcase';
import { CorrelationShowcase } from '@/components/landing/pulse/CorrelationShowcase';
import { NewsShowcase } from '@/components/landing/pulse/NewsShowcase';
import { DualAgentEngine } from '@/components/landing/DualAgentEngine';
import { TrustWall } from '@/components/landing/TrustWall';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { PULSE_STATS, PULSE_CTA } from '@/components/landing/constants/pulse';

export const metadata: Metadata = {
  title: 'Market Pulse — Sector Intelligence, Correlations & News by arQai',
  description:
    'Sector heatmaps, DCC-GARCH correlations, and AI-curated news across 260+ stocks and 6 global exchanges.',
};

export default function PulseLandingPage() {
  return (
    <div className="flex flex-col">
      {/* Act I — The Promise */}
      <PulseHero />
      <TrustBar stats={PULSE_STATS} />

      {/* Act II — The Proof */}
      <PulseModules />
      <SectorShowcase />
      <CorrelationShowcase />
      <NewsShowcase />
      <DualAgentEngine />

      {/* Act III — The Close */}
      <TrustWall />
      <FinalCTA content={PULSE_CTA} accentColor="emerald" />
    </div>
  );
}
