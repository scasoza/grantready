"use client";

import { useState } from "react";
import Link from "next/link";
import {
  grants,
  tierLabels,
  tierDescriptions,
  checkEligibility,
  type GrantTier,
  type CenterInfo,
} from "@/lib/grants";

const tiers: GrantTier[] = ["essential", "growth", "staff", "foundation"];

const tierAccent: Record<GrantTier, string> = {
  essential: "border-l-emerald-500",
  growth: "border-l-blue-500",
  staff: "border-l-violet-500",
  foundation: "border-l-amber-500",
};

const tierDot: Record<GrantTier, string> = {
  essential: "bg-emerald-500",
  growth: "bg-blue-500",
  staff: "bg-violet-500",
  foundation: "bg-amber-500",
};

const tierBg: Record<GrantTier, string> = {
  essential: "from-emerald-50/80 to-transparent",
  growth: "from-blue-50/80 to-transparent",
  staff: "from-violet-50/80 to-transparent",
  foundation: "from-amber-50/80 to-transparent",
};

const metroOptions = [
  "Houston",
  "Dallas",
  "Fort Worth",
  "San Antonio",
  "Austin",
  "El Paso",
  "Other",
];

const defaultCenter: CenterInfo = {
  licensed: true,
  servesMeals: true,
  ccsEnrolled: false,
  trsStars: 0,
  isFamilyChildcare: false,
  isRural: false,
  employeeCount: 10,
  isNonprofit: false,
  metroArea: "",
  servesUnder5: true,
};

export default function GrantExplorer() {
  const [showForm, setShowForm] = useState(false);
  const [center, setCenter] = useState<CenterInfo>(defaultCenter);
  const [filtering, setFiltering] = useState(false);

  const qualifiedIds = filtering
    ? new Set(
        grants
          .filter((g) => checkEligibility(center, g))
          .map((g) => g.id)
      )
    : null;

  const qualifiedCount = qualifiedIds ? qualifiedIds.size : grants.length;

  return (
    <section
      id="grants"
      className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24"
    >
      <div className="max-w-3xl mb-10 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-warm-900 mb-3 tracking-tight">
          {grants.length} programs we track in Texas
        </h2>
        <p className="text-sm sm:text-base text-warm-400">
          Government agencies and private foundations. Organized by how much
          they matter to your bottom line.
        </p>
      </div>

      {/* Center info qualifier */}
      <div className="mb-8 sm:mb-10">
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2.5 text-sm font-semibold transition rounded-xl px-4 py-3 border ${
            showForm
              ? "bg-brand-50 border-brand-200 text-brand-700"
              : "bg-white border-warm-200 text-brand-600 hover:border-brand-300 hover:bg-brand-50/50 shadow-sm"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {showForm ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            )}
          </svg>
          {showForm
            ? "Hide qualifier"
            : "Check which grants your center qualifies for"}
        </button>

        {showForm && (
          <div className="mt-4 bg-white border border-warm-200 rounded-2xl p-5 sm:p-7 shadow-sm">
            <h3 className="text-sm font-bold text-warm-800 mb-1">
              Tell us about your center
            </h3>
            <p className="text-xs text-warm-400 mb-5">
              We&apos;ll highlight the grants you likely qualify for.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5">
              {/* Checkboxes */}
              {[
                { key: "licensed" as const, label: "Licensed childcare center" },
                { key: "servesMeals" as const, label: "Serve meals / snacks" },
                { key: "ccsEnrolled" as const, label: "CCS provider enrolled" },
                { key: "isFamilyChildcare" as const, label: "Family childcare provider" },
                { key: "isRural" as const, label: "Rural area (pop. < 20,000)" },
                { key: "isNonprofit" as const, label: "Nonprofit organization" },
                { key: "servesUnder5" as const, label: "Serve children under 5" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 text-sm text-warm-700 cursor-pointer select-none group"
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={center[item.key] as boolean}
                      onChange={(e) =>
                        setCenter({ ...center, [item.key]: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 rounded-md border-2 border-warm-300 bg-white peer-checked:bg-brand-500 peer-checked:border-brand-500 transition flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="group-hover:text-warm-900 transition">{item.label}</span>
                </label>
              ))}

              {/* Selects & inputs */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-warm-700 whitespace-nowrap font-medium">
                  TRS Level
                </label>
                <select
                  value={center.trsStars}
                  onChange={(e) =>
                    setCenter({ ...center, trsStars: Number(e.target.value) })
                  }
                  className="flex-1 bg-warm-50 border border-warm-200 rounded-xl px-3 py-2 text-sm text-warm-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value={0}>None</option>
                  <option value={2}>2-Star</option>
                  <option value={3}>3-Star</option>
                  <option value={4}>4-Star</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-warm-700 whitespace-nowrap font-medium">
                  Employees
                </label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={center.employeeCount}
                  onChange={(e) =>
                    setCenter({
                      ...center,
                      employeeCount: Number(e.target.value) || 1,
                    })
                  }
                  className="w-24 bg-warm-50 border border-warm-200 rounded-xl px-3 py-2 text-sm text-warm-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <label className="text-sm text-warm-700 whitespace-nowrap font-medium">
                  Metro area
                </label>
                <select
                  value={center.metroArea}
                  onChange={(e) =>
                    setCenter({ ...center, metroArea: e.target.value })
                  }
                  className="flex-1 max-w-xs bg-warm-50 border border-warm-200 rounded-xl px-3 py-2 text-sm text-warm-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">Select...</option>
                  {metroOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 pt-5 border-t border-warm-100">
              <button
                onClick={() => setFiltering(true)}
                className="bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-sm px-6 py-2.5 rounded-xl font-semibold transition"
              >
                Show my grants
              </button>
              {filtering && (
                <button
                  onClick={() => setFiltering(false)}
                  className="text-sm text-warm-400 hover:text-warm-600 transition font-medium"
                >
                  Clear filter
                </button>
              )}
              {filtering && (
                <span className="text-sm font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
                  {qualifiedCount} of {grants.length} match
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grant lists by tier */}
      {tiers.map((tier) => {
        const tierGrants = grants.filter((g) => g.tier === tier);
        return (
          <div key={tier} className="mb-8 sm:mb-10">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${tierDot[tier]}`} />
              <h3 className="text-sm font-bold text-warm-800 tracking-tight">
                {tierLabels[tier]}
              </h3>
              <span className="text-xs text-warm-300 font-medium">
                {tierGrants.length}
              </span>
            </div>
            <p className="text-xs text-warm-400 mb-3 ml-5">
              {tierDescriptions[tier]}
            </p>
            <div className="space-y-2">
              {tierGrants.map((grant) => {
                const qualified =
                  qualifiedIds === null || qualifiedIds.has(grant.id);
                const dimmed = qualifiedIds !== null && !qualified;
                return (
                  <Link
                    key={grant.id}
                    href={`/dashboard?grant=${grant.id}`}
                    className={`block bg-white rounded-xl border border-warm-200/80 border-l-[3px] ${tierAccent[tier]} px-4 sm:px-5 py-3.5 sm:py-4 hover:shadow-md hover:-translate-y-px transition-all duration-200 group bg-gradient-to-r ${dimmed ? "opacity-35 hover:opacity-60" : tierBg[tier]}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-warm-900 leading-snug group-hover:text-brand-700 transition">
                          {grant.name}
                          {qualifiedIds !== null && qualified && (
                            <span className="ml-2 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold align-middle">
                              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Qualified
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-warm-400 mt-0.5">
                          {grant.source}
                          {grant.recurring && (
                            <span className="text-blue-500 font-semibold">
                              {" "}&middot; Recurring
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <span className="text-brand-700 font-bold text-xs sm:text-sm whitespace-nowrap">
                          {grant.amount}
                        </span>
                        <svg
                          className="w-4 h-4 text-warm-200 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="text-center sm:text-left mt-6">
        <Link
          href="/login"
          className="inline-block bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white px-8 py-4 rounded-2xl font-semibold transition shadow-lg shadow-brand-600/20 text-sm"
        >
          See full details and eligibility
        </Link>
      </div>
    </section>
  );
}
