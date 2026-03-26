'use client';

interface RouteErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  routeName?: string;
}

export function RouteErrorFallback({ error, reset, routeName }: RouteErrorFallbackProps) {
  const heading = routeName
    ? `${routeName} encountered an error`
    : 'Something went wrong';

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
      <h2 className="text-2xl font-semibold text-white">{heading}</h2>
      <p className="text-muted-foreground max-w-md text-sm">
        Something went wrong loading this page. Please try again.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground/60">Error ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
