import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal & Compliance | Meridian',
  description: 'Terms of service, privacy policy, and regulatory disclaimers for Meridian by arQai.',
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
