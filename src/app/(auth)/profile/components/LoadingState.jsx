"use client";

export default function LoadingState() {
  return (
    <div className="animate-pulse space-y-8 w-full">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/10" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-white/10 rounded-md" />
            <div className="h-4 w-32 bg-white/5 rounded-md" />
          </div>
        </div>
        <div className="h-10 w-32 bg-white/10 rounded-lg" />
      </div>

      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[160px] rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 h-[400px] rounded-2xl bg-white/5 border border-white/5" />
        <div className="h-[400px] rounded-2xl bg-white/5 border border-white/5" />
      </div>

      {/* Heatmap Skeleton */}
      <div className="h-[240px] rounded-2xl bg-white/5 border border-white/5" />
    </div>
  );
}
