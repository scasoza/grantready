"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";

interface Check {
  category: "documents" | "staff" | "consistency";
  label: string;
  passed: boolean;
  detail: string;
  fixHref?: string;
}

interface ReadinessResult {
  checks: Check[];
  summary: { total: number; passed: number; failed: number };
}

const categoryConfig: Record<
  string,
  { title: string; icon: string }
> = {
  documents: { title: "Documents", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  staff: { title: "Staff", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  consistency: { title: "Consistency", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
};

export default function ReadinessPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ReadinessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [centerId, setCenterId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: centerRows } = await supabase
        .from("centers")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (!centerRows || centerRows.length === 0) {
        router.replace("/onboarding");
        return;
      }

      const cid = (centerRows[0] as { id: string }).id;
      setCenterId(cid);

      try {
        const res = await fetch("/api/readiness-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ centerId: cid }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Failed to run readiness check");
          setLoading(false);
          return;
        }

        const data = (await res.json()) as ReadinessResult;
        setResult(data);
      } catch {
        setError("Failed to connect to readiness check");
      }

      setLoading(false);
    };

    void load();
  }, [router, supabase]);

  const handleSubmit = async () => {
    if (!centerId || submitting) return;
    setSubmitting(true);

    try {
      const { error: insertError } = await supabase
        .from("submissions")
        .insert({
          center_id: centerId,
          status: "pending",
        });

      if (insertError) {
        setError(insertError.message);
        setSubmitting(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Failed to submit application");
      setSubmitting(false);
    }
  };

  const allPassed = result ? result.summary.failed === 0 : false;

  const grouped = useMemo(() => {
    if (!result) return {};
    const groups: Record<string, Check[]> = {};
    for (const check of result.checks) {
      if (!groups[check.category]) groups[check.category] = [];
      groups[check.category].push(check);
    }
    return groups;
  }, [result]);

  if (loading) {
    return <LoadingScreen label="Running readiness checks..." />;
  }

  if (error && !result) {
    return (
      <div className="min-h-screen bg-warm-50 text-warm-900">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
          <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 text-warm-900">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-warm-200/40 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="text-warm-400 hover:text-warm-600 transition p-2 -m-2" aria-label="Back to dashboard">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-sm font-bold text-warm-900">Readiness Report</h1>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        {/* Summary */}
        {result && (
          <section className="rounded-2xl border border-warm-200 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3">
              {allPassed ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-warm-900">
                  {result.summary.passed} of {result.summary.total} checks passed
                </h1>
                {result.summary.failed > 0 && (
                  <p className="mt-0.5 text-sm text-warm-500">
                    {result.summary.failed} item{result.summary.failed !== 1 ? "s" : ""} need{result.summary.failed === 1 ? "s" : ""} attention
                  </p>
                )}
                {allPassed && (
                  <p className="mt-0.5 text-sm text-emerald-600 font-medium">
                    Your application is ready to submit!
                  </p>
                )}
              </div>
            </div>

            {/* Visual progress bar */}
            <div className="mt-4 h-2 w-full rounded-full bg-warm-100">
              <div
                className={`h-2 rounded-full transition-all ${allPassed ? "bg-emerald-500" : "bg-amber-500"}`}
                style={{ width: `${Math.round((result.summary.passed / result.summary.total) * 100)}%` }}
              />
            </div>

            {allPassed && (
              <div className="mt-5">
                <button
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                  className="w-full rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow hover:from-brand-600 hover:to-brand-700 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit my application"}
                </button>
                <p className="mt-2 text-xs text-warm-500 text-center">
                  We&apos;ll submit your TRS certification request to your local Workforce Board on your behalf. You&apos;ll see the status update on your dashboard.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}
          </section>
        )}

        {/* Checks by category */}
        {(["documents", "staff", "consistency"] as const).map((cat) => {
          const checks = grouped[cat];
          if (!checks || checks.length === 0) return null;
          const config = categoryConfig[cat];
          const catPassed = checks.filter((c) => c.passed).length;

          return (
            <section key={cat} className="rounded-2xl border border-warm-200 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <svg className="h-5 w-5 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                </svg>
                <h2 className="text-lg font-semibold text-warm-900">{config.title}</h2>
                <span className="ml-auto text-sm text-warm-500">
                  {catPassed}/{checks.length} passed
                </span>
              </div>

              <div className="space-y-2">
                {checks.map((check, i) => (
                  <div
                    key={`${cat}-${i}`}
                    className={`flex items-start gap-3 rounded-xl p-3 ${
                      check.passed
                        ? "bg-emerald-50/60"
                        : "bg-red-50/60"
                    }`}
                  >
                    {check.passed ? (
                      <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${check.passed ? "text-emerald-800" : "text-red-800"}`}>
                        {check.label}
                      </p>
                      <p className={`mt-0.5 text-xs ${check.passed ? "text-emerald-600" : "text-red-600"}`}>
                        {check.detail}
                      </p>
                    </div>
                    {!check.passed && check.fixHref && (
                      <Link
                        href={check.fixHref}
                        className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        Fix
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
