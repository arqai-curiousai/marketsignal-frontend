'use client';

/**
 * Atmospheric gradient background for dashboard pages.
 * Much lighter than landing page blobs (2-3% opacity vs 4%).
 * CSS-only animation using the `drift` keyframe — no Framer re-renders.
 */

const ACCENT_CONFIG = {
  sky: {
    primary: 'bg-sky-400/[0.025]',
    secondary: 'bg-blue-500/[0.015]',
  },
  emerald: {
    primary: 'bg-emerald-400/[0.025]',
    secondary: 'bg-blue-400/[0.015]',
  },
  violet: {
    primary: 'bg-violet-400/[0.025]',
    secondary: 'bg-indigo-500/[0.015]',
  },
} as const;

interface DashboardAmbientProps {
  accent: keyof typeof ACCENT_CONFIG;
}

export function DashboardAmbient({ accent }: DashboardAmbientProps) {
  const colors = ACCENT_CONFIG[accent];

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      {/* Primary orb — top right, slow drift */}
      <div
        className={`absolute -top-[20%] -right-[10%] w-[60%] h-[60%] ${colors.primary} rounded-full blur-[200px] animate-drift will-change-transform`}
        style={{ animationDuration: '25s' }}
      />
      {/* Secondary orb — bottom left, offset drift */}
      <div
        className={`absolute -bottom-[15%] -left-[10%] w-[45%] h-[45%] ${colors.secondary} rounded-full blur-[180px] animate-drift will-change-transform`}
        style={{ animationDuration: '30s', animationDelay: '-12s' }}
      />
    </div>
  );
}
