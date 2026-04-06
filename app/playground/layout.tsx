import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Simulation Lab | Meridian',
  description: 'AI signal pipeline, volatility intelligence, Monte Carlo simulations, and portfolio optimization.',
};

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
