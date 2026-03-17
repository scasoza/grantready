"use client";

import { useState } from "react";
import Link from "next/link";
import {
  grants,
  tierLabels,
  checkEligibility,
  type GrantTier,
  type CenterInfo,
} from "@/lib/grants";

const tiers: GrantTier[] = ["essential", "growth", "staff", "foundation"];

const tierAccent: Record<GrantTier, string> = {
  essential: "border-l-green-500",
  growth: "border-l-blue-500",
  staff: "border-l-violet-500",
  foundation: "border-l-amber-500",
};

const tierDot: Record<GrantTier, string> = {
  essential: "bg-green-500",
  growth: "bg-blue-500",
  staff: "bg-violet-500",
  foundation: "bg-amber-500",
};

const metroOptions = [
  "",
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
      className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20"
    >
      <div className="max-w-3xl mb-8 sm:mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-warm-900 mb-2">
          {grants.length} programs we track in Texas
        </h2>
        <p className="text-sm text-warm-400">
          Government agencies and private foundations. Organized by how much
          they matter to your bottom line.
        </p>
      </div>

      {/* Center info toggle */}
      <div className="mb-6 sm:mb-8">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showForm ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
          {showForm
            ? "Hide center info"
            : "Enter your center info to see which grants you qualify for"}
        </button>

        {showForm && (
          <div className="mt-4 bg-white border border-warm-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <p className="text-xs text-warm-400 mb-4">
              Answer a few questions about your center. We&apos;ll highlight
              the grants you likely qualify for.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {/* Checkboxes */}
              <label className="flex items-center gap-2.5 text-sm text-warm-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={center.licensed}
                  onChange={(e) =>
                    setCenter({ ...center, licensed: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-warm-300 text-brand-600 focus:ring-brand-500"
                />
                Licensed childcare center
              </label>
              <label className="flex items-center gap-2.5 text-sm text-warm-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={center.servesMeals}
                  onChange={(e) =>
                    setCenter({ ...center, servesMeals: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-warm-300 text-brand-600 focus:ring-brand-500"
                />
                Serve meals/snacks
              </label>
              <label className="flex items-center gap-2.5 text-sm text-warm-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={center.ccsEnrolled}
                  onChange={(e) =>
                    setCenter({ ...center, ccsEnrolled: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-warm-300 text-brand-600 focus:ring-brand-500"
                />
                CCS provider enrolled
              </label>
              <label className="flex items-center gap-2.5 text-sm text-warm-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={center.isFamilyChildcare}
                  onChange={(e) =>
                    setCenter({
                      ...center,
                      isFamilyChildcare: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-warm-300 text-brand-600 focus:ring-brand-500"
                />
                Family childcare provider
              </label>
              <label className="flex items-center gap-2.5 text-sm text-warm-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={center.isRural}
                  onChange={(e) =>
                    setCenter({ ...center, isRural: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-warm-300 text-brand-600 focus:ring-brand-500"
                />
                Rural area (pop. &lt; 20,000)
              </label>
              <label className="flex items-center gap-2.5 text-sm text-warm-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={center.isNonprofit}
                  onChange={(e) =>
                    setCenter({ ...center, isNonprofit: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-warm-300 text-brand-600 focus:ring-brand-500"
                />
                Nonprofit organization
              </label>
              <label className="flex items-center gap-2.5 text-sm text-warm-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={center.servesUnder5}
                  onChange={(e) =>
                    setCenter({ ...center, servesUnder5: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-warm-300 text-brand-600 focus:ring-brand-500"
                />
                Serve children under 5
              </label>

              {/* Dropdowns / inputs */}
              <div className="flex items-center gap-2.5">
                <label className="text-sm text-warm-700 whitespace-nowrap">
                  TRS Level
                </label>
                <select
                  value={center.trsStars}
                  onChange={(e) =>
                    setCenter({
                      ...center,
                      trsStars: Number(e.target.value),
                    })
                  }
                  className="flex-1 bg-warm-50 border border-warm-200 rounded-lg px-3 py-1.5 text-sm text-warm-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value={0}>None</option>
                  <option value={2}>2-Star</option>
                  <option value={3}>3-Star</option>
                  <option value={4}>4-Star</option>
                </select>
              </div>
              <div className="flex items-center gap-2.5">
                <label className="text-sm text-warm-700 whitespace-nowrap">
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
                  className="w-20 bg-warm-50 border border-warm-200 rounded-lg px-3 py-1.5 text-sm text-warm-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
              <div className="flex items-center gap-2.5">
                <label className="text-sm text-warm-700 whitespace-nowrap">
                  Metro area
                </label>
                <select
                  value={center.metroArea}
                  onChange={(e) =>
                    setCenter({ ...center, metroArea: e.target.value })
                  }
                  className="flex-1 bg-warm-50 border border-warm-200 rounded-lg px-3 py-1.5 text-sm text-warm-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">Select...</option>
                  {metroOptions
                    .filter((m) => m !== "")
                    .map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={() => setFiltering(true)}
                className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-5 py-2.5 rounded-xl font-medium transition shadow-sm"
              >
                Show my grants
              </button>
              {filtering && (
                <button
                  onClick={() => setFiltering(false)}
                  className="text-sm text-warm-400 hover:text-warm-600 transition"
                >
                  Clear filter
                </button>
              )}
              {filtering && (
                <span className="text-sm text-brand-600 font-medium">
                  {qualifiedCount} of {grants.length} grants match
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
          <div key={tier} className="mb-7 sm:mb-9">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span
                className={`w-2 h-2 rounded-full ${tierDot[tier]}`}
              />
              <h3 className="text-xs font-semibold text-warm-700 uppercase tracking-wide">
                {tierLabels[tier]}
              </h3>
              <span className="text-xs text-warm-300">
                {tierGrants.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {tierGrants.map((grant) => {
                const qualified =
                  qualifiedIds === null || qualifiedIds.has(grant.id);
                const dimmed = qualifiedIds !== null && !qualified;
                return (
                  <Link
                    key={grant.id}
                    href={`/dashboard?grant=${grant.id}`}
                    className={`block bg-white rounded-lg border border-warm-200/80 border-l-[3px] ${tierAccent[tier]} px-4 py-3 sm:py-3.5 hover:shadow-sm transition group ${dimmed ? "opacity-40" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-warm-900 leading-snug group-hover:text-brand-700 transition">
                          {grant.name}
                          {qualifiedIds !== null && qualified && (
                            <span className="ml-2 inline-block text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-medium align-middle">
                              Qualified
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-warm-400 mt-0.5">
                          {grant.source}
                          {grant.recurring && (
                            <span className="text-blue-500 font-medium">
                              {" "}&middot; Recurring
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-brand-700 font-bold text-xs sm:text-sm whitespace-nowrap mt-0.5">
                          {grant.amount}
                        </span>
                        <svg
                          className="w-3.5 h-3.5 text-warm-300 group-hover:text-brand-500 transition"
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

      <Link
        href="/dashboard"
        className="inline-block bg-brand-600 hover:bg-brand-700 text-white px-7 py-3.5 rounded-xl font-semibold transition shadow-md shadow-brand-600/20 text-sm mt-4"
      >
        See full details and eligibility
      </Link>
    </section>
  );
}
