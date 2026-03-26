'use client';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#0a0a0b', color: '#fafafa', margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', textAlign: 'center', padding: '0 1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Something went wrong</h2>
          <p style={{ color: '#a1a1aa', maxWidth: '28rem' }}>
            A critical error occurred. Please refresh the page or try again later.
          </p>
          {error.digest && (
            <p style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Error ID: {error.digest}</p>
          )}
          <button
            onClick={reset}
            style={{ borderRadius: '0.375rem', backgroundColor: '#3b82f6', padding: '0.5rem 1rem', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
