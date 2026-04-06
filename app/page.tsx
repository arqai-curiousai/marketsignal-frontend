import type { Metadata } from 'next';
import { ForexHero } from '@/components/landing/forex/ForexHero';
import { TrustBar } from '@/components/landing/TrustBar';
import { ForexModules } from '@/components/landing/forex/ForexModules';
import { ForexHeatmapShowcase } from '@/components/landing/forex/ForexHeatmapShowcase';
import { ForexStrengthShowcase } from '@/components/landing/forex/ForexStrengthShowcase';
import { ForexTechnicalsShowcase } from '@/components/landing/forex/ForexTechnicalsShowcase';
import { DualAgentEngine } from '@/components/landing/DualAgentEngine';
import { SessionOrbitSection } from '@/components/landing/forex/SessionOrbitSection';
import { TrustWall } from '@/components/landing/TrustWall';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { ScrollNarrative } from '@/components/landing/shared/ScrollNarrative';
import { FOREX_STATS, FOREX_CTA } from '@/components/landing/constants/forex';

export const metadata: Metadata = {
  title: 'Meridian by arQai — AI-Powered Forex Analytics',
  description:
    '42 forex pairs across 17 currencies with real-time technicals, volatility analysis, carry trade metrics, and AI news impact scoring. Institutional-grade insight.',
};

export default function ForexLandingPage() {
  return (
    <ScrollNarrative accent="blue">
      {/* Act I — The Promise */}
      <ForexHero />
      <TrustBar stats={FOREX_STATS} />

      {/* Act II — The Proof */}
      <ForexModules />
      <ForexHeatmapShowcase />
      <ForexStrengthShowcase />
      <ForexTechnicalsShowcase />
      <DualAgentEngine />
      <SessionOrbitSection />

      {/* Act III — The Close */}
      <TrustWall />
      <FinalCTA content={FOREX_CTA} accentColor="blue" />
    </ScrollNarrative>
  );
}
