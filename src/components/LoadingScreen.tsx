"use client";

export default function LoadingScreen({ label }: { label?: string }) {
  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-warm-200 border-t-brand-500" />
        {label && (
          <p className="mt-3 text-sm text-warm-400">{label}</p>
        )}
      </div>
    </div>
  );
}
