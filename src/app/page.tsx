import Link from "next/link";
import {
  grants,
  tierLabels,
  tierDescriptions,
  type GrantTier,
} from "@/lib/grants";

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

const tiers: GrantTier[] = ["essential", "growth", "staff", "foundation"];

const tierBadgeColors: Record<GrantTier, string> = {
  essential: "bg-emerald-900/60 text-emerald-400 border-emerald-800",
  growth: "bg-blue-900/60 text-blue-400 border-blue-800",
  staff: "bg-purple-900/60 text-purple-400 border-purple-800",
  foundation: "bg-amber-900/60 text-amber-400 border-amber-800",
};

const tierCardColors: Record<GrantTier, string> = {
  essential: "border-emerald-800/60 hover:border-emerald-700",
  growth: "border-blue-800/60 hover:border-blue-700",
  staff: "border-purple-800/60 hover:border-purple-700",
  foundation: "border-amber-800/60 hover:border-amber-700",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Nav — compact on mobile */}
      <nav className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between max-w-6xl mx-auto">
          <span className="text-lg sm:text-xl font-bold text-emerald-400">
            GrantReady
          </span>
          <div className="flex gap-2 sm:gap-4 items-center">
            <a
              href="#grants"
              className="text-xs sm:text-sm text-gray-400 hover:text-white hidden sm:inline"
            >
              Grants
            </a>
            <a
              href="#pricing"
              className="text-xs sm:text-sm text-gray-400 hover:text-white hidden sm:inline"
            >
              Pricing
            </a>
            <Link
              href="/dashboard"
              className="text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-3 sm:px-4 py-2 rounded-lg transition font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — mobile-optimized spacing and font sizes */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-10 sm:pb-16 text-center">
        <div className="inline-block bg-emerald-900/40 text-emerald-400 text-[11px] sm:text-xs font-medium px-3 py-1 rounded-full mb-4 sm:mb-6">
          {grants.length} active grants tracked for Texas
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4 sm:mb-6">
          Your center is leaving
          <br />
          <span className="text-emerald-400">$50,000+</span> on the table.
        </h1>
        <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed">
          Most Texas childcare directors miss thousands in grants because the
          application process is overwhelming. GrantReady finds your grants,
          tracks deadlines, and drafts applications with AI.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            href="/dashboard"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl text-base sm:text-lg font-medium transition shadow-lg shadow-emerald-900/30 text-center"
          >
            See Your Grants
          </Link>
          <a
            href="#how-it-works"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 px-8 py-3.5 rounded-xl text-base sm:text-lg transition text-center"
          >
            How It Works
          </a>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mt-4">
          Free to browse. 14-day trial for AI applications.
        </p>
      </section>

      {/* Stats — 2x2 grid on mobile */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-10 sm:pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { stat: "$50K+", label: "Avg. unclaimed per center" },
            { stat: "16", label: "Grant programs tracked" },
            { stat: "87%", label: "Less time on applications" },
            { stat: "12K+", label: "TX centers eligible" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5 text-center"
            >
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-400 mb-0.5">
                {item.stat}
              </div>
              <div className="text-[11px] sm:text-xs text-gray-400 leading-tight">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pain points — single column on mobile */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
          Sound familiar?
        </h2>
        <p className="text-gray-400 text-center mb-8 text-sm sm:text-base">
          Every childcare director we talk to says the same things.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            {
              quote:
                "I know there are grants out there, but I don't know where to start.",
              pain: "Discovery",
            },
            {
              quote:
                "I spent 30 hours on one CCDF application and I'm still not sure I did it right.",
              pain: "Time",
            },
            {
              quote:
                "I missed the deadline by two days. Nobody reminded me.",
              pain: "Deadlines",
            },
            {
              quote:
                "Every grant wants the same info in a different format.",
              pain: "Repetition",
            },
          ].map((item) => (
            <div
              key={item.pain}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6"
            >
              <p className="text-gray-300 italic text-sm sm:text-base mb-3 leading-relaxed">
                &ldquo;{item.quote}&rdquo;
              </p>
              <span className="text-[11px] bg-red-900/40 text-red-400 px-2 py-1 rounded-full">
                {item.pain} problem
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — stacked on mobile */}
      <section
        id="how-it-works"
        className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
          GrantReady solves all of them.
        </h2>
        <p className="text-gray-400 text-center mb-8 sm:mb-12 text-sm sm:text-base max-w-xl mx-auto">
          Three steps. From &ldquo;I don&apos;t know where to start&rdquo; to
          &ldquo;application submitted.&rdquo;
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              step: "1",
              title: "We Find & Match",
              desc: "Tell us about your center once. We match you to every grant you qualify for, sorted by value and deadline.",
              emoji: "🔍",
            },
            {
              step: "2",
              title: "AI Drafts It",
              desc: "GrantReady pulls your data, drafts narratives, fills budgets, and formats everything to each grant's requirements.",
              emoji: "✍️",
            },
            {
              step: "3",
              title: "Review & Submit",
              desc: "Edit the draft, download, and submit. We track your status and remind you about deadlines when you win.",
              emoji: "🏆",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 sm:p-6"
            >
              <div className="flex sm:flex-col items-start sm:items-center gap-4 sm:gap-0 sm:text-center">
                <div className="text-3xl sm:mb-3">{item.emoji}</div>
                <div>
                  <div className="text-[11px] text-emerald-400 font-medium mb-1">
                    Step {item.step}
                  </div>
                  <h3 className="text-base font-semibold mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Grant database by tier */}
      <section id="grants" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
          {grants.length} Grants We Track
        </h2>
        <p className="text-gray-400 text-center mb-8 sm:mb-12 text-sm sm:text-base max-w-2xl mx-auto">
          Organized by impact. Start with the essentials — they&apos;re the
          biggest money and easiest to get.
        </p>

        {tiers.map((tier) => {
          const tierGrants = grants.filter((g) => g.tier === tier);
          return (
            <div key={tier} className="mb-8 sm:mb-12">
              {/* Tier header */}
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`text-[11px] sm:text-xs font-medium px-2.5 py-1 rounded-full border ${tierBadgeColors[tier]}`}
                >
                  {tierLabels[tier]}
                </span>
                <span className="text-[11px] text-gray-500">
                  {tierGrants.length} programs
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
                {tierDescriptions[tier]}
              </p>

              {/* Grant cards */}
              <div className="grid gap-2.5">
                {tierGrants.map((grant) => (
                  <div
                    key={grant.id}
                    className={`bg-gray-900/80 border rounded-xl p-4 sm:p-5 transition ${tierCardColors[tier]}`}
                  >
                    {/* Mobile: stacked layout */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm sm:text-base font-semibold text-white leading-snug">
                        {grant.name}
                      </h3>
                      <div className="text-emerald-400 font-bold text-sm sm:text-base whitespace-nowrap">
                        {grant.amount}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-2.5 leading-relaxed">
                      {grant.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {grant.recurring && (
                        <span className="text-[10px] bg-blue-900/50 text-blue-400 px-1.5 py-0.5 rounded">
                          Recurring
                        </span>
                      )}
                      <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                        {grant.difficulty}
                      </span>
                      <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                        {grant.source}
                      </span>
                      <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                        {grant.deadline}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="text-center mt-6">
          <Link
            href="/dashboard"
            className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-medium transition shadow-lg shadow-emerald-900/30 text-sm sm:text-base"
          >
            See Which Grants You Qualify For
          </Link>
        </div>
      </section>

      {/* ROI section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">
            The Math Is Simple
          </h2>
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6">
            <div className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-2 bg-gray-800/50 sm:bg-transparent rounded-xl p-4 sm:p-0">
              <div className="text-2xl sm:text-3xl font-bold text-red-400">
                $0
              </div>
              <div className="text-xs sm:text-sm text-gray-400 leading-tight">
                What most centers claim because the process is too hard
              </div>
            </div>
            <div className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-2 bg-gray-800/50 sm:bg-transparent rounded-xl p-4 sm:p-0">
              <div className="text-2xl sm:text-3xl font-bold text-amber-400 whitespace-nowrap">
                $2,388/yr
              </div>
              <div className="text-xs sm:text-sm text-gray-400 leading-tight">
                GrantReady costs per year
              </div>
            </div>
            <div className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-2 bg-gray-800/50 sm:bg-transparent rounded-xl p-4 sm:p-0">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400">
                $50K+
              </div>
              <div className="text-xs sm:text-sm text-gray-400 leading-tight">
                Potential annual funding from CACFP + Rising Star + one grant
              </div>
            </div>
          </div>
          <div className="text-center mt-6 sm:mt-8 pt-6 border-t border-gray-800">
            <p className="text-emerald-400 font-semibold text-base sm:text-lg">
              20x+ return on investment
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Even one $10K grant pays for 4+ years of GrantReady
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
          Simple Pricing
        </h2>
        <p className="text-gray-400 text-center mb-8 text-sm sm:text-base">
          One plan. Everything included. Cancel anytime.
        </p>
        <div className="max-w-md mx-auto bg-gray-900 border-2 border-emerald-800 rounded-2xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="text-4xl sm:text-5xl font-bold">
              $199
              <span className="text-base sm:text-lg text-gray-400 font-normal">
                /mo
              </span>
            </div>
            <div className="text-sm text-gray-400 mt-2">
              14-day free trial. No credit card required.
            </div>
          </div>
          <ul className="space-y-3 mb-8">
            {[
              "All 16 Texas grant programs tracked",
              "Personalized grant matching",
              "Deadline alerts via email",
              "AI-drafted narratives & budgets",
              "Auto-filled applications",
              "Status tracking & reporting reminders",
              "Unlimited applications",
            ].map((feature) => (
              <li key={feature} className="flex gap-3 text-sm text-gray-300">
                <CheckIcon />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard"
            className="block w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-medium transition text-base"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 leading-snug">
          Every month without GrantReady is money your center doesn&apos;t get
          back.
        </h2>
        <p className="text-gray-400 mb-6 sm:mb-8 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          The grants exist. The money is allocated. Your center qualifies. The
          only thing in the way is the application — and that&apos;s what we
          automate.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl text-base sm:text-lg font-medium transition shadow-lg shadow-emerald-900/30"
        >
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-4 sm:px-6 py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-500">
        <span className="text-emerald-400 font-semibold">GrantReady</span>{" "}
        &copy; {new Date().getFullYear()}. Helping Texas childcare directors win
        the funding they deserve.
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur-md border-t border-gray-800 p-3 sm:hidden z-50">
        <Link
          href="/dashboard"
          className="block w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-medium transition text-sm"
        >
          See Your Grants — Free
        </Link>
      </div>
    </div>
  );
}
