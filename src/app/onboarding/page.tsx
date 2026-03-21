"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type OnboardingStep = 1 | 2;

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState<OnboardingStep>(1);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [centerName, setCenterName] = useState("");
  const [address, setAddress] = useState("");
  const [county, setCounty] = useState("");
  const [licensedCapacity, setLicensedCapacity] = useState("");
  const [enrollmentCount, setEnrollmentCount] = useState("");
  const [staffCount, setStaffCount] = useState("");
  const [ccsCount, setCcsCount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // If user already has a center, skip onboarding
      const { data: existingCenter } = await supabase
        .from("centers")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (existingCenter && existingCenter.length > 0) {
        router.replace("/dashboard");
      }
    };

    void loadUser();
  }, [router, supabase]);

  useEffect(() => {
    const rawQuizData = window.localStorage.getItem("grantready_quiz");
    if (!rawQuizData) {
      return;
    }

    try {
      const quizData = JSON.parse(rawQuizData) as {
        county?: unknown;
        licensedCapacity?: unknown;
        currentEnrollment?: unknown;
        staffCount?: unknown;
        acceptsCCS?: unknown;
        ccsCount?: unknown;
      };

      setCounty(typeof quizData.county === "string" ? quizData.county : "");
      setLicensedCapacity(
        quizData.licensedCapacity !== undefined && quizData.licensedCapacity !== null
          ? String(quizData.licensedCapacity)
          : "",
      );
      setEnrollmentCount(
        quizData.currentEnrollment !== undefined && quizData.currentEnrollment !== null
          ? String(quizData.currentEnrollment)
          : "",
      );
      setStaffCount(
        quizData.staffCount !== undefined && quizData.staffCount !== null ? String(quizData.staffCount) : "",
      );
      setCcsCount(
        String(quizData.acceptsCCS).toLowerCase() === "yes" && quizData.ccsCount !== undefined && quizData.ccsCount !== null
          ? String(quizData.ccsCount)
          : "",
      );
    } catch {
      // Ignore invalid localStorage payloads.
    }
  }, []);

  const toNullableNumber = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const hasLicense = licenseNumber.trim().length > 0;
  const hasNameAndAddress = centerName.trim().length > 0 && address.trim().length > 0;

  const moveToReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!hasLicense && !hasNameAndAddress) {
      setErrorMessage("Enter a license number or both center name and address.");
      return;
    }

    setStep(2);
  };

  const submitCenter = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setSubmitting(false);
      router.replace("/login");
      return;
    }

    const { data: existing } = await supabase.from("centers").select("id").eq("user_id", user.id).limit(1);
    if (existing && existing.length > 0) {
      // Center already exists, just go to dashboard
      window.localStorage.removeItem("grantready_quiz");
      setSubmitting(false);
      router.replace("/dashboard");
      return;
    }

    const { error } = await supabase.from("centers").insert({
      user_id: user.id,
      license_number: licenseNumber.trim() || null,
      center_name: centerName.trim() || null,
      address: address.trim() || null,
      county: county.trim() || null,
      licensed_capacity: toNullableNumber(licensedCapacity),
      enrollment_count: toNullableNumber(enrollmentCount),
      staff_count: toNullableNumber(staffCount),
      ccs_count: toNullableNumber(ccsCount),
    });

    setSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    window.localStorage.removeItem("grantready_quiz");
    router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen bg-warm-50">
      <nav className="sticky top-0 z-40 border-b border-warm-200/40 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">G</span>
            </div>
            <span className="text-sm font-bold text-warm-900">GrantReady</span>
          </div>
          <span className="text-xs text-warm-400">Step {step} of 2</span>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="mb-5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-warm-900 tracking-tight">Tell us about your center</h1>
          <p className="mt-1 text-sm text-warm-500">This helps us personalize your TRS certification roadmap.</p>
        </div>

        <div className="rounded-2xl border border-warm-200 bg-white p-6 sm:p-8 shadow-sm">
          {step === 1 ? (
            <form onSubmit={moveToReview} className="space-y-4">
              <div>
                <label className="block text-xs text-warm-500 mb-1.5 font-semibold">Texas childcare license number</label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(event) => setLicenseNumber(event.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full bg-warm-50 border border-warm-200 rounded-xl px-4 py-3 text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                />
              </div>

              <div className="flex items-center gap-3 text-xs text-warm-400">
                <div className="h-px flex-1 bg-warm-200" />
                <span>OR</span>
                <div className="h-px flex-1 bg-warm-200" />
              </div>

              <div>
                <label className="block text-xs text-warm-500 mb-1.5 font-semibold">Center name</label>
                <input
                  type="text"
                  value={centerName}
                  onChange={(event) => setCenterName(event.target.value)}
                  placeholder="Sunshine Learning Center"
                  className="w-full bg-warm-50 border border-warm-200 rounded-xl px-4 py-3 text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-warm-500 mb-1.5 font-semibold">Center address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="123 Main St, Dallas, TX"
                  className="w-full bg-warm-50 border border-warm-200 rounded-xl px-4 py-3 text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-warm-500 mb-1.5 font-semibold">County</label>
                <input
                  type="text"
                  value={county}
                  onChange={(event) => setCounty(event.target.value)}
                  placeholder="Dallas County"
                  className="w-full bg-warm-50 border border-warm-200 rounded-xl px-4 py-3 text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-warm-500 mb-1.5 font-semibold">Licensed capacity</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={licensedCapacity}
                  onChange={(event) => setLicensedCapacity(event.target.value)}
                  min={0}
                  className="w-full bg-warm-50 border border-warm-200 rounded-xl px-4 py-3 text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-warm-500 mb-1.5 font-semibold">Current enrollment</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={enrollmentCount}
                  onChange={(event) => setEnrollmentCount(event.target.value)}
                  min={0}
                  className="w-full bg-warm-50 border border-warm-200 rounded-xl px-4 py-3 text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-warm-500 mb-1.5 font-semibold">Staff count</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={staffCount}
                  onChange={(event) => setStaffCount(event.target.value)}
                  min={0}
                  className="w-full bg-warm-50 border border-warm-200 rounded-xl px-4 py-3 text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-warm-500 mb-1.5 font-semibold">Subsidized (CCS) children</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={ccsCount}
                  onChange={(event) => setCcsCount(event.target.value)}
                  min={0}
                  className="w-full bg-warm-50 border border-warm-200 rounded-xl px-4 py-3 text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                />
              </div>

              {errorMessage && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
              )}

              <button
                type="submit"
                className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white px-7 py-3 rounded-xl transition font-semibold"
              >
                Continue
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-warm-900">Confirm your center details</h2>
                <p className="text-sm text-warm-500 mt-1">Verify this information before saving to your account.</p>
              </div>

              <dl className="rounded-2xl border border-warm-200 bg-warm-50/70 p-4 sm:p-5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 text-sm">
                  <dt className="text-warm-500 font-semibold">License number</dt>
                  <dd className="text-warm-800">{licenseNumber || "Not provided"}</dd>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 text-sm">
                  <dt className="text-warm-500 font-semibold">Center name</dt>
                  <dd className="text-warm-800">{centerName || "Not provided"}</dd>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 text-sm">
                  <dt className="text-warm-500 font-semibold">Address</dt>
                  <dd className="text-warm-800">{address || "Not provided"}</dd>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 text-sm">
                  <dt className="text-warm-500 font-semibold">County</dt>
                  <dd className="text-warm-800">{county || "Not provided"}</dd>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 text-sm">
                  <dt className="text-warm-500 font-semibold">Licensed capacity</dt>
                  <dd className="text-warm-800">{licensedCapacity || "Not provided"}</dd>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 text-sm">
                  <dt className="text-warm-500 font-semibold">Current enrollment</dt>
                  <dd className="text-warm-800">{enrollmentCount || "Not provided"}</dd>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 text-sm">
                  <dt className="text-warm-500 font-semibold">Staff count</dt>
                  <dd className="text-warm-800">{staffCount || "Not provided"}</dd>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 text-sm">
                  <dt className="text-warm-500 font-semibold">Subsidized (CCS) children</dt>
                  <dd className="text-warm-800">{ccsCount || "Not provided"}</dd>
                </div>
              </dl>

              {errorMessage && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-warm-200 px-5 py-3 text-sm font-semibold text-warm-700 hover:bg-warm-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={submitCenter}
                  disabled={submitting}
                  className="bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white px-6 py-3 rounded-xl transition font-semibold disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Save and continue"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
