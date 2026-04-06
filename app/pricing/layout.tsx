import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | Meridian',
  description: 'Explore pricing plans for Meridian by arQai, an AI-powered investment research platform.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
