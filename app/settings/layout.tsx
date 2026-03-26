import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings | MarketSignal',
  description: 'Manage your account settings, preferences, and notification configuration.',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
