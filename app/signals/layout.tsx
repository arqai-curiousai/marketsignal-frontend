import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Markets & Pulse | Meridian',
  description: 'Real-time market signals, sector analysis, correlations, news intelligence, and F&O analytics powered by AI.',
};

export default function SignalsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
