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
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-b from-brand-500 to-brand-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-extrabold text-sm">G</span>
            </div>
            <span className="text-base font-extrabold tracking-tight">GrantReady</span>
          </div>
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

          <div className="animate-fade-up animate-delay-200 mt-8 flex justify-center">
            <div className="w-full max-w-sm">
              <div className="space-y-3" role="radiogroup" aria-label="Provider type">
                {options.map((option) => {
                  const isSelected = selected === option;

                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelected(option)}
                      className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-base transition ${
                        isSelected
                          ? "border-brand-500 bg-brand-50 shadow-sm shadow-brand-500/10"
                          : "border-warm-200 bg-white hover:border-warm-300"
                      }`}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                        isSelected ? "border-brand-500 bg-brand-500" : "border-warm-300"
                      }`}>
                        {isSelected && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className={isSelected ? "font-semibold text-warm-900" : "text-warm-700"}>{option}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleGetStarted}
                disabled={!selected}
                className="mt-4 w-full rounded-2xl bg-gradient-to-b from-brand-500 to-brand-600 px-6 py-3.5 font-semibold text-white shadow-md transition hover:from-brand-600 hover:to-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Get Started →
              </button>
            </div>
          </div>

          <p className="mt-8 text-sm italic text-warm-500">
            &quot;I had no idea we qualified for that much. GrantReady walked me through every step.&quot; — Sandra T., Center Director, San Antonio
          </p>

          <p className="mt-6 text-sm text-warm-400">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 font-semibold hover:text-brand-700">
              Log in
            </Link>
          </p>
        </div>
      </main>

      <footer className="px-4 sm:px-6 py-6 text-center text-xs text-warm-400">
        © 2026 GrantReady
      </footer>
    </div>
  );
}
