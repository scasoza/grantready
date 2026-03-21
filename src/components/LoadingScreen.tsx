"use client";

function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-warm-200/70 ${className ?? ""}`} />;
}

export default function LoadingScreen({ label }: { label?: string }) {
  return (
    <div className="min-h-screen bg-warm-50">
      {/* Skeleton nav */}
      <div className="border-b border-warm-200/40 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Bone className="h-8 w-8 rounded-lg" />
            <Bone className="h-4 w-20" />
          </div>
          <Bone className="h-8 w-16 rounded-lg" />
        </div>
      </div>

      {/* Skeleton content */}
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-5">
        {/* Progress card skeleton */}
        <div className="rounded-2xl border border-warm-200 bg-white p-5">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Bone className="h-5 w-36" />
              <Bone className="h-3 w-24" />
            </div>
            <Bone className="h-8 w-12" />
          </div>
          <Bone className="mt-4 h-3 w-full rounded-full" />
        </div>

        {/* Section header skeleton */}
        <div className="flex items-center gap-2">
          <Bone className="h-5 w-5 rounded-full" />
          <Bone className="h-4 w-28" />
        </div>

        {/* Card skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-warm-200 bg-white px-4 py-3">
            <Bone className="h-9 w-9 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-3/4" />
              <Bone className="h-3 w-1/2" />
            </div>
            <Bone className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>

      {label && (
        <p className="text-center text-xs text-warm-400 mt-2">{label}</p>
      )}
    </div>
  );
}
