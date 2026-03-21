"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Grant } from "@/lib/grants";
import { grants } from "@/lib/grants";
import type { SectionTemplate } from "@/lib/grant-sections";
import { getSectionsForGrant, getTotalTimeEstimate } from "@/lib/grant-sections";
import { createClient } from "@/lib/supabase/client";

type SectionStatus = "pending" | "in_progress" | "verified";

interface ApplicationRow {
  id: number;
}

interface ApplicationSectionRow {
  section_type: string;
  status: SectionStatus | null;
}

const kindBadgeStyles: Record<SectionTemplate["kind"], string> = {
  narrative: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  data: "bg-blue-100 text-blue-800 border border-blue-200",
  budget: "bg-amber-100 text-amber-800 border border-amber-200",
};

const kindLabel: Record<SectionTemplate["kind"], string> = {
  narrative: "Narrative",
  data: "Data",
  budget: "Budget",
};

export default function ApplicationBuilderPage() {
  const params = useParams<{ grantId: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const parsedGrantId = Number(params.grantId);
  const grant = useMemo<Grant | null>(
    () => grants.find((item) => item.id === parsedGrantId) ?? null,
    [parsedGrantId]
  );
  const sections = useMemo<SectionTemplate[]>(
    () => (Number.isNaN(parsedGrantId) ? [] : getSectionsForGrant(parsedGrantId)),
    [parsedGrantId]
  );
  const [statuses, setStatuses] = useState<Record<string, SectionStatus>>({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const initApplication = async () => {
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

      const { data: centers, error: centersError } = await supabase
        .from("centers")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (centersError) {
        setErrorMessage(centersError.message);
        setLoading(false);
        return;
      }

      const centerId = centers?.[0]?.id as number | undefined;
      if (!centerId) {
        router.replace("/onboarding");
        return;
      }

      const { data: existingApplications, error: appLookupError } = await supabase
        .from("applications")
        .select("id")
        .eq("center_id", centerId)
        .eq("grant_id", String(parsedGrantId))
        .limit(1);

      if (appLookupError) {
        setErrorMessage(appLookupError.message);
        setLoading(false);
        return;
      }

      let applicationId = (existingApplications?.[0] as ApplicationRow | undefined)?.id;

      if (!applicationId) {
        const { data: insertedApplication, error: appInsertError } = await supabase
          .from("applications")
          .insert({ center_id: centerId, grant_id: String(parsedGrantId) })
          .select("id")
          .single();

        if (appInsertError) {
          setErrorMessage(appInsertError.message);
          setLoading(false);
          return;
        }

        applicationId = (insertedApplication as ApplicationRow).id;
      }

      const { data: existingSections, error: sectionsLookupError } = await supabase
        .from("application_sections")
        .select("section_type,status")
        .eq("application_id", applicationId);

      if (sectionsLookupError) {
        setErrorMessage(sectionsLookupError.message);
        setLoading(false);
        return;
      }

      const existingRows = (existingSections ?? []) as ApplicationSectionRow[];
      const existingByType = new Map(existingRows.map((row) => [row.section_type, row]));
      const missingSections = sections.filter((section) => !existingByType.has(section.type));

      if (missingSections.length > 0) {
        const { error: insertSectionsError } = await supabase
          .from("application_sections")
          .insert(
            missingSections.map((section) => ({
              application_id: applicationId,
              section_type: section.type,
              status: "pending" as SectionStatus,
            }))
          );

        if (insertSectionsError) {
          setErrorMessage(insertSectionsError.message);
          setLoading(false);
          return;
        }
      }

      const statusMap: Record<string, SectionStatus> = {};
      sections.forEach((section) => {
        const status = existingByType.get(section.type)?.status;
        statusMap[section.type] = status ?? "pending";
      });
      setStatuses(statusMap);
      setLoading(false);
    };

    void initApplication();
  }, [grant, parsedGrantId, router, sections, supabase]);

  const totalTimeEstimate = useMemo(() => getTotalTimeEstimate(sections), [sections]);
  const completedCount = useMemo(
    () => sections.filter((section) => statuses[section.type] === "verified").length,
    [sections, statuses]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-warm-200 bg-white p-6 text-warm-700">
          Loading application builder...
        </div>
      </div>
    );
  }

  if (errorMessage || !grant) {
    return (
      <div className="min-h-screen bg-warm-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {errorMessage ?? "Grant not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center text-sm font-semibold text-warm-600 hover:text-warm-900"
        >
          ← Back to dashboard
        </Link>

        <header className="rounded-2xl bg-brand-600 hover:bg-brand-700 p-6 text-white shadow-lg shadow-brand-700/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">Application Builder</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{grant.name}</h1>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-brand-100">Source</p>
              <p className="mt-1 font-semibold">{grant.source}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-brand-100">Amount</p>
              <p className="mt-1 font-semibold">{grant.amount}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-brand-100">Estimated time</p>
              <p className="mt-1 font-semibold">{totalTimeEstimate}</p>
            </div>
          </div>
        </header>

        <section className="mt-6 space-y-3">
          {sections.map((section, index) => {
            const status = statuses[section.type] ?? "pending";
            return (
              <Link
                key={section.type}
                href={`/apply/${parsedGrantId}/${section.type}`}
                className="block rounded-xl border border-warm-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-warm-100 text-sm font-bold text-warm-700">
                      {index + 1}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-warm-900">{section.title}</h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${kindBadgeStyles[section.kind]}`}>
                          {kindLabel[section.kind]}
                        </span>
                        <span className="text-xs text-warm-500">{section.timeEstimate}</span>
                      </div>
                    </div>
                  </div>
                  <SectionStatusIndicator status={status} />
                </div>
              </Link>
            );
          })}
        </section>

        <footer className="mt-6 rounded-xl border border-warm-200 bg-white p-4">
          <p className="text-sm font-semibold text-warm-900">
            {completedCount} of {sections.length} sections complete
          </p>
        </footer>
      </div>
    </div>
  );
}

function SectionStatusIndicator({ status }: { status: SectionStatus }) {
  if (status === "verified") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white">✓</span>
        Verified
      </div>
    );
  }

  if (status === "in_progress") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <span className="relative h-4 w-4 overflow-hidden rounded-full border border-amber-500 bg-warm-100">
          <span className="absolute inset-y-0 left-0 w-1/2 bg-amber-500" />
        </span>
        In progress
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-warm-100 px-2.5 py-1 text-xs font-semibold text-warm-600">
      <span className="h-4 w-4 rounded-full bg-warm-300" />
      Pending
    </div>
  );
}
