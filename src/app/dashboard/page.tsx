"use client";

import { useState } from "react";
import Link from "next/link";
import {
  grants,
  tierLabels,
  type GrantTier,
  type GrantStatus,
} from "@/lib/grants";

const statusColors: Record<GrantStatus, string> = {
  open: "bg-emerald-900/50 text-emerald-400",
  upcoming: "bg-amber-900/50 text-amber-400",
  ongoing: "bg-blue-900/50 text-blue-400",
};

const difficultyColors: Record<string, string> = {
  Easy: "text-emerald-400",
  Medium: "text-amber-400",
  Hard: "text-red-400",
};

const tierBadgeColors: Record<GrantTier, string> = {
  essential: "bg-emerald-900/60 text-emerald-400",
  growth: "bg-blue-900/60 text-blue-400",
  staff: "bg-purple-900/60 text-purple-400",
  foundation: "bg-amber-900/60 text-amber-400",
};

type FilterType = "all" | GrantTier;

export default function Dashboard() {
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [centerName, setCenterName] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = grants
    .filter((g) => filter === "all" || g.tier === filter)
    .filter(
      (g) =>
        search === "" ||
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.description.toLowerCase().includes(search.toLowerCase()) ||
        g.source.toLowerCase().includes(search.toLowerCase())
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, centerName, phone, zipCode }),
      });
    } catch {
      // Still show success
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-20 sm:pb-0">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between max-w-6xl mx-auto">
          <Link href="/" className="text-lg font-bold text-emerald-400">
            GrantReady
          </Link>
          <button
            onClick={() => setShowSignup(true)}
            className="text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-3 sm:px-4 py-2 rounded-lg transition font-medium"
          >
            Start Free Trial
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Stats row — scrollable on mobile */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-8">
          {[
            {
              value: grants.length,
              label: "Tracked",
              color: "text-white",
            },
            {
              value: grants.filter((g) => g.recurring).length,
              label: "Recurring",
              color: "text-blue-400",
            },
            {
              value: grants.filter((g) => g.status === "open").length,
              label: "Open",
              color: "text-emerald-400",
            },
            {
              value: grants.filter((g) => g.status === "upcoming").length,
              label: "Upcoming",
              color: "text-amber-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-gray-900 border border-gray-800 rounded-xl p-2.5 sm:p-4 text-center"
            >
              <div
                className={`text-lg sm:text-2xl font-bold ${s.color}`}
              >
                {s.value}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-400">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search grants by name, source, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-600 text-sm"
          />
        </div>

        {/* Filter chips — horizontally scrollable on mobile */}
        <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar pb-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-2 rounded-lg text-xs transition whitespace-nowrap flex-shrink-0 ${
              filter === "all"
                ? "bg-emerald-600 text-white"
                : "bg-gray-800 text-gray-400 active:bg-gray-700"
            }`}
          >
            All ({grants.length})
          </button>
          {(
            ["essential", "growth", "staff", "foundation"] as GrantTier[]
          ).map((tier) => (
            <button
              key={tier}
              onClick={() => setFilter(tier)}
              className={`px-3 py-2 rounded-lg text-xs transition whitespace-nowrap flex-shrink-0 ${
                filter === tier
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-800 text-gray-400 active:bg-gray-700"
              }`}
            >
              {tierLabels[tier]} (
              {grants.filter((g) => g.tier === tier).length})
            </button>
          ))}
        </div>

        {/* Recommended banner */}
        {filter === "all" && search === "" && (
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 sm:p-4 mb-4">
            <p className="text-xs sm:text-sm text-emerald-300 leading-relaxed">
              <span className="font-semibold">💡 Start here:</span> The 3
              &ldquo;Essential Revenue&rdquo; grants are ongoing funding every
              licensed center should have. CACFP alone =
              $30K–$60K/yr for a 60-child center.
            </p>
          </div>
        )}

        {/* Grant list */}
        <div className="grid gap-2.5">
          {filtered.map((grant) => {
            const isExpanded = expandedId === grant.id;
            return (
              <div
                key={grant.id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden transition active:bg-gray-800/80"
              >
                {/* Main row — always visible */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : grant.id)
                  }
                  className="w-full text-left p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${statusColors[grant.status]}`}
                        >
                          {grant.status}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${tierBadgeColors[grant.tier]}`}
                        >
                          {tierLabels[grant.tier]}
                        </span>
                        {grant.recurring && (
                          <span className="text-[10px] bg-blue-900/50 text-blue-400 px-1.5 py-0.5 rounded">
                            Recurring
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-white leading-snug">
                        {grant.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {grant.source}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="text-emerald-400 font-bold text-sm sm:text-base whitespace-nowrap">
                        {grant.amount}
                      </div>
                      <svg
                        className={`w-4 h-4 text-gray-500 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
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
                    </div>
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t border-gray-800">
                    <p className="text-sm text-gray-300 mt-3 mb-3 leading-relaxed">
                      {grant.description}
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-20 flex-shrink-0">
                          Eligibility
                        </span>
                        <span className="text-gray-300">
                          {grant.eligibility}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-20 flex-shrink-0">
                          Deadline
                        </span>
                        <span className="text-gray-300">
                          {grant.deadline}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-20 flex-shrink-0">
                          Difficulty
                        </span>
                        <span className={difficultyColors[grant.difficulty]}>
                          {grant.difficulty}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSignup(true);
                      }}
                      className="mt-4 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-6 py-2.5 rounded-xl transition font-medium"
                    >
                      Start Application
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            No grants match your search. Try a different term.
          </div>
        )}
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur-md border-t border-gray-800 p-3 sm:hidden z-50">
        <button
          onClick={() => setShowSignup(true)}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-medium transition text-sm"
        >
          Start Free Trial — 14 Days Free
        </button>
      </div>

      {/* Signup Modal */}
      {showSignup && (
        <div
          className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSignup(false);
          }}
        >
          <div className="bg-gray-900 border-t sm:border border-gray-700 rounded-t-2xl sm:rounded-2xl p-6 sm:p-8 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            {/* Drag handle for mobile */}
            <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4 sm:hidden" />

            {submitted ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold mb-2">
                  You&apos;re on the list!
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                  We&apos;ll reach out within 24 hours to set up your account.
                </p>
                <div className="bg-gray-800 rounded-xl p-4 mb-6 text-left">
                  <p className="text-[11px] text-gray-400 mb-1 uppercase tracking-wide">
                    Quick win while you wait
                  </p>
                  <p className="text-sm text-white leading-relaxed">
                    If you&apos;re not enrolled in{" "}
                    <span className="text-emerald-400 font-medium">CACFP</span>,
                    that&apos;s your #1 priority. A 60-child center can receive
                    $30K–$60K/year in meal reimbursements.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSignup(false);
                    setSubmitted(false);
                  }}
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-medium"
                >
                  Back to Grants
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-1">
                  Start Your Free Trial
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                  14 days free, then $199/mo. Cancel anytime.
                </p>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">
                      Center Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={centerName}
                      onChange={(e) => setCenterName(e.target.value)}
                      placeholder="Sunshine Learning Center"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-600 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">
                      Your Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="director@center.com"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-600 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-600 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="75001"
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-600 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-medium transition text-base mt-2"
                  >
                    Start Free Trial
                  </button>
                  <p className="text-[11px] text-gray-500 text-center">
                    No credit card required
                  </p>
                </form>
                <button
                  onClick={() => setShowSignup(false)}
                  className="w-full text-center text-gray-500 text-sm mt-3 py-2 active:text-gray-300"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
