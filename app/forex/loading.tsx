export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
        <span className="text-xs text-white/30 tracking-wide">Loading...</span>
      </div>
    </div>
  );
}
