import Link from "next/link";
import {
  grants,
  tierLabels,
  tierDescriptions,
  type GrantTier,
} from "@/lib/grants";
import { FundingEstimator } from "./FundingEstimator";

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

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-warm-200/60">
        <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between max-w-5xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-lg font-bold text-warm-900">GrantReady</span>
          </Link>
          <div className="flex gap-3 items-center">
            <a
              href="#pricing"
              className="text-sm text-warm-500 hover:text-warm-800 hidden sm:inline transition"
            >
              Pricing
            </a>
            <Link
              href="/dashboard"
              className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition font-medium shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50 to-white" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-20">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl sm:text-[44px] font-extrabold leading-[1.15] mb-5 text-warm-900 tracking-tight">
              You didn&apos;t become a director
              <br />
              to write grant applications.
            </h1>
            <p className="text-base sm:text-lg text-warm-500 max-w-lg mx-auto mb-8 leading-relaxed">
              You did it because you care about kids. So let us handle the
              CACFP paperwork, the CCDF narratives, and the Rising Star
              applications — while you run your center.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard"
                className="bg-brand-600 hover:bg-brand-700 text-white px-7 py-3.5 rounded-xl text-base font-semibold transition shadow-md shadow-brand-600/20 text-center"
              >
                See what you qualify for
              </Link>
              <a
                href="#estimator"
                className="text-warm-600 hover:text-warm-800 px-7 py-3.5 rounded-xl text-base font-medium transition text-center"
              >
                Estimate your funding &darr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Funding estimator — unique interactive element */}
      <FundingEstimator />

      {/* The real talk section — conversational, specific */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-brand-700 font-semibold text-xs uppercase tracking-widest mb-3">
            Let&apos;s be honest
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-6 leading-snug">
            You already know there&apos;s money out there. The problem is the
            process.
          </h2>
          <div className="space-y-5 text-warm-600 text-[15px] leading-relaxed">
            <p>
              Every grant has its own portal. TWC uses one system. USDA uses
              another. The Meadows Foundation wants a letter of inquiry. Your
              local Workforce Board has its own application — due on a
              different date than the state one.
            </p>
            <p>
              And they all want the same information in different formats. Your
              enrollment numbers from Procare. Your financials from QuickBooks.
              Your licensing info. Your staff credentials. Your narrative about
              why your center deserves funding.
            </p>
            <p>
              You&apos;ve written that narrative before. Probably three times.
              It&apos;s sitting in a Word doc somewhere on your desktop.
            </p>
            <p className="text-warm-900 font-medium">
              GrantReady remembers everything — your center profile, your
              numbers, your story — and reshapes it for each application
              automatically. You enter your information once. We use it
              everywhere.
            </p>
          </div>
        </div>
      </section>

      {/* Before / After — visual comparison */}
      <section className="bg-white border-y border-warm-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <p className="text-brand-700 font-semibold text-xs uppercase tracking-widest mb-3 text-center">
            The difference
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-warm-900 mb-10 sm:mb-14">
            Tuesday afternoon, with and without GrantReady
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            {/* Without */}
            <div className="rounded-2xl border-2 border-warm-200 p-5 sm:p-7">
              <p className="text-xs font-semibold text-warm-400 uppercase tracking-widest mb-4">
                Without GrantReady
              </p>
              <ol className="space-y-3 text-sm text-warm-600">
                {[
                  "Google \"texas childcare grants 2026\" for the 4th time this month",
                  "Click through 11 TWC pages to find the right application",
                  "Realize you need your enrollment data — open Procare in another tab",
                  "Start drafting the narrative section in Word",
                  "Get interrupted by a parent at pickup",
                  "Come back. Lose your place. Start over on the budget template",
                  "Give up at 6pm. Promise yourself you'll finish this weekend",
                  "You won't",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-warm-300 font-mono text-xs mt-0.5 w-4 flex-shrink-0">
                      {i + 1}.
                    </span>
                    <span className={i === 7 ? "text-warm-400 italic" : ""}>
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-5 pt-4 border-t border-warm-100 flex justify-between text-xs">
                <span className="text-warm-400">Time spent</span>
                <span className="text-red-500 font-semibold">
                  ~30 hours (if you finish)
                </span>
              </div>
            </div>

            {/* With */}
            <div className="rounded-2xl border-2 border-brand-200 bg-brand-50/50 p-5 sm:p-7">
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-4">
                With GrantReady
              </p>
              <ol className="space-y-3 text-sm text-warm-700">
                {[
                  "Get an email: \"Pre-K Partnership Grant deadline in 3 weeks — you're eligible\"",
                  "Open GrantReady. Your center profile is already filled in",
                  "Click \"Draft Application.\" AI pulls your enrollment, financials, and narrative",
                  "Review the draft over coffee. Fix two sentences. Approve the budget",
                  "Download the formatted PDF. Submit through the TWC portal",
                  "Done before lunch",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-brand-400 font-mono text-xs mt-0.5 w-4 flex-shrink-0">
                      {i + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-5 pt-4 border-t border-brand-200 flex justify-between text-xs">
                <span className="text-warm-400">Time spent</span>
                <span className="text-brand-700 font-semibold">
                  ~4 hours
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grant database */}
      <section
        id="grants"
        className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20"
      >
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-brand-700 font-semibold text-xs uppercase tracking-widest mb-3">
            What we track
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-3">
            {grants.length} funding programs, one place
          </h2>
          <p className="text-warm-500 max-w-lg mx-auto text-sm sm:text-base">
            Government programs and private foundations. We find them, you
            apply.
          </p>
        </div>

        {tiers.map((tier) => {
          const tierGrants = grants.filter((g) => g.tier === tier);
          return (
            <div key={tier} className="mb-8 sm:mb-10">
              <div className="flex items-center gap-2.5 mb-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${tierDot[tier]}`}
                />
                <h3 className="text-sm font-semibold text-warm-800 uppercase tracking-wide">
                  {tierLabels[tier]}
                </h3>
                <span className="text-xs text-warm-400">
                  ({tierGrants.length})
                </span>
              </div>
              <p className="text-xs text-warm-400 mb-3 ml-5">
                {tierDescriptions[tier]}
              </p>
              <div className="space-y-2">
                {tierGrants.map((grant) => (
                  <div
                    key={grant.id}
                    className={`bg-white rounded-xl border border-warm-200/80 border-l-[3px] ${tierAccent[tier]} p-4 sm:p-5 hover:shadow-sm transition`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-sm sm:text-base font-semibold text-warm-900 leading-snug">
                          {grant.name}
                        </h4>
                        <p className="text-xs text-warm-400 mt-0.5">
                          {grant.source} &middot; {grant.deadline}
                          {grant.recurring && (
                            <span className="ml-1.5 text-blue-500 font-medium">
                              &middot; Recurring
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-brand-700 font-bold text-sm whitespace-nowrap">
                        {grant.amount}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="text-center mt-8">
          <Link
            href="/dashboard"
            className="inline-block bg-brand-600 hover:bg-brand-700 text-white px-7 py-3.5 rounded-xl font-semibold transition shadow-md shadow-brand-600/20 text-sm sm:text-base"
          >
            See the full dashboard
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="bg-white border-y border-warm-200/60"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-2">
                $199/month
              </h2>
              <p className="text-warm-400 text-sm">
                14-day trial, no credit card, cancel anytime
              </p>
            </div>
            <div className="space-y-3 mb-8">
              {[
                ["Grant matching", "We tell you exactly which programs your center qualifies for"],
                ["AI applications", "Full draft in hours — narratives, budgets, formatting, all of it"],
                ["Deadline tracking", "Email alerts before every window closes"],
                ["One profile", "Enter your center info once. We auto-fill every application"],
                ["Post-award support", "Reporting reminders when you win, so you stay compliant"],
              ].map(([title, desc]) => (
                <div key={title} className="flex gap-3 items-start">
                  <svg className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  <div>
                    <span className="text-sm font-medium text-warm-800">{title}</span>
                    <p className="text-xs text-warm-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard"
              className="block w-full text-center bg-brand-600 hover:bg-brand-700 text-white py-3.5 rounded-xl font-semibold transition shadow-md shadow-brand-600/20"
            >
              Start Free Trial
            </Link>
            <p className="text-xs text-warm-400 text-center mt-3">
              One $10K grant pays for over 4 years of GrantReady.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-warm-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-snug">
            The funding is there.
            <br />
            The deadline is coming.
            <br />
            <span className="text-brand-400">
              Let&apos;s get your application in.
            </span>
          </h2>
          <Link
            href="/dashboard"
            className="inline-block bg-brand-500 hover:bg-brand-600 text-white px-7 py-3.5 rounded-xl font-semibold transition shadow-lg mt-4 text-sm sm:text-base"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-warm-200/60 px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-warm-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">G</span>
            </div>
            <span className="font-medium text-warm-600">GrantReady</span>
          </div>
          <span>
            &copy; {new Date().getFullYear()} GrantReady
          </span>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-warm-200 p-3 sm:hidden z-50">
        <Link
          href="/dashboard"
          className="block w-full text-center bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-semibold transition shadow-md shadow-brand-600/20 text-sm"
        >
          See what you qualify for
        </Link>
      </div>
    </div>
  );
}
