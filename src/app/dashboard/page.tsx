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

  const filtered = grants
    .filter((g) => filter === "all" || g.tier === filter)
    .filter(
      (g) =>
        search === "" ||
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.description.toLowerCase().includes(search.toLowerCase()) ||
        g.source.toLowerCase().includes(search.toLowerCase())
    );

  const totalRecurring = grants.filter((g) => g.recurring).length;

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
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="text-xl font-bold text-emerald-400">
          GrantReady
        </Link>
        <button
          onClick={() => setShowSignup(true)}
          className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition"
        >
          Start Free Trial
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {grants.length}
            </div>
            <div className="text-xs text-gray-400">Programs Tracked</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {totalRecurring}
            </div>
            <div className="text-xs text-gray-400">Recurring Funding</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {grants.filter((g) => g.status === "open").length}
            </div>
            <div className="text-xs text-gray-400">Open Now</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">
              {grants.filter((g) => g.status === "upcoming").length}
            </div>
            <div className="text-xs text-gray-400">Upcoming</div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search grants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-600 text-sm"
          />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-2 rounded-lg text-xs transition ${
                filter === "all"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
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
                className={`px-3 py-2 rounded-lg text-xs transition ${
                  filter === tier
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {tierLabels[tier]} (
                {grants.filter((g) => g.tier === tier).length})
              </button>
            ))}
          </div>
        </div>

        {/* Recommended banner */}
        {filter === "all" && search === "" && (
          <div className="bg-emerald-950/40 border border-emerald-800 rounded-xl p-4 mb-6">
            <p className="text-sm text-emerald-300">
              <span className="font-semibold">Start here:</span> The top 3
              &ldquo;Essential Revenue&rdquo; grants are ongoing funding streams
              that every licensed Texas center should apply for. CACFP alone can
              bring in $30K–$60K/year for a 60-child center.
            </p>
          </div>
        )}

        {/* Grant list */}
        <div className="grid gap-3">
          {filtered.map((grant) => (
            <div
              key={grant.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-base font-semibold text-white">
                      {grant.name}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[grant.status]}`}
                    >
                      {grant.status}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${tierBadgeColors[grant.tier]}`}
                    >
                      {tierLabels[grant.tier]}
                    </span>
                    {grant.recurring && (
                      <span className="text-[10px] bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded-full">
                        Recurring
                      </span>
                    )}
                    <span
                      className={`text-[10px] ${difficultyColors[grant.difficulty]}`}
                    >
                      {grant.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">
                    {grant.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                      {grant.source}
                    </span>
                    <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                      {grant.eligibility}
                    </span>
                    <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                      Deadline: {grant.deadline}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="text-emerald-400 font-bold">
                    {grant.amount}
                  </div>
                  <button
                    onClick={() => setShowSignup(true)}
                    className="text-xs bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-4 py-2 rounded-lg transition whitespace-nowrap"
                  >
                    Start Application
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No grants match your search. Try a different term or filter.
          </div>
        )}
      </div>

      {/* Signup Modal */}
      {showSignup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            {submitted ? (
              <div className="text-center">
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
                  We&apos;ll reach out within 24 hours to set up your GrantReady
                  account and help you identify the best grants for your center.
                </p>
                <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
                  <p className="text-xs text-gray-400 mb-1">
                    While you wait, here&apos;s a quick win:
                  </p>
                  <p className="text-sm text-white">
                    If you&apos;re not enrolled in{" "}
                    <span className="text-emerald-400 font-medium">CACFP</span>,
                    that&apos;s your #1 priority. A 60-child center can receive
                    $30,000–$60,000/year in meal reimbursements.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSignup(false);
                    setSubmitted(false);
                  }}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg"
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
                  14 days free. Then $199/month. Cancel anytime. We&apos;ll
                  match your center to every grant you qualify for.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      Center Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={centerName}
                      onChange={(e) => setCenterName(e.target.value)}
                      placeholder="e.g. Sunshine Learning Center"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      Your Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="director@center.com"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="75001"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-medium transition"
                  >
                    Start Free Trial
                  </button>
                  <p className="text-[11px] text-gray-500 text-center">
                    No credit card required. We&apos;ll email you access within
                    24 hours.
                  </p>
                </form>
                <button
                  onClick={() => setShowSignup(false)}
                  className="w-full text-center text-gray-500 text-sm mt-3 hover:text-gray-300"
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
