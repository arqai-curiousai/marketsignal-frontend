import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stocks | MarketSignal',
  description: 'Browse and analyze stocks across global exchanges with AI-powered signals and real-time quotes.',
};

export default function StocksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
