import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Research Assistant | MarketSignal',
  description: 'Ask questions and get AI-powered research insights with sourced references.',
};

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
  return children;
}
