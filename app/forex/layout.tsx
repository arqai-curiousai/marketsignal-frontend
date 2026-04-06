import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Currency Intelligence | Meridian',
  description: 'Forex analytics, currency heatmaps, session tracking, carry trade analysis, and central bank monitoring.',
};

export default function ForexLayout({ children }: { children: React.ReactNode }) {
  return children;
}
