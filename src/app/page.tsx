"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";

const options = [
  "I run a licensed center",
  "I run a licensed home",
  "I am thinking about opening",
] as const;

const centerTypeByOption: Record<(typeof options)[number], string> = {
  "I run a licensed center": "Licensed center",
  "I run a licensed home": "Licensed home",
  "I am thinking about opening": "Thinking about opening",
};

const documents = [
  "Curriculum Framework",
  "Parent & Family Engagement Policy",
  "Staff Training & Development Plan",
  "Health & Safety Policies",
  "Discipline & Guidance Policy",
  "Nutrition & Meal Policy",
  "Emergency Preparedness Plan",
  "Safe Sleep Policy",
  "CQIP (Quality Improvement Plan)",
  "Weekly Learning Objectives",
  "Staff Credentials Binder",
  "Director Qualifications Summary",
];

export default function Home() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [selected, setSelected] = useState<(typeof options)[number] | "">("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/dashboard");
      } else {
        setChecking(false);
      }
    });
  }, [supabase, router]);

  if (checking) {
    return <div className="min-h-screen bg-warm-50" />;
  }

  const handleGetStarted = () => {
    if (!selected) return;
    localStorage.setItem(
      "grantready_quiz_start",
      JSON.stringify({ centerType: centerTypeByOption[selected] }),
    );
    router.push("/quiz");
  };

  return (
    <div className="min-h-screen bg-warm-50 text-warm-900">
      {/* Nav */}
      <header className="w-full px-4 sm:px-6 py-5 bg-white/80 backdrop-blur-sm border-b border-warm-100">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="inline-flex items-center gap-2.5">
            <Logo size={32} />
            <span className="text-base font-extrabold tracking-tight">CareLadder</span>
          </div>
          <Link href="/login" className="rounded-xl border border-warm-200 bg-white px-4 py-2 text-sm font-semibold text-warm-700 hover:bg-warm-50 transition">
            Log in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-gradient px-4 sm:px-6 pt-12 pb-16 sm:pt-16 sm:pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-warm-900 leading-tight">
              Get TRS certified.<br />
              <span className="text-brand-600">We handle the paperwork.</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-warm-500 max-w-lg mx-auto leading-relaxed">
              CareLadder generates all 12 required TRS documents, tracks your staff credentials, and submits your certification request — so you can focus on your kids, not paperwork.
            </p>

            {/* CTA card */}
            <div className="mt-8 flex justify-center">
              <div className="w-full max-w-sm rounded-2xl bg-white border border-warm-200 p-5 shadow-lg text-left">
                <p className="text-sm font-medium text-warm-700 mb-3">I am a...</p>
                <div className="space-y-2" role="radiogroup" aria-label="Provider type">
                  {options.map((option) => {
                    const isSelected = selected === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setSelected(option)}
                        className={`w-full flex items-center gap-3 rounded-lg px-3.5 py-3 text-left text-sm transition ${
                          isSelected
                            ? "bg-brand-50 ring-2 ring-brand-500"
                            : "bg-warm-50 hover:bg-warm-100"
                        }`}
                      >
                        <span className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                          isSelected ? "border-brand-500 bg-brand-500" : "border-warm-300"
                        }`}>
                          {isSelected && (
                            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className={isSelected ? "font-medium text-warm-900" : "text-warm-600"}>{option}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleGetStarted}
                  disabled={!selected}
                  className="mt-4 w-full rounded-lg bg-brand-600 hover:bg-brand-700 active:bg-brand-800 px-6 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  See how much you could earn →
                </button>
                <p className="mt-2 text-center text-[11px] text-warm-400">Free · 5 min · No account needed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 bg-white border-b border-warm-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-warm-900 mb-3">
            TRS certification is worth $800-1,400+/mo in higher subsidy rates
          </h2>
          <p className="text-center text-sm text-warm-500 max-w-lg mx-auto mb-10">
            But the application process is 40+ hours of paperwork. CareLadder does it in under 4 hours total.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-warm-50 rounded-xl p-5 border border-warm-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700 mb-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <h3 className="font-bold text-warm-900 mb-1">AI writes your documents</h3>
              <p className="text-sm text-warm-500 leading-relaxed">
                Tell us about your center in plain English. Our AI generates professional, TRS-compliant documents in minutes — not hours.
              </p>
            </div>
            <div className="bg-warm-50 rounded-xl p-5 border border-warm-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700 mb-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-bold text-warm-900 mb-1">Step-by-step roadmap</h3>
              <p className="text-sm text-warm-500 leading-relaxed">
                No guessing what comes next. We walk you through every requirement — staff credentials, classroom setup, training hours — with clear instructions.
              </p>
            </div>
            <div className="bg-warm-50 rounded-xl p-5 border border-warm-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700 mb-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </div>
              <h3 className="font-bold text-warm-900 mb-1">We submit for you</h3>
              <p className="text-sm text-warm-500 leading-relaxed">
                When everything is ready, we package your documents and submit the certification request to your local Workforce Board. You don&apos;t have to figure out the portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Documents list — proves domain knowledge */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 bg-warm-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-xl sm:text-2xl font-extrabold text-warm-900 mb-2">
            All 12 required TRS documents, generated for you
          </h2>
          <p className="text-center text-sm text-warm-500 mb-8">
            Each document is tailored to your center&apos;s real data and formatted for TRS assessment.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto">
            {documents.map((doc) => (
              <div key={doc} className="flex items-center gap-2.5 bg-white rounded-lg px-3.5 py-2.5 border border-warm-100">
                <svg className="h-4 w-4 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-warm-700">{doc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 bg-white border-b border-warm-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-xl sm:text-2xl font-extrabold text-warm-900 mb-8">
            How it works
          </h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Take the 5-minute quiz", desc: "Answer a few questions about your center. We calculate how much more you could earn with TRS certification." },
              { step: "2", title: "Generate your documents", desc: "For each document, just talk about your center in plain English. Our AI turns your answers into professional TRS-compliant documents." },
              { step: "3", title: "Prep your center", desc: "Follow our step-by-step checklist for classroom setup, staff credentials, and training. Each task has clear instructions." },
              { step: "4", title: "We submit for you", desc: "When your readiness report shows all green, we package everything and submit your TRS certification request to your Workforce Board." },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-warm-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-warm-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk reversal + social proof */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 bg-brand-800 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-extrabold mb-3">
            Start free. Generate your first document before you pay.
          </h2>
          <p className="text-sm text-brand-200 max-w-lg mx-auto mb-6">
            Free accounts get 3 AI document generations per month, full dashboard access, and staff credential tracking. Upgrade to Pro ($49/mo) for unlimited documents, readiness reports, and concierge submission.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/quiz"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-brand-800 px-6 py-3 font-semibold text-sm hover:bg-warm-50 transition"
            >
              Start free quiz →
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-400 text-brand-200 px-6 py-3 font-semibold text-sm hover:bg-brand-700 transition"
            >
              See pricing
            </Link>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-brand-300 text-xs">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Cancel anytime
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Most directors finish in 4-8 weeks
            </span>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-4 sm:px-6 py-10 bg-warm-50">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-base italic text-warm-600 leading-relaxed">
            &quot;I&apos;d been putting off TRS for two years because I didn&apos;t know where to start. CareLadder walked me through everything — I had all my documents done in one weekend.&quot;
          </p>
          <p className="mt-3 text-sm font-semibold text-warm-900">Sandra T.</p>
          <p className="text-xs text-warm-400">Center Director, San Antonio</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-8 bg-white border-t border-warm-100">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <span className="text-sm font-bold text-warm-900">CareLadder</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-warm-400">
            <span>Built for Texas childcare providers</span>
            <Link href="/pricing" className="hover:text-warm-600 transition">Pricing</Link>
          </div>
          <p className="text-[10px] text-warm-300">© 2026 CareLadder</p>
        </div>
      </footer>
    </div>
  );
}
