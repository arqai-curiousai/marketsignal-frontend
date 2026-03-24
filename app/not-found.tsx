import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center px-4">
      <div className="relative">
        <span className="text-[120px] font-bold leading-none gradient-text opacity-20">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold gradient-text">Page Not Found</span>
        </div>
      </div>
      <p className="text-muted-foreground max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/signals"
          className="rounded-md bg-gradient-to-r from-brand-blue to-brand-violet px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          Go to Pulse
        </Link>
        <Link
          href="/"
          className="rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-white hover:border-white/20 transition-colors"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
