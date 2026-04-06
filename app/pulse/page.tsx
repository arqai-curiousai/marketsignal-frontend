import type { Metadata } from 'next';
import { PulseHero } from '@/components/landing/pulse/PulseHero';
import { TrustBar } from '@/components/landing/TrustBar';
import { PulseModules } from '@/components/landing/pulse/PulseModules';
import { SectorShowcase } from '@/components/landing/pulse/SectorShowcase';
import { CorrelationShowcase } from '@/components/landing/pulse/CorrelationShowcase';
import { NewsShowcase } from '@/components/landing/pulse/NewsShowcase';
import { SentimentRiverSection } from '@/components/landing/pulse/SentimentRiverSection';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { ScrollNarrative } from '@/components/landing/shared/ScrollNarrative';
import { PULSE_STATS, PULSE_CTA } from '@/components/landing/constants/pulse';

export const metadata: Metadata = {
  title: 'Meridian Pulse — News Intelligence, Sectors & Correlations by arQai',
  description:
    'AI-curated news intelligence, sector heatmaps, and DCC-GARCH correlations across 260+ stocks and 5 global exchanges.',
};

export default function PulseLandingPage() {
  return (
    <ScrollNarrative accent="emerald">
      {/* Act I — The Promise */}
      <PulseHero />
      <TrustBar stats={PULSE_STATS} />

      {/* Act II — The Proof */}
      <PulseModules />
      <NewsShowcase />
      <SentimentRiverSection />
      <SectorShowcase />
      <CorrelationShowcase />

      {/* Act III — The Close */}
      <FinalCTA content={PULSE_CTA} accentColor="emerald" />
    </ScrollNarrative>
  );
}
