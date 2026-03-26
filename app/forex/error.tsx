'use client';

import { RouteErrorFallback } from '@/components/shared/RouteErrorFallback';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return <RouteErrorFallback error={error} reset={reset} />;
}
