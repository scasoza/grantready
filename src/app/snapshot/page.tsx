"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { estimateRevenueIncrease } from "@/lib/trs-tasks";

type QuizAnswers = {
  centerType: string;
  ccsCount: number;
  currentEnrollment: number;
  hasCurriculum: "Yes" | "Sort of" | "No";
  teacherCredentials: "Yes" | "Not sure" | "No";
  trsExperience: "Yes, applied" | "Yes, looked" | "No";
};

function parseQuizData(raw: string): QuizAnswers | null {
  try {
    const parsed = JSON.parse(raw) as Partial<QuizAnswers>;

    const ccsCount = Number(parsed.ccsCount);
    const currentEnrollment = Number(parsed.currentEnrollment);
    const centerType = typeof parsed.centerType === "string" ? parsed.centerType : "";

    const hasCurriculum = parsed.hasCurriculum;
    const teacherCredentials = parsed.teacherCredentials;
    const trsExperience = parsed.trsExperience;

    const hasValidCurriculum = hasCurriculum === "Yes" || hasCurriculum === "Sort of" || hasCurriculum === "No";
    const hasValidCredentials =
      teacherCredentials === "Yes" || teacherCredentials === "Not sure" || teacherCredentials === "No";
    const hasValidTrs = trsExperience === "Yes, applied" || trsExperience === "Yes, looked" || trsExperience === "No";

    if (
      !Number.isFinite(ccsCount) ||
      ccsCount < 0 ||
      !Number.isFinite(currentEnrollment) ||
      currentEnrollment < 0 ||
      !hasValidCurriculum ||
      !hasValidCredentials ||
      !hasValidTrs
    ) {
      return null;
    }

    return {
      centerType,
      ccsCount,
      currentEnrollment,
      hasCurriculum,
      teacherCredentials,
      trsExperience,
    };
  } catch {
    return null;
  }
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function FundingSnapshotPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [quizData, setQuizData] = useState<QuizAnswers | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem("grantready_quiz");
    setQuizData(raw ? parseQuizData(raw) : null);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !quizData) {
      router.replace("/quiz");
    }
  }, [mounted, quizData, router]);

  const revenue = useMemo(() => {
    if (!quizData) {
      return null;
    }

    return estimateRevenueIncrease(quizData.ccsCount, 0);
  }, [quizData]);
  const isThinkingAboutOpening = quizData?.centerType === "Thinking about opening";

  if (!mounted || !quizData || !revenue) {
    return (
      <div className="min-h-screen bg-warm-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-warm-200 bg-white p-6 text-sm text-warm-500">Loading funding snapshot...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex items-start justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-md shadow-brand-600/25">
              <span className="text-white font-extrabold text-sm">G</span>
            </div>
            <span className="text-lg font-bold text-warm-900 tracking-tight">GrantReady</span>
          </Link>
        </header>

        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Funding Snapshot</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-900 sm:text-4xl">
            {isThinkingAboutOpening
              ? "Here is what you could earn once you open"
              : quizData.ccsCount > 0
                ? `You could be earning an additional ${currency.format(revenue.annualIncrease)} per year`
                : "TRS certification unlocks higher reimbursement rates"}
          </h1>
          {isThinkingAboutOpening ? (
            <p className="mt-3 text-base text-emerald-800">
              $0 estimated right now. Complete TRS certification after opening to unlock higher reimbursement rates.
            </p>
          ) : quizData.ccsCount > 0 ? (
            <p className="mt-3 text-base text-emerald-800">
              That is {currency.format(revenue.monthlyIncrease)} more per month from higher CCS reimbursement rates.
            </p>
          ) : (
            <p className="mt-3 text-base text-emerald-800">
              You don&apos;t currently accept CCS children, but TRS certification positions you for higher reimbursements if you do — and signals quality to all parents.
            </p>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-warm-900">Eligible Now - Action Needed</h2>
          <article className="rounded-2xl border border-warm-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-brand-700">Texas Rising Star (TRS) Certification</p>
              <p className="text-sm text-warm-700">
                Quality rating that increases your CCS reimbursement rates by up to 9%
              </p>
              <p className="text-sm text-warm-900">
                <span className="font-semibold">Estimated value:</span>{" "}
                {quizData.ccsCount > 0 ? currency.format(revenue.annualIncrease) : "Depends on future CCS enrollment"}
              </p>
              <p className="text-sm text-warm-900">
                <span className="font-semibold">How it works:</span> 22 simple steps — GrantReady walks you through each one. Most directors finish in 4-8 weeks, about 20 min/week.
              </p>
              {!isThinkingAboutOpening && (
                <p className="text-xs text-warm-500">
                  You reported: Curriculum {quizData.hasCurriculum}, teacher credentials {quizData.teacherCredentials}, TRS experience {quizData.trsExperience}.
                </p>
              )}
              <Link
                href="/dashboard"
                className="mt-1 flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-600/20 hover:from-brand-600 hover:to-brand-700 sm:w-auto sm:inline-flex"
              >
                See your roadmap &rarr;
              </Link>
            </div>
          </article>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-warm-900">Could Qualify With Changes</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Pre-K Partnership", desc: "Public school partnership slots for full-day pre-K services." },
              { name: "Head Start", desc: "Federal early learning funding for centers meeting program standards." },
              { name: "Early Head Start", desc: "Infant and toddler services funding through local Head Start grantees." },
            ].map((g) => (
              <article key={g.name} className="rounded-2xl border border-warm-200 bg-warm-50 p-4 text-warm-600 opacity-75">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-warm-700">{g.name}</p>
                  <span className="rounded-full bg-warm-200 px-2 py-0.5 text-[10px] font-semibold text-warm-500 whitespace-nowrap">Coming soon</span>
                </div>
                <p className="mt-1 text-sm">{g.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {quizData.ccsCount > 0 && !isThinkingAboutOpening && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-warm-900">Already Using</h2>
            <article className="rounded-2xl border border-warm-200 bg-white p-5 text-warm-800">
              Child Care Services (CCS) - You&apos;re already enrolled. Nice.
            </article>
          </section>
        )}

        <section className="rounded-2xl border border-warm-200 bg-white p-6 text-center sm:p-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-warm-900">Create a free account to start your roadmap</h2>
          <Link
            href="/login?mode=signup"
            className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-b from-brand-500 to-brand-600 px-6 py-4 text-base font-semibold text-white shadow-md shadow-brand-600/20 hover:from-brand-600 hover:to-brand-700 sm:w-auto"
          >
            Create Free Account
          </Link>
          <p className="mt-3 text-sm text-warm-500">Free. No credit card. Takes 30 seconds.</p>
        </section>
      </div>
    </div>
  );
}
