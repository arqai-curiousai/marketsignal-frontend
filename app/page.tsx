import { HeroSection } from '@/components/landing/HeroSection';
import { ProofBar } from '@/components/landing/ProofBar';
import { ProductShowcase } from '@/components/landing/ProductShowcase';
import { DashboardShowcases } from '@/components/landing/DashboardShowcases';
import { MarketCoverage } from '@/components/landing/MarketCoverage';
import { AlgoPlayground } from '@/components/landing/AlgoPlayground';
import { FinalCTA } from '@/components/landing/FinalCTA';

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <ProofBar />
      <ProductShowcase />
      <DashboardShowcases />
      <MarketCoverage />
      <AlgoPlayground />
      <FinalCTA />
    </div>
  );
}
