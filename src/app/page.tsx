import Link from "next/link";
import { grants } from "@/lib/grants";
import GrantExplorer from "./grant-explorer";

export default function Home() {
  return (
    <div className="min-h-screen pb-16 sm:pb-0">
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

      {/* Hero — simple, confident */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/80 to-warm-50" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-16 sm:pt-28 pb-16 sm:pb-24">
          <h1 className="text-[32px] sm:text-5xl font-extrabold leading-[1.1] mb-5 text-warm-900 tracking-tight">
            Grant applications for Texas childcare centers, handled.
          </h1>
          <p className="text-base sm:text-[19px] text-warm-500 max-w-xl mb-8 leading-relaxed">
            We track {grants.length} funding programs, match them to your center,
            and use AI to draft the full application. What takes 30 hours
            by hand takes an afternoon with GrantReady.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard"
              className="bg-brand-600 hover:bg-brand-700 text-white px-7 py-3.5 rounded-xl text-base font-semibold transition shadow-md shadow-brand-600/20 text-center"
            >
              Browse grants
            </Link>
            <a
              href="#pricing"
              className="text-warm-600 hover:text-warm-800 px-7 py-3.5 rounded-xl text-base font-medium transition text-center"
            >
              $199/mo &middot; 14-day trial
            </a>
          </div>
        </div>
      </section>

      {/* What directors actually deal with — prose, not bullet points */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <h2 className="text-xl sm:text-2xl font-bold text-warm-900 mb-4">
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
          <p className="text-warm-800 font-medium">
            GrantReady stores your center&apos;s information once and
            reshapes it for each application automatically. You review, edit,
            and submit. That&apos;s it.
          </p>
        </div>
      </section>

      {/* What you get — not "how it works 01 02 03", just clear statements */}
      <section className="border-y border-warm-200/60 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <h2 className="text-xl sm:text-2xl font-bold text-warm-900 mb-8">
            What GrantReady does for you
          </h2>
          <div className="space-y-6">
            {[
              {
                title: "Finds every program you qualify for",
                text: "We maintain a database of federal, state, and private childcare grants in Texas. You tell us about your center — size, location, accreditations — and we show you what fits.",
              },
              {
                title: "Drafts the full application",
                text: "Select a grant. GrantReady pulls your stored profile, writes the narrative sections, fills the budget template, and formats everything to that program's requirements. You get a draft to review, not a blank page to stare at.",
              },
              {
                title: "Tracks every deadline",
                text: "CCDF opens in March. CACFP is rolling. Your local Workforce Board has its own timeline. We keep track so you don't have to set calendar reminders that you'll snooze anyway.",
              },
              {
                title: "Handles the aftermath too",
                text: "Won a grant? We'll remind you when quarterly reports are due so you stay compliant and eligible for renewal.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="border-l-2 border-brand-500 pl-5"
              >
                <h3 className="text-base font-semibold text-warm-900 mb-1">
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

      {/* Pricing — straightforward, no "one plan no surprises" filler */}
      <section id="pricing" className="border-y border-warm-200/60 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="max-w-lg">
            <h2 className="text-xl sm:text-2xl font-bold text-warm-900 mb-6">
              $199 per month
            </h2>
            <p className="text-sm text-warm-500 mb-6 leading-relaxed">
              Includes grant matching, AI-drafted applications, deadline
              tracking, and post-award reporting reminders. Unlimited
              applications. 14-day free trial. Cancel anytime. One $10K grant
              covers over four years of the subscription.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-brand-600 hover:bg-brand-700 text-white px-7 py-3.5 rounded-xl font-semibold transition shadow-md shadow-brand-600/20 text-sm"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer — minimal */}
      <footer className="px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-warm-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">G</span>
            </div>
            <span className="font-medium text-warm-600">GrantReady</span>
          </div>
          <span>&copy; {new Date().getFullYear()} GrantReady</span>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-warm-200 p-3 sm:hidden z-50">
        <Link
          href="/dashboard"
          className="block w-full text-center bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-semibold transition shadow-md shadow-brand-600/20 text-sm"
        >
          Browse grants
        </Link>
      </div>
    </div>
  );
}
