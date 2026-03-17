"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  grants,
  tierLabels,
  type GrantTier,
  type GrantStatus,
} from "@/lib/grants";

const statusLabel: Record<GrantStatus, string> = {
  open: "Open",
  upcoming: "Upcoming",
  ongoing: "Ongoing",
};

const statusStyle: Record<GrantStatus, string> = {
  open: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
  upcoming: "bg-amber-50 text-amber-700 border border-amber-200/60",
  ongoing: "bg-blue-50 text-blue-700 border border-blue-200/60",
};

const tierDot: Record<GrantTier, string> = {
  essential: "bg-emerald-500",
  growth: "bg-blue-500",
  staff: "bg-violet-500",
  foundation: "bg-amber-500",
};

const diffStyle: Record<string, string> = {
  Easy: "text-emerald-600",
  Medium: "text-amber-600",
  Hard: "text-red-500",
};

type FilterType = "all" | GrantTier;

export default function Dashboard() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [centerName, setCenterName] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const grantParam = searchParams.get("grant");
    if (grantParam) {
      const id = Number(grantParam);
      if (!isNaN(id)) {
        setExpandedId(id);
        setTimeout(() => {
          const el = document.getElementById(`grant-${id}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    }
  }, [searchParams]);

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
      // still show success
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-warm-50 pb-20 sm:pb-0">
      {/* Nav */}
      <nav className="sticky top-0 z-40 glass border-b border-warm-200/40 shadow-sm shadow-warm-900/[0.03]">
        <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between max-w-5xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-md shadow-brand-600/25">
              <span className="text-white font-extrabold text-xs">G</span>
            </div>
            <span className="text-base font-bold text-warm-900 tracking-tight">
              GrantReady
            </span>
          </Link>
          <button
            onClick={() => setShowSignup(true)}
            className="text-xs sm:text-sm bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white px-4 sm:px-5 py-2.5 rounded-xl transition font-semibold shadow-md shadow-brand-600/25"
          >
            Start Free Trial
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Page header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-warm-900 tracking-tight">
            Texas Childcare Grants
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-warm-400 text-sm">
              {grants.length} programs
            </span>
            <span className="w-1 h-1 rounded-full bg-warm-300" />
            <span className="text-sm text-blue-500 font-medium">
              {grants.filter((g) => g.recurring).length} recurring
            </span>
            <span className="w-1 h-1 rounded-full bg-warm-300" />
            <span className="text-sm text-emerald-600 font-medium">
              {grants.filter((g) => g.status === "open").length} open now
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <svg
            className="w-4 h-4 text-warm-300 absolute left-4 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search grants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-warm-200 rounded-2xl pl-11 pr-4 py-3.5 text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm shadow-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-0.5">
          {[
            { key: "all" as FilterType, label: "All", count: grants.length },
            ...(["essential", "growth", "staff", "foundation"] as GrantTier[]).map((t) => ({
              key: t as FilterType,
              label: tierLabels[t],
              count: grants.filter((g) => g.tier === t).length,
            })),
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2.5 rounded-xl text-xs transition whitespace-nowrap flex-shrink-0 font-semibold ${
                filter === f.key
                  ? "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-md shadow-brand-600/20"
                  : "bg-white border border-warm-200 text-warm-500 hover:text-warm-700 hover:border-warm-300 hover:shadow-sm"
              }`}
            >
              {f.label}
              <span
                className={`ml-1.5 ${
                  filter === f.key ? "text-brand-200" : "text-warm-300"
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tip banner */}
        {filter === "all" && search === "" && (
          <div className="bg-gradient-to-r from-brand-50 to-emerald-50/50 border border-brand-100 rounded-2xl p-4 sm:p-5 mb-6 flex gap-3.5 items-start">
            <div className="w-8 h-8 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <p className="text-xs sm:text-sm text-brand-800 leading-relaxed">
              <span className="font-bold">Start with the essentials.</span>{" "}
              CACFP, CCS enrollment, and Rising Star are ongoing funding streams
              that every licensed center should have. CACFP alone can bring in
              $30K–$60K/year.
            </p>
          </div>
        )}

        {/* Grant list */}
        <div className="space-y-2.5">
          {filtered.map((grant) => {
            const isExpanded = expandedId === grant.id;
            return (
              <div
                key={grant.id}
                id={`grant-${grant.id}`}
                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${
                  isExpanded
                    ? "border-brand-200 shadow-md shadow-brand-500/[0.06] ring-1 ring-brand-100"
                    : "border-warm-200/80 hover:shadow-md hover:-translate-y-px"
                }`}
              >
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : grant.id)
                  }
                  className="w-full text-left p-4 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    {/* Tier dot */}
                    <span
                      className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${tierDot[grant.tier]}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-warm-900 leading-snug">
                            {grant.name}
                          </h3>
                          <p className="text-xs text-warm-400 mt-0.5 truncate">
                            {grant.source}
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <span className="text-brand-700 font-bold text-sm hidden sm:inline">
                            {grant.amount}
                          </span>
                          <svg
                            className={`w-4 h-4 text-warm-300 transition-transform duration-200 ${
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
                      {/* Tags row */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-brand-700 font-bold text-xs sm:hidden">
                          {grant.amount}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusStyle[grant.status]}`}
                        >
                          {statusLabel[grant.status]}
                        </span>
                        {grant.recurring && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold border border-blue-200/60">
                            Recurring
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold ${diffStyle[grant.difficulty]}`}
                        >
                          {grant.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 sm:pb-6 ml-5 border-t border-warm-100">
                    <p className="text-sm text-warm-600 mt-4 mb-5 leading-relaxed">
                      {grant.description}
                    </p>
                    <div className="grid grid-cols-[90px_1fr] gap-y-2.5 text-xs mb-5 bg-warm-50/80 rounded-xl p-4 border border-warm-100">
                      <span className="text-warm-400 font-medium">Eligibility</span>
                      <span className="text-warm-700">{grant.eligibility}</span>
                      <span className="text-warm-400 font-medium">Deadline</span>
                      <span className="text-warm-700">{grant.deadline}</span>
                      <span className="text-warm-400 font-medium">Amount</span>
                      <span className="text-warm-800 font-bold">{grant.amount}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSignup(true);
                      }}
                      className="w-full sm:w-auto bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-sm px-7 py-3 rounded-xl transition font-semibold shadow-md shadow-brand-600/20"
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
          <div className="text-center py-20 text-warm-400 text-sm">
            No grants match your search.
          </div>
        )}
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-warm-200 p-3 sm:hidden z-50">
        <button
          onClick={() => setShowSignup(true)}
          className="w-full bg-gradient-to-b from-brand-500 to-brand-600 text-white py-3.5 rounded-xl font-semibold transition shadow-lg shadow-brand-600/25 text-sm"
        >
          Start Free Trial — 14 Days Free
        </button>
      </div>

      {/* Signup Modal */}
      {showSignup && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSignup(false);
          }}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 w-full sm:max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="w-10 h-1 bg-warm-200 rounded-full mx-auto mb-5 sm:hidden" />

            {submitted ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-brand-100">
                  <svg className="w-8 h-8 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-xl font-extrabold text-warm-900 mb-2">
                  You&apos;re on the list!
                </h2>
                <p className="text-warm-500 text-sm mb-6">
                  We&apos;ll reach out within 24 hours.
                </p>
                <div className="bg-gradient-to-br from-brand-50 to-emerald-50/50 rounded-2xl p-5 mb-6 text-left border border-brand-100">
                  <p className="text-[11px] text-brand-600 font-bold mb-1.5 uppercase tracking-wider">
                    Quick win
                  </p>
                  <p className="text-sm text-warm-700 leading-relaxed">
                    Not enrolled in{" "}
                    <span className="text-brand-700 font-bold">CACFP</span>
                    ? A 60-child center gets $30K–$60K/year in meal
                    reimbursements. That&apos;s your #1 priority.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSignup(false);
                    setSubmitted(false);
                  }}
                  className="w-full bg-gradient-to-b from-brand-500 to-brand-600 text-white py-3.5 rounded-xl font-semibold shadow-md shadow-brand-600/20"
                >
                  Back to Grants
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-extrabold text-warm-900 mb-1">
                  Start your free trial
                </h2>
                <p className="text-warm-400 text-sm mb-7">
                  14 days free &middot; $199/mo after &middot; Cancel anytime
                </p>
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs text-warm-500 mb-1.5 font-semibold">
                      Center Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={centerName}
                      onChange={(e) => setCenterName(e.target.value)}
                      placeholder="Sunshine Learning Center"
                      className="w-full bg-warm-50 border border-warm-200 rounded-xl px-4 py-3 text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-warm-500 mb-1.5 font-semibold">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@center.com"
                      className="w-full bg-warm-50 border border-warm-200 rounded-xl px-4 py-3 text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-warm-500 mb-1.5 font-semibold">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="w-full bg-warm-50 border border-warm-200 rounded-xl px-4 py-3 text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-warm-500 mb-1.5 font-semibold">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="75001"
                        className="w-full bg-warm-50 border border-warm-200 rounded-xl px-4 py-3 text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white py-3.5 rounded-xl font-semibold transition shadow-lg shadow-brand-600/20 text-base mt-2"
                  >
                    Start Free Trial
                  </button>
                  <p className="text-[11px] text-warm-400 text-center">
                    No credit card required
                  </p>
                </form>
                <button
                  onClick={() => setShowSignup(false)}
                  className="w-full text-center text-warm-400 text-sm mt-3 py-2 hover:text-warm-600 font-medium"
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
