'use client';

import { RouteErrorFallback } from '@/components/shared/RouteErrorFallback';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback error={error} reset={reset} routeName="Signal Detail" />;
}
