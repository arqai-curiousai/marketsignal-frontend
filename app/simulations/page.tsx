import type { Metadata } from 'next';
import { SimulationsHero } from '@/components/landing/simulations/SimulationsHero';
import { TrustBar } from '@/components/landing/TrustBar';
import { SimulationGrid } from '@/components/landing/simulations/SimulationGrid';
import { VolatilityShowcase } from '@/components/landing/simulations/VolatilityShowcase';
import { PortfolioShowcase } from '@/components/landing/simulations/PortfolioShowcase';
import { RiskShowcase } from '@/components/landing/simulations/RiskShowcase';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { ScrollNarrative } from '@/components/landing/shared/ScrollNarrative';
import { SIM_STATS, SIM_CTA } from '@/components/landing/constants/simulations';

export const metadata: Metadata = {
  title: 'Stock Market Simulator — Test Strategies, Stress-Test Portfolios, Manage Risk | arQai',
  description:
    'Free stock market simulator with Monte Carlo projections, portfolio optimizer, strategy backtesting, volatility checker, and risk calculator. Tools hedge funds use — now open to every investor.',
};

export default function SimulationsLandingPage() {
  return (
    <ScrollNarrative accent="violet">
      {/* Act I — The Promise */}
      <SimulationsHero />
      <TrustBar stats={SIM_STATS} />

      {/* Act II — The Proof */}
      <SimulationGrid />
      <VolatilityShowcase />
      <PortfolioShowcase />
      <RiskShowcase />

      {/* Act III — The Close */}
      <FinalCTA content={SIM_CTA} accentColor="violet" />
    </ScrollNarrative>
  );
}
