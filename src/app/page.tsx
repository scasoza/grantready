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

function DollarIcon() {
  return (
    <svg
      className="w-5 h-5 text-emerald-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className="w-5 h-5 text-amber-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg
      className="w-5 h-5 text-blue-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

const tiers: GrantTier[] = ["essential", "growth", "staff", "foundation"];

const tierColors: Record<GrantTier, string> = {
  essential: "border-emerald-700 bg-emerald-950/30",
  growth: "border-blue-700 bg-blue-950/30",
  staff: "border-purple-700 bg-purple-950/30",
  foundation: "border-amber-700 bg-amber-950/30",
};

const tierBadgeColors: Record<GrantTier, string> = {
  essential: "bg-emerald-900/60 text-emerald-400",
  growth: "bg-blue-900/60 text-blue-400",
  staff: "bg-purple-900/60 text-purple-400",
  foundation: "bg-amber-900/60 text-amber-400",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <span className="text-xl font-bold text-emerald-400">GrantReady</span>
        <div className="flex gap-4 items-center">
          <a href="#grants" className="text-sm text-gray-400 hover:text-white hidden sm:inline">
            Grants
          </a>
          <a href="#pricing" className="text-sm text-gray-400 hover:text-white hidden sm:inline">
            Pricing
          </a>
          <Link
            href="/dashboard"
            className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block bg-emerald-900/40 text-emerald-400 text-xs font-medium px-3 py-1 rounded-full mb-6">
          {grants.length} active grants tracked for Texas
        </div>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
          Your center is leaving
          <br />
          <span className="text-emerald-400">$50,000+ on the table</span>
          <br />
          every year.
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
          Most Texas childcare directors don&apos;t know about CACFP, Rising Star
          incentives, or Pre-K Partnership grants — or find the 30-hour
          application process too overwhelming. GrantReady finds your grants,
          tracks deadlines, and drafts applications with AI.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/dashboard"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg text-lg font-medium transition shadow-lg shadow-emerald-900/30"
          >
            See Your Grants
          </Link>
          <a
            href="#how-it-works"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 px-8 py-3 rounded-lg text-lg transition"
          >
            How It Works
          </a>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Free to browse. 14-day trial for AI applications.
        </p>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { stat: "$50K+", label: "Avg. funding left unclaimed per center" },
            { stat: "16", label: "Grant programs tracked" },
            { stat: "87%", label: "Less time on applications" },
            { stat: "12,000+", label: "TX centers eligible" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center"
            >
              <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1">
                {item.stat}
              </div>
              <div className="text-xs text-gray-400">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pain points */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">
          Sound familiar?
        </h2>
        <p className="text-gray-400 text-center mb-10 max-w-xl mx-auto">
          Every childcare director we talk to says the same things.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              quote:
                "I know there are grants out there, but I don't even know where to start looking.",
              pain: "Discovery",
            },
            {
              quote:
                "I spent 30 hours on a CCDF application last month and I'm still not sure I did it right.",
              pain: "Time",
            },
            {
              quote:
                "I missed the deadline by two days because nobody reminded me.",
              pain: "Deadlines",
            },
            {
              quote:
                "Every grant wants the same info in a different format. I keep re-entering our enrollment numbers.",
              pain: "Repetition",
            },
          ].map((item) => (
            <div
              key={item.pain}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6"
            >
              <p className="text-gray-300 italic mb-3">
                &ldquo;{item.quote}&rdquo;
              </p>
              <span className="text-xs bg-red-900/40 text-red-400 px-2 py-1 rounded-full">
                {item.pain} problem
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">
          GrantReady solves all of them.
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          Three steps. From &ldquo;I don&apos;t know where to start&rdquo; to
          &ldquo;application submitted.&rdquo;
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "We Find & Match",
              desc: "Tell us about your center once — location, size, accreditations, children served. We instantly show every grant you qualify for, sorted by value and deadline.",
              icon: <DollarIcon />,
            },
            {
              step: "2",
              title: "AI Drafts It",
              desc: "Select a grant. GrantReady pulls your stored data, drafts narrative sections, fills budget templates, and formats everything to that grant's specific requirements.",
              icon: <ClockIcon />,
            },
            {
              step: "3",
              title: "You Review & Submit",
              desc: "Edit the AI draft, download the finished application, and submit. We track your status and remind you about reporting deadlines when you win.",
              icon: <RepeatIcon />,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center"
            >
              <div className="w-12 h-12 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Grant database by tier */}
      <section id="grants" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">
          {grants.length} Grants We Track in Texas
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Organized by impact. Start with the essentials — they&apos;re the
          biggest money and easiest to get.
        </p>
        {tiers.map((tier) => {
          const tierGrants = grants.filter((g) => g.tier === tier);
          return (
            <div key={tier} className="mb-12">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${tierBadgeColors[tier]}`}
                >
                  {tierLabels[tier]}
                </span>
                <span className="text-xs text-gray-500">
                  {tierGrants.length} programs
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                {tierDescriptions[tier]}
              </p>
              <div className="grid gap-3">
                {tierGrants.map((grant) => (
                  <div
                    key={grant.id}
                    className={`border rounded-xl p-5 transition hover:brightness-110 ${tierColors[tier]}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-base font-semibold text-white">
                            {grant.name}
                          </h3>
                          {grant.recurring && (
                            <span className="text-[10px] bg-blue-900/50 text-blue-400 px-1.5 py-0.5 rounded">
                              Recurring
                            </span>
                          )}
                          <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                            {grant.difficulty}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">
                          {grant.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                          <span className="bg-gray-800/80 text-gray-300 px-2 py-0.5 rounded">
                            {grant.source}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-emerald-400 font-bold">
                          {grant.amount}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1">
                          {grant.deadline}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-medium transition shadow-lg shadow-emerald-900/30"
          >
            See Which Grants You Qualify For
          </Link>
        </div>
      </section>

      {/* ROI calculator */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl font-bold text-center mb-8">
            The Math Is Simple
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-red-400 mb-2">
                $0
              </div>
              <div className="text-sm text-gray-400">
                What most centers claim in grants because the process is too hard
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-400 mb-2">
                $2,388
              </div>
              <div className="text-sm text-gray-400">
                GrantReady costs per year ($199/mo)
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400 mb-2">
                $50,000+
              </div>
              <div className="text-sm text-gray-400">
                Potential annual funding from CACFP + Rising Star + one grant
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            <p className="text-emerald-400 font-semibold text-lg">
              20x+ return on investment
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Even one $10K grant pays for 4+ years of GrantReady
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
        <p className="text-gray-400 text-center mb-10">
          One plan. Everything included. Cancel anytime.
        </p>
        <div className="max-w-md mx-auto bg-gray-900 border border-emerald-800 rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="text-4xl font-bold">
              $199
              <span className="text-lg text-gray-400 font-normal">/month</span>
            </div>
            <div className="text-sm text-gray-400 mt-1">
              14-day free trial. No credit card required.
            </div>
          </div>
          <ul className="space-y-3 mb-8">
            {[
              "All 16 Texas grant programs tracked & matched",
              "Deadline alerts — never miss a window again",
              "AI-drafted narratives tailored to each grant",
              "Auto-filled budgets from your center profile",
              "Application status tracking",
              "Post-award reporting reminders",
              "Unlimited applications",
            ].map((feature) => (
              <li key={feature} className="flex gap-3 text-sm text-gray-300">
                <CheckIcon />
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard"
            className="block w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-medium transition"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Every month without GrantReady
          <br />
          is money your center doesn&apos;t get back.
        </h2>
        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
          The grants exist. The money is allocated. Your center qualifies. The
          only thing standing between you and that funding is the application
          process — and that&apos;s exactly what we automate.
        </p>
        <Link
          href="/dashboard"
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg text-lg font-medium transition shadow-lg shadow-emerald-900/30"
        >
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8 text-center text-sm text-gray-500">
        <span className="text-emerald-400 font-semibold">GrantReady</span>{" "}
        &copy; {new Date().getFullYear()}. Helping Texas childcare directors win
        the funding they deserve.
      </footer>
    </div>
  );
}
