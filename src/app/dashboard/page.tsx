"use client";

import { useState } from "react";
import Link from "next/link";

const grants = [
  {
    id: 1,
    name: "T3C Readiness Grants",
    source: "TWC / TACFS",
    amount: "Varies by project",
    deadline: "Next cycle: TBD",
    eligibility: "Licensed residential childcare providers",
    description:
      "Supports readiness activities to meet T3C service array credentialing requirements.",
    status: "open" as const,
    difficulty: "Medium",
  },
  {
    id: 2,
    name: "Pre-K Partnership Grants",
    source: "Texas Workforce Commission",
    amount: "Up to $25,000",
    deadline: "Check TWC for current cycle",
    eligibility: "Texas Rising Star 3- or 4-Star rated providers",
    description:
      "Start-up costs for new pre-k partnership classrooms in collaboration with school districts.",
    status: "open" as const,
    difficulty: "Hard",
  },
  {
    id: 3,
    name: "CACFP Meal Reimbursement",
    source: "USDA / Texas Dept of Agriculture",
    amount: "Per-meal reimbursement",
    deadline: "Open enrollment",
    eligibility: "Licensed childcare centers serving qualifying children",
    description:
      "Federal reimbursement for nutritious meals and snacks served to enrolled children.",
    status: "open" as const,
    difficulty: "Easy",
  },
  {
    id: 4,
    name: "Texas Rising Star Quality Incentives",
    source: "Texas Workforce Commission",
    amount: "Tiered by star level",
    deadline: "Ongoing",
    eligibility: "Licensed centers accepting subsidized children",
    description:
      "Financial incentives for meeting quality benchmarks in teacher qualifications, curriculum, and environment.",
    status: "open" as const,
    difficulty: "Medium",
  },
  {
    id: 5,
    name: "FCCN Start-Up Mini-Grants",
    source: "TX Family Child Care Network / TWC",
    amount: "Up to $15,000",
    deadline: "Until 200 recipients funded",
    eligibility: "New or advancing family childcare providers",
    description:
      "Supports new family childcare providers seeking registration or licensure.",
    status: "open" as const,
    difficulty: "Easy",
  },
  {
    id: 6,
    name: "CDA Scholarship Program",
    source: "Workforce Solutions (regional)",
    amount: "Full tuition + books",
    deadline: "Feb 2027 (next cycle)",
    eligibility: "Staff at Texas Rising Star certified centers",
    description:
      "Covers cost of Child Development Associate credential coursework and materials.",
    status: "upcoming" as const,
    difficulty: "Easy",
  },
  {
    id: 7,
    name: "Preschool Development Grant (PDG B-5)",
    source: "Federal HHS / TWC",
    amount: "Varies",
    deadline: "State-administered",
    eligibility: "Programs serving birth through age 5",
    description:
      "Federal funding to improve coordination and quality of early childhood programs statewide.",
    status: "upcoming" as const,
    difficulty: "Hard",
  },
];

const statusColors = {
  open: "bg-emerald-900/50 text-emerald-400",
  upcoming: "bg-amber-900/50 text-amber-400",
  closed: "bg-red-900/50 text-red-400",
};

const difficultyColors: Record<string, string> = {
  Easy: "text-emerald-400",
  Medium: "text-amber-400",
  Hard: "text-red-400",
};

export default function Dashboard() {
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [centerName, setCenterName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "upcoming">("all");

  const filtered =
    filter === "all" ? grants : grants.filter((g) => g.status === filter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          Sign Up for Free Trial
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Grant Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">
              Texas childcare grants — {grants.length} opportunities tracked
            </p>
          </div>
          <div className="flex gap-2">
            {(["all", "open", "upcoming"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize transition ${
                  filter === f
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {f} {f === "all" ? `(${grants.length})` : `(${grants.filter((g) => g.status === f).length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {filtered.map((grant) => (
            <div
              key={grant.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-emerald-800 transition"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {grant.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${statusColors[grant.status]}`}
                    >
                      {grant.status}
                    </span>
                    <span
                      className={`text-xs ${difficultyColors[grant.difficulty]}`}
                    >
                      {grant.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">
                    {grant.description}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded">
                      {grant.source}
                    </span>
                    <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded">
                      {grant.eligibility}
                    </span>
                    <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded">
                      Deadline: {grant.deadline}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-emerald-400 font-bold text-lg">
                    {grant.amount}
                  </div>
                  <button
                    onClick={() => setShowSignup(true)}
                    className="text-sm bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-4 py-1.5 rounded-lg transition"
                  >
                    Start Application
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Signup Modal */}
      {showSignup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full">
            {submitted ? (
              <div className="text-center">
                <div className="text-4xl mb-4">&#10003;</div>
                <h2 className="text-xl font-bold mb-2">You&apos;re on the list!</h2>
                <p className="text-gray-400 text-sm mb-6">
                  We&apos;ll reach out within 24 hours to set up your GrantReady
                  account and start finding grants for your center.
                </p>
                <button
                  onClick={() => {
                    setShowSignup(false);
                    setSubmitted(false);
                  }}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-2">
                  Start Your Free Trial
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                  14 days free. Then $199/month. Cancel anytime.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      Center Name
                    </label>
                    <input
                      type="text"
                      required
                      value={centerName}
                      onChange={(e) => setCenterName(e.target.value)}
                      placeholder="e.g. Sunshine Learning Center"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="director@center.com"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-medium transition"
                  >
                    Start Free Trial
                  </button>
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
