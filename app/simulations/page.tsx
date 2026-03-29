import type { Metadata } from 'next';
import { SimulationsHero } from '@/components/landing/simulations/SimulationsHero';
import { TrustBar } from '@/components/landing/TrustBar';
import { SimulationGrid } from '@/components/landing/simulations/SimulationGrid';
import { VolatilityShowcase } from '@/components/landing/simulations/VolatilityShowcase';
import { PortfolioShowcase } from '@/components/landing/simulations/PortfolioShowcase';
import { RiskShowcase } from '@/components/landing/simulations/RiskShowcase';
import { DualAgentEngine } from '@/components/landing/DualAgentEngine';
import { TrustWall } from '@/components/landing/TrustWall';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { SIM_STATS, SIM_CTA } from '@/components/landing/constants/simulations';

export const metadata: Metadata = {
  title: 'Simulation Lab — Monte Carlo, GARCH, Portfolio Optimization by arQai',
  description:
    '9 quantitative simulations: GARCH volatility, HMM regimes, Monte Carlo, portfolio optimization, backtesting, and risk scoring.',
};

export default function SimulationsLandingPage() {
  return (
    <div className="flex flex-col">
      {/* Act I — The Promise */}
      <SimulationsHero />
      <TrustBar stats={SIM_STATS} />

      {/* Act II — The Proof */}
      <SimulationGrid />
      <VolatilityShowcase />
      <PortfolioShowcase />
      <RiskShowcase />
      <DualAgentEngine />

      {/* Act III — The Close */}
      <TrustWall />
      <FinalCTA content={SIM_CTA} accentColor="violet" />
    </div>
  );
}
