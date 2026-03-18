"use client";

import Link from "next/link";
import { useState } from "react";

type CheckoutResponse = {
  url?: string;
  error?: string;
};

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
    <div className="min-h-screen bg-warm-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-warm-600 hover:text-warm-900 transition"
        >
          <span aria-hidden="true">←</span>
          Back to home
        </Link>

        <div className="mt-8 min-h-[72vh] flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-warm-200 bg-white p-6 sm:p-8 shadow-md">
            <p className="text-sm font-semibold text-brand-700">Single plan</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-warm-900">
              GrantReady Pro
            </h1>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight text-warm-900">$199</span>
              <span className="text-sm font-medium text-warm-500">/month</span>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-warm-700">
              {[
                "AI-powered grant narrative drafting",
                "Voice memo input — talk, don't type",
                "Claim-level fact verification",
                "Cross-section coherence check",
                "Budget builder with examples",
                "Unlimited applications",
                "14-day free trial",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-gradient-to-r from-brand-500 to-brand-600" />
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
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition hover:from-brand-600 hover:to-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Redirecting to checkout..." : "Start Free Trial"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
