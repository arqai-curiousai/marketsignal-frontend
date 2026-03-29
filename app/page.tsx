import type { Metadata } from 'next';
import { ForexHero } from '@/components/landing/forex/ForexHero';
import { TrustBar } from '@/components/landing/TrustBar';
import { ForexModules } from '@/components/landing/forex/ForexModules';
import { ForexHeatmapShowcase } from '@/components/landing/forex/ForexHeatmapShowcase';
import { ForexStrengthShowcase } from '@/components/landing/forex/ForexStrengthShowcase';
import { ForexTechnicalsShowcase } from '@/components/landing/forex/ForexTechnicalsShowcase';
import { DualAgentEngine } from '@/components/landing/DualAgentEngine';
import { ForexCoverageMap } from '@/components/landing/forex/ForexCoverageMap';
import { TrustWall } from '@/components/landing/TrustWall';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { FOREX_STATS, FOREX_CTA } from '@/components/landing/constants/forex';

export const metadata: Metadata = {
  title: 'Market Signal — AI-Powered Forex Intelligence by arQai',
  description:
    '28 forex pairs with real-time technicals, volatility analysis, carry trade metrics, and AI news impact scoring. Institutional-grade insight.',
};

export default function ForexLandingPage() {
  return (
    <div className="flex flex-col">
      {/* Act I — The Promise */}
      <ForexHero />
      <TrustBar stats={FOREX_STATS} />

      {/* Act II — The Proof */}
      <ForexModules />
      <ForexHeatmapShowcase />
      <ForexStrengthShowcase />
      <ForexTechnicalsShowcase />
      <DualAgentEngine />
      <ForexCoverageMap />

      {/* Act III — The Close */}
      <TrustWall />
      <FinalCTA content={FOREX_CTA} accentColor="blue" />
    </div>
  );
}
