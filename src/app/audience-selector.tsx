"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const options = [
  "I run a licensed center",
  "I run a licensed home",
  "I am thinking about opening",
] as const;

export default function AudienceSelector() {
  const router = useRouter();
  const [selected, setSelected] = useState<string>("");

  return (
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
              className={`w-full rounded-xl border p-4 text-left text-base transition ${
                isSelected
                  ? "border-brand-500 bg-brand-50"
                  : "border-warm-200 bg-white hover:border-warm-300"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => router.push("/quiz")}
        disabled={!selected}
        className="mt-4 w-full rounded-2xl bg-gradient-to-b from-brand-500 to-brand-600 px-6 py-3.5 font-semibold text-white shadow-md transition hover:from-brand-600 hover:to-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Get Started →
      </button>
    </div>
  );
}
