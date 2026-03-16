"use client";

import { useState } from "react";
import Link from "next/link";

export function FundingEstimator() {
  const [children, setChildren] = useState(40);
  const [mealsPerDay, setMealsPerDay] = useState(2);
  const [hasRisingStar, setHasRisingStar] = useState(false);
  const [acceptsSubsidy, setAcceptsSubsidy] = useState(false);

  // CACFP: ~$2.50 avg reimbursement per meal, 260 operating days/yr
  const cacfpAnnual = children * mealsPerDay * 2.5 * 260;

  // Rising Star: ~7% additional reimbursement on subsidy payments
  // Avg subsidy payment ~$700/mo per child, so 7% = ~$49/child/mo
  const risingStarAnnual = hasRisingStar && acceptsSubsidy
    ? children * 0.4 * 49 * 12 // assume 40% of children are subsidized
    : 0;

  // CCS subsidy: if they accept subsidized children, avg ~$700/mo/child
  // Not "grant" money per se, but ongoing revenue
  const subsidyNote = acceptsSubsidy;

  const totalEstimate = cacfpAnnual + risingStarAnnual;

  const formatCurrency = (n: number) =>
    "$" + Math.round(n).toLocaleString("en-US");

  return (
    <section
      id="estimator"
      className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20"
    >
      <div className="bg-white rounded-2xl border border-warm-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-8 border-b border-warm-100">
          <p className="text-brand-700 font-semibold text-xs uppercase tracking-widest mb-2">
            Funding estimator
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-warm-900 mb-1">
            How much is your center leaving on the table?
          </h2>
          <p className="text-sm text-warm-400">
            Adjust the numbers below. These are just the recurring programs —
            one-time grants are on top of this.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-warm-100">
          {/* Inputs */}
          <div className="p-5 sm:p-8 space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-warm-700">
                  Children enrolled
                </label>
                <span className="text-sm font-bold text-warm-900 tabular-nums">
                  {children}
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={150}
                step={5}
                value={children}
                onChange={(e) => setChildren(Number(e.target.value))}
                className="w-full accent-brand-600"
              />
              <div className="flex justify-between text-[11px] text-warm-300 mt-1">
                <span>10</span>
                <span>150</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-warm-700">
                  Meals served per day
                </label>
                <span className="text-sm font-bold text-warm-900 tabular-nums">
                  {mealsPerDay}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={1}
                value={mealsPerDay}
                onChange={(e) => setMealsPerDay(Number(e.target.value))}
                className="w-full accent-brand-600"
              />
              <div className="flex justify-between text-[11px] text-warm-300 mt-1">
                <span>1 (lunch only)</span>
                <span>3 (breakfast, lunch, snack)</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptsSubsidy}
                  onChange={(e) => setAcceptsSubsidy(e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-600"
                />
                <span className="text-sm text-warm-700">
                  Center accepts subsidized children (CCS)
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasRisingStar}
                  onChange={(e) => setHasRisingStar(e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-600"
                />
                <span className="text-sm text-warm-700">
                  Texas Rising Star certified (any level)
                </span>
              </label>
            </div>
          </div>

          {/* Results */}
          <div className="p-5 sm:p-8 bg-warm-50/50">
            <p className="text-xs font-medium text-warm-400 uppercase tracking-widest mb-5">
              Estimated annual recurring funding
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-warm-800">
                    CACFP meal reimbursement
                  </p>
                  <p className="text-xs text-warm-400 mt-0.5">
                    {children} children &times; {mealsPerDay} meals &times; ~$2.50 &times; 260 days
                  </p>
                </div>
                <span className="text-sm font-bold text-warm-900 tabular-nums">
                  {formatCurrency(cacfpAnnual)}
                </span>
              </div>

              {risingStarAnnual > 0 && (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-warm-800">
                      Rising Star incentive bonus
                    </p>
                    <p className="text-xs text-warm-400 mt-0.5">
                      Enhanced reimbursement on subsidized children
                    </p>
                  </div>
                  <span className="text-sm font-bold text-warm-900 tabular-nums">
                    {formatCurrency(risingStarAnnual)}
                  </span>
                </div>
              )}

              {subsidyNote && (
                <div className="text-xs text-warm-400 bg-warm-100/50 rounded-lg p-3">
                  CCS subsidy payments (avg ~$700/child/mo) are additional
                  ongoing revenue not included in this estimate.
                </div>
              )}
            </div>

            <div className="border-t border-warm-200 pt-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm text-warm-500">
                  Estimated recurring total
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-brand-700 tabular-nums">
                  {formatCurrency(totalEstimate)}
                  <span className="text-sm font-normal text-warm-400">
                    /yr
                  </span>
                </span>
              </div>
              <p className="text-xs text-warm-400">
                Plus one-time grants worth $10K–$25K each
              </p>
            </div>

            <Link
              href="/dashboard"
              className="mt-6 block w-full text-center bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-semibold transition shadow-md shadow-brand-600/20 text-sm"
            >
              See all programs you qualify for
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
