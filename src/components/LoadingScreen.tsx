"use client";

function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-warm-200/70 ${className ?? ""}`} />;
}

export default function LoadingScreen({ label }: { label?: string }) {
  return (
    <div className="min-h-screen bg-warm-50">
      {/* Skeleton nav */}
      <div className="border-b border-warm-200/40 bg-white px-4 py-2.5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bone className="h-8 w-8 rounded-lg" />
            <Bone className="h-4 w-20" />
          </div>
          <Bone className="h-7 w-7 rounded-lg" />
        </div>
      </div>

      {/* Skeleton content */}
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-5">
        {/* Step indicator skeleton */}
        <div className="flex items-center gap-2 px-1">
          <Bone className="h-7 w-7 rounded-full" />
          <Bone className="h-1 flex-1 rounded-full" />
          <Bone className="h-7 w-7 rounded-full" />
          <Bone className="h-1 flex-1 rounded-full" />
          <Bone className="h-7 w-7 rounded-full" />
        </div>

        {/* Hero card skeleton */}
        <div className="rounded-2xl bg-warm-200/50 p-5 space-y-3">
          <Bone className="h-3 w-20" />
          <Bone className="h-5 w-3/4" />
          <Bone className="h-3 w-full" />
          <Bone className="mt-2 h-10 w-28 rounded-xl" />
        </div>

        {/* Progress skeleton */}
        <div className="rounded-2xl border border-warm-200 bg-white p-4">
          <div className="flex items-center gap-4">
            <Bone className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-32" />
              <Bone className="h-3 w-24" />
            </div>
          </div>
        </div>

        {/* Section header skeleton */}
        <div className="flex items-center gap-2 px-1">
          <Bone className="h-4 w-4 rounded" />
          <Bone className="h-4 w-24" />
          <div className="flex-1" />
          <Bone className="h-5 w-12 rounded-full" />
        </div>

        {/* Card skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-warm-200 bg-white px-4 py-3.5">
            <Bone className="h-8 w-8 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-3/4" />
              <Bone className="h-3 w-1/2" />
            </div>
            <Bone className="h-4 w-4 rounded" />
          </div>
        ))}
      </div>

      {label && (
        <p className="text-center text-xs text-warm-400 mt-2">{label}</p>
      )}
    </div>
  );
}
