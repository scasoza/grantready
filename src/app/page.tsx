import Link from "next/link";
import {
  grants,
  tierLabels,
  tierDescriptions,
  type GrantTier,
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
            <p className="text-brand-700 font-semibold text-sm mb-4 tracking-wide">
              FOR TEXAS CHILDCARE DIRECTORS
            </p>
            <h1 className="text-3xl sm:text-[44px] font-extrabold leading-[1.15] mb-5 text-warm-900 tracking-tight">
              You qualify for grants.
              <br />
              <span className="text-brand-600">
                We handle the paperwork.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-warm-500 max-w-lg mx-auto mb-8 leading-relaxed">
              GrantReady matches your center to every grant you&apos;re eligible
              for, then uses AI to draft your applications in hours, not weeks.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard"
                className="bg-brand-600 hover:bg-brand-700 text-white px-7 py-3.5 rounded-xl text-base font-semibold transition shadow-md shadow-brand-600/20 text-center"
              >
                Browse Texas Grants
              </Link>
              <a
                href="#how-it-works"
                className="text-warm-600 hover:text-warm-800 px-7 py-3.5 rounded-xl text-base font-medium transition text-center"
              >
                Learn more &darr;
              </a>
            </div>
          </div>

          {/* Trust bar */}
          <div className="mt-12 sm:mt-16 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-warm-400">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-brand-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              14-day free trial
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-brand-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-brand-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              {grants.length} grants tracked
            </span>
          </div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid sm:grid-cols-2 gap-8 sm:gap-12 items-start">
          {/* Problem side */}
          <div>
            <p className="text-red-500 font-semibold text-xs uppercase tracking-widest mb-3">
              The problem
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-4 leading-snug">
              Texas childcare centers leave $50K+ in funding unclaimed every year.
            </h2>
            <div className="space-y-3">
              {[
                "Each grant has different requirements, deadlines, and portals",
                "A single application takes 20–30 hours of a director's time",
                "Most directors don't know which grants they qualify for",
                "Missed deadlines mean waiting another full year",
              ].map((item) => (
                <div key={item} className="flex gap-3 items-start">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  <p className="text-sm text-warm-600 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Solution side */}
          <div className="bg-brand-50 rounded-2xl p-6 sm:p-8 border border-brand-100">
            <p className="text-brand-700 font-semibold text-xs uppercase tracking-widest mb-3">
              The solution
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-4 leading-snug">
              GrantReady does the hard part for you.
            </h2>
            <div className="space-y-3">
              {[
                "Curated database of every childcare grant in Texas",
                "AI drafts your application in 4 hours, not 30",
                "Deadline alerts so you never miss a window",
                "One profile, auto-filled across every application",
              ].map((item) => (
                <div key={item} className="flex gap-3 items-start">
                  <svg className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  <p className="text-sm text-warm-700 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="bg-white border-y border-warm-200/60"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <p className="text-brand-700 font-semibold text-xs uppercase tracking-widest mb-3 text-center">
            How it works
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-warm-900 mb-10 sm:mb-14">
            From &ldquo;where do I start?&rdquo; to &ldquo;submitted&rdquo;
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-10">
            {[
              {
                num: "01",
                title: "Tell us about your center",
                desc: "Location, enrollment, accreditations, children served. Enter it once — we remember it for every application.",
              },
              {
                num: "02",
                title: "We match and draft",
                desc: "See every grant you qualify for. Pick one, and our AI drafts the full application — narratives, budgets, and all.",
              },
              {
                num: "03",
                title: "Review and submit",
                desc: "Edit anything you like, download the finished application, and submit. We'll remind you about deadlines and reporting.",
              },
            ].map((step) => (
              <div key={step.num}>
                <div className="text-brand-600/30 text-5xl sm:text-6xl font-black mb-2">
                  {step.num}
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-warm-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-warm-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grant database */}
      <section id="grants" className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-brand-700 font-semibold text-xs uppercase tracking-widest mb-3">
            Grant database
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-3">
            {grants.length} programs. One dashboard.
          </h2>
          <p className="text-warm-500 max-w-lg mx-auto text-sm sm:text-base">
            We track government programs and private foundations so you
            don&apos;t have to.
          </p>
        </div>

        {tiers.map((tier) => {
          const tierGrants = grants.filter((g) => g.tier === tier);
          return (
            <div key={tier} className="mb-8 sm:mb-10">
              <div className="flex items-center gap-2.5 mb-1">
                <span className={`w-2.5 h-2.5 rounded-full ${tierDot[tier]}`} />
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
            Check Your Eligibility
          </Link>
        </div>
      </section>

      {/* ROI */}
      <section className="bg-warm-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <p className="text-brand-400 font-semibold text-xs uppercase tracking-widest mb-3 text-center">
            Return on investment
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-14">
            One grant pays for years of GrantReady
          </h2>
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center max-w-2xl mx-auto">
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-red-400 mb-1">$0</div>
              <div className="text-xs sm:text-sm text-warm-400 leading-tight">
                Claimed by most centers today
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-warm-300 mb-1">$199</div>
              <div className="text-xs sm:text-sm text-warm-400 leading-tight">
                GrantReady per month
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-brand-400 mb-1">$50K+</div>
              <div className="text-xs sm:text-sm text-warm-400 leading-tight">
                Potential annual funding
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <p className="text-brand-700 font-semibold text-xs uppercase tracking-widest mb-3">
              Pricing
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-warm-900">
              One plan. No surprises.
            </h2>
          </div>
          <div className="bg-white rounded-2xl border-2 border-warm-200 shadow-lg p-6 sm:p-8">
            <div className="flex items-baseline gap-1 justify-center mb-1">
              <span className="text-4xl sm:text-5xl font-extrabold text-warm-900">
                $199
              </span>
              <span className="text-warm-400 text-base">/month</span>
            </div>
            <p className="text-warm-400 text-sm text-center mb-6">
              14-day free trial &middot; Cancel anytime
            </p>
            <div className="space-y-3 mb-8">
              {[
                "All 16 Texas grant programs",
                "Personalized eligibility matching",
                "AI-drafted narratives & budgets",
                "Auto-filled applications",
                "Deadline alerts via email",
                "Post-award reporting reminders",
                "Unlimited applications",
              ].map((f) => (
                <div key={f} className="flex gap-3 items-start">
                  <svg className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  <span className="text-sm text-warm-700">{f}</span>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard"
              className="block w-full text-center bg-brand-600 hover:bg-brand-700 text-white py-3.5 rounded-xl font-semibold transition shadow-md shadow-brand-600/20"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Your center qualifies for funding.
            <br />
            Let&apos;s go get it.
          </h2>
          <p className="text-brand-100 mb-8 text-sm sm:text-base max-w-md mx-auto">
            The grants are out there. The money is allocated. All that&apos;s
            left is the application — and we&apos;ll handle that.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-white text-brand-700 px-7 py-3.5 rounded-xl font-semibold transition hover:bg-brand-50 shadow-lg text-sm sm:text-base"
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
            &copy; {new Date().getFullYear()} GrantReady. Built for Texas
            childcare directors.
          </span>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-warm-200 p-3 sm:hidden z-50">
        <Link
          href="/dashboard"
          className="block w-full text-center bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-semibold transition shadow-md shadow-brand-600/20 text-sm"
        >
          Browse Texas Grants — Free
        </Link>
      </div>
    </div>
  );
}
