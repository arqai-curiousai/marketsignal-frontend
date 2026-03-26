import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | MarketSignal',
  description: 'Explore pricing plans for MarketSignal AI-powered investment research platform.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
