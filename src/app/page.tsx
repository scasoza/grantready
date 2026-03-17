import Link from "next/link";
import { grants } from "@/lib/grants";
import GrantExplorer from "./grant-explorer";

export default function Home() {
  return (
    <div className="min-h-screen pb-16 sm:pb-0">
      {/* Nav */}
      <nav className="sticky top-0 z-40 glass border-b border-warm-200/40 shadow-sm shadow-warm-900/[0.03]">
        <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between max-w-5xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-md shadow-brand-600/25">
              <span className="text-white font-extrabold text-sm">G</span>
            </div>
            <span className="text-lg font-bold text-warm-900 tracking-tight">
              GrantReady
            </span>
          </Link>
          <div className="flex gap-4 items-center">
            <a
              href="#grants"
              className="text-sm text-warm-500 hover:text-warm-800 hidden sm:inline transition font-medium"
            >
              Grants
            </a>
            <a
              href="#pricing"
              className="text-sm text-warm-500 hover:text-warm-800 hidden sm:inline transition font-medium"
            >
              Pricing
            </a>
            <Link
              href="/login"
              className="text-sm bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white px-5 py-2.5 rounded-xl transition font-semibold shadow-md shadow-brand-600/25"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-32 pb-20 sm:pb-28">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 bg-brand-100/80 text-brand-800 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6 border border-brand-200/60">
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
              {grants.filter((g) => g.status === "open").length} grants open now
            </div>
          </div>
          <h1 className="text-[36px] sm:text-6xl font-extrabold leading-[1.08] mb-6 text-warm-900 tracking-tight animate-fade-up animate-delay-100">
            Stop leaving grant money
            <br />
            <span className="bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
              on the table.
            </span>
          </h1>
          <p className="text-base sm:text-xl text-warm-500 max-w-2xl mb-10 leading-relaxed animate-fade-up animate-delay-200">
            We track {grants.length} funding programs for Texas childcare centers,
            match them to your center, and use AI to draft the full application.
            What takes 30 hours by hand takes an afternoon.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 animate-fade-up animate-delay-300">
            <Link
              href="/login"
              className="bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white px-8 py-4 rounded-2xl text-base font-semibold transition shadow-lg shadow-brand-600/25 text-center"
            >
              Browse grants for free
            </Link>
            <a
              href="#pricing"
              className="text-warm-600 hover:text-warm-800 px-8 py-4 rounded-2xl text-base font-medium transition text-center border border-warm-200 hover:border-warm-300 bg-white/60 hover:bg-white"
            >
              $199/mo &middot; 14-day trial
            </a>
          </div>

          {/* Social proof stats */}
          <div className="mt-14 sm:mt-20 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg">
            {[
              { value: `${grants.length}`, label: "Grants tracked" },
              { value: `$${Math.round(grants.filter(g => g.recurring).length * 8)}K+`, label: "Avg. annual funding" },
              { value: `${grants.filter(g => g.difficulty === "Easy").length}`, label: "Easy to apply" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-extrabold text-warm-900 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-warm-400 mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem / narrative */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-warm-900 mb-5 tracking-tight">
          You already know the money is out there.
        </h2>
        <div className="text-[15px] sm:text-base text-warm-600 space-y-4 leading-relaxed">
          <p>
            CACFP can reimburse $30,000 to $60,000 a year for a center with
            60 kids. Texas Rising Star pays enhanced rates. Pre-K Partnership
            grants go up to $25,000. There are {grants.length} programs like
            these in Texas alone.
          </p>
          <p>
            But every one of them has its own portal, its own format, its own
            deadline. You pull the same enrollment numbers from Procare, the
            same financials from QuickBooks, the same narrative about why your
            center matters — and reformat them every single time.
          </p>
          <p className="text-warm-900 font-semibold text-base sm:text-lg border-l-4 border-brand-500 pl-5 py-1">
            GrantReady stores your center&apos;s information once and
            reshapes it for each application automatically.
          </p>
        </div>
      </section>

      {/* Value props — cards */}
      <section className="bg-white border-y border-warm-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-warm-900 mb-3 tracking-tight">
            What GrantReady does for you
          </h2>
          <p className="text-sm sm:text-base text-warm-400 mb-10 max-w-xl">
            From discovery to compliance — the full grant lifecycle handled.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                ),
                title: "Finds every program you qualify for",
                text: "We maintain a database of federal, state, and private childcare grants in Texas. Tell us about your center and we show you what fits.",
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                ),
                title: "Drafts the full application",
                text: "Select a grant. GrantReady writes the narrative, fills the budget template, and formats everything. You review, not write from scratch.",
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                ),
                title: "Tracks every deadline",
                text: "CCDF opens in March. CACFP is rolling. Your local Workforce Board has its own timeline. We keep track so you don't miss a window.",
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                ),
                title: "Handles the aftermath too",
                text: "Won a grant? We remind you when quarterly reports are due so you stay compliant and eligible for renewal.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-warm-50/80 border border-warm-200/60 rounded-2xl p-6 hover:border-brand-200 hover:bg-brand-50/30 transition group"
              >
                <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-500 group-hover:text-white transition">
                  {item.icon}
                </div>
                <h3 className="text-base font-bold text-warm-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-warm-500 leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grant database — the real product preview */}
      <GrantExplorer />

      {/* Pricing */}
      <section id="pricing" className="bg-white border-y border-warm-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-xl mx-auto text-center sm:text-left sm:mx-0">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-warm-900 mb-2 tracking-tight">
              One plan. No surprises.
            </h2>
            <p className="text-sm text-warm-400 mb-8">
              One $10K grant covers over four years of the subscription.
            </p>
          </div>
          <div className="max-w-md bg-gradient-to-br from-warm-50 to-brand-50/40 border border-warm-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-extrabold text-warm-900 tracking-tight">$199</span>
              <span className="text-warm-400 text-sm font-medium">/month</span>
            </div>
            <p className="text-xs text-brand-600 font-semibold mb-6">14-day free trial &middot; Cancel anytime</p>
            <ul className="space-y-3 mb-8">
              {[
                "Grant matching for your center profile",
                "AI-drafted applications",
                "Deadline tracking & reminders",
                "Post-award reporting reminders",
                "Unlimited applications",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-warm-700">
                  <svg className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className="block text-center bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white px-7 py-3.5 rounded-xl font-semibold transition shadow-lg shadow-brand-600/20 text-sm"
            >
              Start free trial
            </Link>
            <p className="text-[11px] text-warm-400 text-center mt-3">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">G</span>
            </div>
            <span className="font-semibold text-warm-700 text-sm">GrantReady</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-warm-400">
            <a href="#grants" className="hover:text-warm-600 transition">Grants</a>
            <a href="#pricing" className="hover:text-warm-600 transition">Pricing</a>
            <span>&copy; {new Date().getFullYear()} GrantReady</span>
          </div>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-warm-200 p-3 sm:hidden z-50">
        <Link
          href="/login"
          className="block w-full text-center bg-gradient-to-b from-brand-500 to-brand-600 text-white py-3 rounded-xl font-semibold transition shadow-lg shadow-brand-600/25 text-sm"
        >
          Browse grants
        </Link>
      </div>
    </div>
  );
}
