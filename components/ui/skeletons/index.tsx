/**
 * Domain-specific skeleton loading states.
 * These provide better perceived performance than generic spinners.
 */

import { Skeleton } from "@/components/ui/skeleton";

/** Stock card skeleton — matches StockCard layout */
export function StockCardSkeleton() {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-32" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-5 w-14" />
      </div>
    </div>
  );
}

/** Signal card skeleton — matches SignalCard layout */
export function SignalCardSkeleton() {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

/** Table row skeleton — generic for data tables */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/** Table skeleton — multiple rows */
export function TableSkeleton({
  rows = 5,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-4 border-b border-white/10 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="space-y-0">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 border-b border-white/5 px-4 py-3"
          >
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Watchlist item skeleton */
export function WatchlistSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-5 w-14" />
      <Skeleton className="h-5 w-10" />
    </div>
  );
}

/** Dashboard metric card skeleton */
export function MetricCardSkeleton() {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

/** Chart area skeleton */
export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div
      className={`w-full ${height} rounded-lg border border-white/5 bg-white/[0.02] flex items-center justify-center`}
    >
      <div className="space-y-2 text-center">
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-3 w-24 mx-auto" />
      </div>
    </div>
  );
}

/** List skeleton — for signal/watchlist lists */
export function ListSkeleton({
  count = 5,
  ItemSkeleton = WatchlistSkeleton,
}: {
  count?: number;
  ItemSkeleton?: React.ComponentType;
}) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <ItemSkeleton key={i} />
      ))}
    </div>
  );
}
