import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Research Library | MarketSignal',
  description: 'Access AI-curated research documents, market reports, and investment insights.',
};

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
