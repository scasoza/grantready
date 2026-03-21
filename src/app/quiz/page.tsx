"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type YesNo = "yes" | "no" | "";

type QuizAnswers = {
  centerType: string;
  county: string;
  licensedCapacity: string;
  currentEnrollment: string;
  acceptsCCS: YesNo;
  ccsCount: string;
  staffCount: string;
  hasCurriculum: string;
  teacherCredentials: string;
  trsExperience: string;
};

const ALL_QUESTION_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const OPENING_QUESTION_INDICES = [0, 1, 8];

const initialAnswers: QuizAnswers = {
  centerType: "",
  county: "",
  licensedCapacity: "",
  currentEnrollment: "",
  acceptsCCS: "",
  ccsCount: "",
  staffCount: "",
  hasCurriculum: "",
  teacherCredentials: "",
  trsExperience: "",
};

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>(initialAnswers);
  const initRef = useRef(false);

  const activeQuestionIndices = useMemo(
    () =>
      answers.centerType === "Thinking about opening"
        ? OPENING_QUESTION_INDICES
        : ALL_QUESTION_INDICES,
    [answers.centerType],
  );
  const totalSteps = activeQuestionIndices.length;
  const currentQuestionIndex = activeQuestionIndices[step] ?? activeQuestionIndices[0];
  const progressPercent = useMemo(() => ((step + 1) / totalSteps) * 100, [step, totalSteps]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const storedStart = localStorage.getItem("grantready_quiz_start");
    if (!storedStart) {
      router.replace("/");
      return;
    }

    localStorage.removeItem("grantready_quiz_start");

    try {
      const parsed = JSON.parse(storedStart) as { centerType?: string };
      if (typeof parsed.centerType === "string" && parsed.centerType.length > 0) {
        setAnswers((prev) => ({ ...prev, centerType: parsed.centerType ?? "" }));
        setStep(1);
      }
    } catch {
      // Ignore invalid start payloads.
    }
  }, [router]);

  const canGoNext = useMemo(() => {
    switch (currentQuestionIndex) {
      case 0:
        return answers.centerType.length > 0;
      case 1:
        return answers.county.trim().length > 0;
      case 2:
        return answers.licensedCapacity.trim().length > 0;
      case 3:
        return answers.currentEnrollment.trim().length > 0;
      case 4:
        if (!answers.acceptsCCS) {
          return false;
        }
        if (answers.acceptsCCS === "yes") {
          return answers.ccsCount.trim().length > 0;
        }
        return true;
      case 5:
        return answers.staffCount.trim().length > 0;
      case 6:
        return answers.hasCurriculum.length > 0;
      case 7:
        return answers.teacherCredentials.length > 0;
      case 8:
        return answers.trsExperience.length > 0;
      default:
        return false;
    }
  }, [answers, currentQuestionIndex]);

  const updateAnswer = <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const toNumberOrNull = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const saveAndContinue = () => {
    const payload =
      answers.centerType === "Thinking about opening"
        ? {
            ...answers,
            licensedCapacity: 0,
            currentEnrollment: 0,
            acceptsCCS: "No",
            ccsCount: 0,
            staffCount: 0,
            hasCurriculum: "No",
            teacherCredentials: "No",
          }
        : {
            ...answers,
            licensedCapacity: toNumberOrNull(answers.licensedCapacity),
            currentEnrollment: toNumberOrNull(answers.currentEnrollment),
            ccsCount: answers.acceptsCCS === "yes" ? toNumberOrNull(answers.ccsCount) : null,
            staffCount: toNumberOrNull(answers.staffCount),
          };

    localStorage.setItem("grantready_quiz", JSON.stringify(payload));
    router.push("/snapshot");
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canGoNext) {
      return;
    }

    if (step === totalSteps - 1) {
      saveAndContinue();
      return;
    }

    setStep((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-warm-50 text-warm-900 px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm shadow-brand-600/20">
              <span className="text-white text-xs font-extrabold">G</span>
            </div>
            <span className="text-sm font-bold tracking-tight">GrantReady</span>
          </Link>
          <span className="text-xs font-semibold text-warm-400">{step + 1} / {totalSteps}</span>
        </header>

        <div className="mb-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-warm-200">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl border border-warm-200 bg-white p-5 sm:p-8 shadow-sm">
          <div>{renderQuestion(currentQuestionIndex, answers, updateAnswer)}</div>

          <div className="mt-6 flex items-center justify-between gap-3">
            {step === 0 ? (
              <Link href="/" className="rounded-xl border border-warm-200 px-5 py-3 text-base font-semibold text-warm-700 hover:bg-warm-50 transition">
                Back
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setStep((prev) => Math.max(0, prev - 1))}
                className="rounded-xl border border-warm-200 px-5 py-3 text-base font-semibold text-warm-700 hover:bg-warm-50 transition"
              >
                Back
              </button>
            )}

            <button
              type="submit"
              disabled={!canGoNext}
              className="rounded-xl bg-brand-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {step === totalSteps - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-xs text-warm-400">
          Your answers stay on your device until you create an account.
        </p>
      </div>
    </div>
  );
}

function renderQuestion(
  questionIndex: number,
  answers: QuizAnswers,
  updateAnswer: <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => void,
) {
  switch (questionIndex) {
    case 0:
      return (
        <div className="space-y-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">What type of childcare do you run?</h1>
          <fieldset className="space-y-3">
            {[
              "Licensed center",
              "Licensed home",
              "Thinking about opening",
            ].map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-warm-200 bg-warm-50 px-4 py-4 text-lg font-medium text-warm-900 hover:border-brand-500/40"
              >
                <input
                  type="radio"
                  name="centerType"
                  value={option}
                  checked={answers.centerType === option}
                  onChange={(event) => updateAnswer("centerType", event.target.value)}
                  className="h-5 w-5 accent-brand-500"
                />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
        </div>
      );
    case 1:
      return (
        <div className="space-y-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">What county is your center in?</h1>
          <input
            type="text"
            value={answers.county}
            onChange={(event) => updateAnswer("county", event.target.value)}
            placeholder="e.g., Travis"
            className="w-full rounded-2xl border border-warm-200 bg-warm-50 px-5 py-4 text-lg text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      );
    case 2:
      return (
        <div className="space-y-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">How many children are you licensed for?</h1>
          <input
            key={`number-${questionIndex}`}
            type="number"
            min="0"
            inputMode="numeric"
            value={answers.licensedCapacity}
            onChange={(event) => updateAnswer("licensedCapacity", event.target.value)}
            className="w-full rounded-2xl border border-warm-200 bg-warm-50 px-5 py-4 text-lg text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      );
    case 3:
      return (
        <div className="space-y-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Current enrollment?</h1>
          <input
            key={`number-${questionIndex}`}
            type="number"
            min="0"
            inputMode="numeric"
            value={answers.currentEnrollment}
            onChange={(event) => updateAnswer("currentEnrollment", event.target.value)}
            className="w-full rounded-2xl border border-warm-200 bg-warm-50 px-5 py-4 text-lg text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      );
    case 4:
      return (
        <div className="space-y-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Do you accept CCS (subsidized) children?</h1>
          <div key={`choices-${questionIndex}`} className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                updateAnswer("acceptsCCS", "yes");
              }}
              className={`rounded-2xl border px-6 py-3 text-lg font-semibold transition ${
                answers.acceptsCCS === "yes"
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-warm-200 bg-warm-50 text-warm-800 hover:border-brand-500/40"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => {
                updateAnswer("acceptsCCS", "no");
                updateAnswer("ccsCount", "");
              }}
              className={`rounded-2xl border px-6 py-3 text-lg font-semibold transition ${
                answers.acceptsCCS === "no"
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-warm-200 bg-warm-50 text-warm-800 hover:border-brand-500/40"
              }`}
            >
              No
            </button>
          </div>

          {answers.acceptsCCS === "yes" && (
            <div className="space-y-2">
              <label className="block text-base font-semibold text-warm-700">How many?</label>
              <input
                key={`number-${questionIndex}`}
                type="number"
                min="0"
                inputMode="numeric"
                value={answers.ccsCount}
                onChange={(event) => updateAnswer("ccsCount", event.target.value)}
                className="w-full rounded-2xl border border-warm-200 bg-warm-50 px-5 py-4 text-lg text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          )}
        </div>
      );
    case 5:
      return (
        <div className="space-y-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">How many staff, including yourself?</h1>
          <input
            key={`number-${questionIndex}`}
            type="number"
            min="0"
            inputMode="numeric"
            value={answers.staffCount}
            onChange={(event) => updateAnswer("staffCount", event.target.value)}
            className="w-full rounded-2xl border border-warm-200 bg-warm-50 px-5 py-4 text-lg text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      );
    case 6:
      return (
        <div className="space-y-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Do you have a written curriculum?</h1>
          <div key={`choices-${questionIndex}`} className="flex flex-wrap gap-3">
            {["Yes", "Sort of", "No"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => updateAnswer("hasCurriculum", option)}
                className={`rounded-2xl border px-6 py-3 text-lg font-semibold transition ${
                  answers.hasCurriculum === option
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-warm-200 bg-warm-50 text-warm-800 hover:border-brand-500/40"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      );
    case 7:
      return (
        <div className="space-y-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Do all lead teachers hold a CDA or higher?</h1>
          <div key={`choices-${questionIndex}`} className="flex flex-wrap gap-3">
            {["Yes", "Not sure", "No"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => updateAnswer("teacherCredentials", option)}
                className={`rounded-2xl border px-6 py-3 text-lg font-semibold transition ${
                  answers.teacherCredentials === option
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-warm-200 bg-warm-50 text-warm-800 hover:border-brand-500/40"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      );
    case 8:
      return (
        <div className="space-y-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Have you looked into Texas Rising Star before?</h1>
          <div key={`choices-${questionIndex}`} className="flex flex-wrap gap-3">
            {["Yes, applied", "Yes, looked", "No"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => updateAnswer("trsExperience", option)}
                className={`rounded-2xl border px-6 py-3 text-lg font-semibold transition ${
                  answers.trsExperience === option
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-warm-200 bg-warm-50 text-warm-800 hover:border-brand-500/40"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}
