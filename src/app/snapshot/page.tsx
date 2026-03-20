"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { estimateRevenueIncrease } from "@/lib/trs-tasks";

type QuizAnswers = {
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
  const quizData = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = window.localStorage.getItem("grantready_quiz");
    if (!raw) {
      return null;
    }

    return parseQuizData(raw);
  }, []);

  useEffect(() => {
    if (!quizData) {
      router.replace("/quiz");
    }
  }, [quizData, router]);

  const revenue = useMemo(() => {
    if (!quizData) {
      return null;
    }

    return estimateRevenueIncrease(quizData.ccsCount, 0);
  }, [quizData]);

  if (!quizData || !revenue) {
    return (
      <div className="min-h-screen bg-warm-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-warm-200 bg-white p-6 text-sm text-warm-500">Loading funding snapshot...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Funding Snapshot</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-900 sm:text-4xl">
            You could be earning an additional {currency.format(revenue.annualIncrease)} per year
          </h1>
          <p className="mt-3 text-base text-emerald-800">
            That is {currency.format(revenue.monthlyIncrease)} more per month from higher CCS reimbursement rates.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-warm-900">Eligible Now - Action Needed</h2>
          <article className="rounded-2xl border border-warm-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-brand-700">Texas Rising Star Certification</p>
              <p className="text-sm text-warm-700">
                Quality rating that increases your CCS reimbursement rates by up to 9%
              </p>
              <p className="text-sm text-warm-900">
                <span className="font-semibold">Estimated value:</span> {currency.format(revenue.annualIncrease)}
              </p>
              <p className="text-sm text-warm-900">
                <span className="font-semibold">What&apos;s required:</span> 22 tasks to complete, estimated 8 weeks
              </p>
              <p className="text-xs text-warm-500">
                You reported: Curriculum {quizData.hasCurriculum}, teacher credentials {quizData.teacherCredentials}, TRS experience {quizData.trsExperience}.
              </p>
              <Link
                href="/login"
                className="inline-flex rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 hover:from-brand-600 hover:to-brand-700"
              >
                See your roadmap &rarr;
              </Link>
            </div>
          </article>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-warm-900">Could Qualify With Changes</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-2xl border border-warm-200 bg-warm-100 p-4 text-warm-700">
              <p className="font-semibold text-warm-800">Pre-K Partnership</p>
              <p className="mt-1 text-sm">Public school partnership slots for full-day pre-K services.</p>
            </article>
            <article className="rounded-2xl border border-warm-200 bg-warm-100 p-4 text-warm-700">
              <p className="font-semibold text-warm-800">Head Start</p>
              <p className="mt-1 text-sm">Federal early learning funding for centers meeting program standards.</p>
            </article>
            <article className="rounded-2xl border border-warm-200 bg-warm-100 p-4 text-warm-700">
              <p className="font-semibold text-warm-800">Early Head Start</p>
              <p className="mt-1 text-sm">Infant and toddler services funding through local Head Start grantees.</p>
            </article>
          </div>
        </section>

        {quizData.ccsCount > 0 && (
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
            href="/login"
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
