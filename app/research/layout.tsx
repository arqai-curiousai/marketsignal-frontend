import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Research Library | Meridian',
  description: 'Access AI-curated research documents, market reports, and investment insights.',
};

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
