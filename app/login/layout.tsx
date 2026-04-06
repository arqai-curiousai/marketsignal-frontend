import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Login | Meridian',
  description: 'Sign in to your Meridian account for AI-powered investment research.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
