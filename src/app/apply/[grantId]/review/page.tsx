"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { grants } from "@/lib/grants";
import { getSectionsForGrant } from "@/lib/grant-sections";
import { createClient } from "@/lib/supabase/client";

type SectionReviewStatus = "pending" | "input_given" | "draft_generated" | "verified";

interface ApplicationRow {
  id: number;
  status: string | null;
}

interface ApplicationSectionRow {
  id: string;
  section_type: string;
  ai_draft: string | null;
  status: SectionReviewStatus | null;
}

interface VerifiedClaimRow {
  id: string;
  section_id: string;
  claim_text: string;
  claim_value: string | null;
  verified: boolean | null;
  corrected_value: string | null;
}

export default function ReviewApplicationPage() {
  const params = useParams<{ grantId: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const parsedGrantId = Number(params.grantId);
  const grant = useMemo(
    () => grants.find((item) => item.id === parsedGrantId) ?? null,
    [parsedGrantId]
  );
  const sectionTemplates = useMemo(
    () => (Number.isNaN(parsedGrantId) ? [] : getSectionsForGrant(parsedGrantId)),
    [parsedGrantId]
  );

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [application, setApplication] = useState<ApplicationRow | null>(null);
  const [sections, setSections] = useState<ApplicationSectionRow[]>([]);
  const [claims, setClaims] = useState<VerifiedClaimRow[]>([]);

  useEffect(() => {
    const loadReviewData = async () => {
      if (Number.isNaN(parsedGrantId) || !grant) {
        setErrorMessage("Grant not found.");
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: center, error: centerError } = await supabase
        .from("centers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (centerError) {
        setErrorMessage(centerError.message);
        setLoading(false);
        return;
      }

      if (!center?.id) {
        router.replace("/onboarding");
        return;
      }

      const { data: app, error: appError } = await supabase
        .from("applications")
        .select("id,status")
        .eq("center_id", center.id)
        .eq("grant_id", String(parsedGrantId))
        .single();

      if (appError) {
        setErrorMessage(appError.message);
        setLoading(false);
        return;
      }

      const currentApplication = app as ApplicationRow;
      setApplication(currentApplication);

      const { data: sectionRows, error: sectionError } = await supabase
        .from("application_sections")
        .select("id,section_type,ai_draft,status")
        .eq("application_id", currentApplication.id);

      if (sectionError) {
        setErrorMessage(sectionError.message);
        setLoading(false);
        return;
      }

      const loadedSections = (sectionRows ?? []) as ApplicationSectionRow[];
      setSections(loadedSections);

      if (loadedSections.length > 0) {
        const sectionIds = loadedSections.map((section) => section.id);
        const { data: claimRows, error: claimsError } = await supabase
          .from("verified_claims")
          .select("id,section_id,claim_text,claim_value,verified,corrected_value")
          .in("section_id", sectionIds);

        if (claimsError) {
          setErrorMessage(claimsError.message);
          setLoading(false);
          return;
        }

        setClaims((claimRows ?? []) as VerifiedClaimRow[]);
      } else {
        setClaims([]);
      }

      setSubmitted(currentApplication.status === "submitted");
      setLoading(false);
    };

    void loadReviewData();
  }, [grant, parsedGrantId, router, supabase]);

  const sectionsByType = useMemo(() => {
    const map = new Map<string, ApplicationSectionRow>();
    sections.forEach((section) => map.set(section.section_type, section));
    return map;
  }, [sections]);

  const claimsBySection = useMemo(() => {
    const map = new Map<string, VerifiedClaimRow[]>();
    claims.forEach((claim) => {
      const current = map.get(claim.section_id) ?? [];
      current.push(claim);
      map.set(claim.section_id, current);
    });
    return map;
  }, [claims]);

  const displaySections = useMemo(
    () =>
      sectionTemplates
        .map((template) => ({ template, row: sectionsByType.get(template.type) }))
        .filter(
          (entry) =>
            // Budget sections don't have ai_draft — they store data in budget_items
            entry.template.type === "budget"
              ? entry.row?.status === "verified"
              : !!entry.row?.ai_draft &&
                (entry.row.status === "draft_generated" || entry.row.status === "verified")
        ),
    [sectionTemplates, sectionsByType]
  );

  const allSectionsVerified = useMemo(
    () =>
      sectionTemplates.length > 0 &&
      sectionTemplates.every((template) => sectionsByType.get(template.type)?.status === "verified"),
    [sectionTemplates, sectionsByType]
  );

  const handleSubmit = async () => {
    if (!application || !allSectionsVerified) return;

    setSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase
      .from("applications")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    if (error) {
      setErrorMessage(error.message);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-warm-200 bg-white p-6 text-warm-700">
          Loading review...
        </div>
      </div>
    );
  }

  if (!grant || errorMessage) {
    return (
      <div className="min-h-screen bg-warm-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {errorMessage ?? "Grant not found."}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-warm-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-xl border border-warm-200 bg-white p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0">
              <span className="absolute left-8 top-8 h-3 w-3 rounded-full bg-brand-400/70" />
              <span className="absolute right-12 top-12 h-2 w-2 rounded-full bg-emerald-400/70" />
              <span className="absolute left-1/4 top-20 h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="absolute bottom-14 right-1/4 h-3 w-3 rounded-full bg-brand-500/60" />
            </div>

            <div className="relative">
              <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Submitted
              </div>
              <h1 className="mt-4 text-3xl font-extrabold text-warm-900">Application Ready!</h1>
              <p className="mt-3 text-warm-700">
                Download your application below and submit it through the grant portal.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => console.log("Download application placeholder")}
                  className="rounded-xl bg-brand-600 hover:bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition"
                >
                  Download Application
                </button>
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-warm-200 bg-warm-50 px-4 py-2.5 text-sm font-semibold text-warm-900 transition hover:bg-warm-100"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/apply/${parsedGrantId}`}
          className="mb-4 inline-flex items-center text-sm font-semibold text-warm-600 hover:text-warm-900"
        >
          ← Back
        </Link>

        <header className="rounded-2xl bg-brand-600 p-6 text-white shadow-lg shadow-brand-700/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">Application Review</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{grant.name}</h1>
        </header>

        <section className="mt-6 space-y-4">
          {displaySections.length === 0 ? (
            <div className="rounded-xl border border-warm-200 bg-white p-5 text-warm-700">
              No generated drafts yet. Complete at least one section to review.
            </div>
          ) : (
            displaySections.map(({ template, row }) => {
              if (!row) return null;

              const isVerified = row.status === "verified";
              const claimCount = claimsBySection.get(row.id)?.length ?? 0;

              return (
                <article key={template.type} className="rounded-xl border border-warm-200 bg-white p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-warm-900">{template.title}</h2>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isVerified
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {isVerified ? "Verified" : "Needs review"}
                    </span>
                  </div>

                  {template.type === "budget" ? (
                    <p className="mt-4 text-sm text-warm-600 italic">Budget saved. View details in the budget editor.</p>
                  ) : (
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-warm-800">{row.ai_draft}</p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-warm-500">
                    <span>{claimCount} extracted claim{claimCount === 1 ? "" : "s"}</span>
                    {!isVerified && (
                      <Link
                        href={`/apply/${parsedGrantId}/${template.type}`}
                        className="font-semibold text-brand-700 hover:text-brand-800"
                      >
                        Review this section →
                      </Link>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>

        <footer className="mt-8 rounded-xl border border-warm-200 bg-white p-5">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allSectionsVerified || submitting}
            className="w-full rounded-xl bg-brand-600 hover:bg-brand-700 px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
          {!allSectionsVerified && (
            <p className="mt-2 text-xs text-amber-700">All sections must be verified before submission.</p>
          )}
        </footer>
      </div>
    </div>
  );
}
