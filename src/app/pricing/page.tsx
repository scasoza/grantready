"use client";

import Link from "next/link";
import { useState } from "react";

type CheckoutResponse = {
  url?: string;
  error?: string;
};

const freeFeatures = [
  "Funding snapshot with dollar estimate",
  "Full TRS certification dashboard",
  "Staff credential tracker",
  "3 AI document generations per month",
  "Expiration alerts on dashboard",
];

const proFeatures = [
  "Everything in Free, plus:",
  "Unlimited AI document generation",
  "Readiness report — we check your documents match",
  "We submit your TRS application for you",
  "Printable staff credentials binder",
];

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartTrial = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = (await response.json()) as CheckoutResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to start checkout.");
      }

      if (!data.url) {
        throw new Error("Missing checkout URL from server response.");
      }

      window.location.href = data.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start checkout.";
      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-warm-50 text-warm-900">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-warm-200/40 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="text-warm-400 hover:text-warm-600 transition p-2 -m-2" aria-label="Back">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-sm font-bold text-warm-900">Pricing</h1>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-warm-900">Simple, transparent pricing</h2>
          <p className="mt-2 text-sm text-warm-500">Start free. Upgrade when you need more.</p>
        </div>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-xl border border-warm-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight">Free</h1>
            <p className="mt-3 text-4xl font-extrabold tracking-tight">$0</p>

            <ul className="mt-6 space-y-3 text-sm text-warm-600">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/login?mode=signup"
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl border border-warm-200 px-4 py-3 text-sm font-semibold text-warm-900 transition hover:bg-warm-100"
            >
              Get Started Free
            </Link>
          </article>

          <article className="relative rounded-xl bg-brand-800 p-6 shadow-lg sm:p-8 text-white overflow-hidden">
            <div className="absolute top-0 right-0 bg-brand-400 text-brand-900 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">Popular</div>
            <h2 className="text-2xl font-bold tracking-tight">Pro</h2>
            <p className="mt-3 text-4xl font-extrabold tracking-tight">$49<span className="text-lg font-normal text-brand-300">/mo</span></p>
            <p className="mt-2 text-sm text-brand-300">No contracts. Cancel anytime.</p>

            <ul className="mt-6 space-y-3 text-sm text-brand-100">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {errorMessage && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            )}

            <button
              type="button"
              onClick={handleStartTrial}
              disabled={isLoading}
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-white text-brand-800 hover:bg-brand-50 px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Redirecting..." : "Start 14-Day Free Trial"}
            </button>
          </article>
        </section>

        <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-warm-500">
          Free gets you started. Pro takes care of the hard parts so you can focus on your kids.
        </p>
      </div>
    </main>
  );
}
