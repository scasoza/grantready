"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

export default function Home() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [selected, setSelected] = useState<(typeof options)[number] | "">("");
  const [checking, setChecking] = useState(true);

  // If already logged in, go straight to dashboard
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
    <div className="min-h-screen hero-gradient text-warm-900 flex flex-col">
      <header className="w-full px-4 sm:px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-extrabold text-sm">G</span>
            </div>
            <span className="text-base font-extrabold tracking-tight">GrantReady</span>
          </div>
          <Link href="/login" className="rounded-xl border border-warm-200 bg-white/80 px-4 py-2 text-sm font-semibold text-warm-700 hover:bg-white transition">
            Log in
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-2xl mx-auto text-center">
          <h1 className="animate-fade-up text-3xl sm:text-5xl font-extrabold tracking-tight text-warm-900">
            Stop leaving money on the table.
          </h1>
          <p className="animate-fade-up animate-delay-100 mt-4 mx-auto text-base sm:text-lg text-warm-500 max-w-lg leading-relaxed">
            Texas childcare providers miss an average of <span className="font-semibold text-brand-700">$14,000/yr</span> in funding they already qualify for. See what you&apos;re missing — free, 5 minutes, no account needed.
          </p>

          {/* Trust badge */}
          <div className="animate-fade-up animate-delay-200 mt-6 inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-200 px-4 py-1.5">
            <svg className="h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium text-brand-700">Free · 5 min · No account required</span>
          </div>

          <div className="animate-fade-up animate-delay-300 mt-6 flex justify-center">
            <div className="w-full max-w-sm rounded-2xl bg-white border border-warm-200 p-5 shadow-lg">
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
                Get Started →
              </button>
            </div>
          </div>

          <p className="mt-6 text-xs italic text-warm-400 max-w-xs mx-auto">
            &quot;I had no idea we qualified for that much.&quot; — Sandra T., San Antonio
          </p>

          <p className="mt-6 text-sm text-warm-400">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 font-semibold hover:text-brand-700">
              Log in
            </Link>
          </p>
        </div>
      </main>

      <footer className="px-4 sm:px-6 py-6 text-center space-y-2">
        <p className="text-[11px] text-warm-400">Built for Texas childcare providers</p>
        <p className="text-[10px] text-warm-300">© 2026 GrantReady · <Link href="/pricing" className="hover:text-warm-500 transition">Pricing</Link></p>
      </footer>
    </div>
  );
}
