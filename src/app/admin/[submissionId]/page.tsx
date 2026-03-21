"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { parseStaffMembers, type StaffMember } from "@/lib/staff-utils";

type SubmissionRow = {
  id: string;
  center_id: string;
  status: "pending" | "completed";
  requested_at: string;
  completed_at: string | null;
};

type CenterRow = {
  id: string;
  center_name: string;
  address: string | null;
  county: string | null;
  licensed_capacity: number | null;
  enrollment_count: number | null;
  staff_count: number | null;
  ccs_count: number | null;
  user_id: string;
};

type ApplicationSection = {
  id: string;
  section_type: string;
  status: string;
  ai_draft: string | null;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSectionType(raw: string): string {
  return raw
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const credentialLabels: Record<string, string> = {
  none: "None",
  cda: "CDA",
  associates: "Associate's",
  bachelors: "Bachelor's",
  masters: "Master's",
};

export default function AdminSubmissionPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.submissionId as string;
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [marked, setMarked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [submission, setSubmission] = useState<SubmissionRow | null>(null);
  const [center, setCenter] = useState<CenterRow | null>(null);
  const [sections, setSections] = useState<ApplicationSection[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      // 1. Get submission
      const { data: subData, error: subErr } = await supabase
        .from("submissions")
        .select("id, center_id, status, requested_at, completed_at")
        .eq("id", submissionId)
        .maybeSingle();

      if (subErr || !subData) {
        setError(subErr?.message ?? "Submission not found");
        setLoading(false);
        return;
      }
      const sub = subData as SubmissionRow;
      setSubmission(sub);
      if (sub.status === "completed") setMarked(true);

      // 2. Get center
      const { data: centerData } = await supabase
        .from("centers")
        .select("id, center_name, address, county, licensed_capacity, enrollment_count, staff_count, ccs_count, user_id")
        .eq("id", sub.center_id)
        .maybeSingle();

      const c = centerData as CenterRow | null;
      setCenter(c);

      if (c) {
        // 3. Get TRS application
        const { data: appData } = await supabase
          .from("applications")
          .select("id")
          .eq("center_id", c.id)
          .eq("grant_id", "trs")
          .maybeSingle();

        // 4. Get application sections
        if (appData) {
          const { data: secData } = await supabase
            .from("application_sections")
            .select("id, section_type, status, ai_draft")
            .eq("application_id", (appData as { id: string }).id);
          setSections((secData as ApplicationSection[] | null) ?? []);
        }

        // 5. Get staff data
        const { data: staffData } = await supabase
          .from("center_data")
          .select("data_value")
          .eq("center_id", c.id)
          .eq("data_key", "staff_members")
          .maybeSingle();

        const parsed = parseStaffMembers(
          (staffData as { data_value: string } | null)?.data_value ?? null
        );
        setStaff(parsed);
      }

      setLoading(false);
    };

    void load();
  }, [router, supabase, submissionId]);

  const handleMarkCompleted = async () => {
    if (!submission || marking) return;
    setMarking(true);
    setError(null);

    const { error: updateErr } = await supabase
      .from("submissions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", submission.id);

    if (updateErr) {
      setError(updateErr.message);
      setMarking(false);
      return;
    }

    setMarked(true);
    setSubmission((prev) =>
      prev ? { ...prev, status: "completed", completed_at: new Date().toISOString() } : prev
    );
    setMarking(false);
  };

  const sectionsWithDraft = sections.filter((s) => s.ai_draft);

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 text-warm-900">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <p className="text-warm-500">Loading submission...</p>
        </div>
      </div>
    );
  }

  if (error && !submission) {
    return (
      <div className="min-h-screen bg-warm-50 text-warm-900">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
          <Link href="/admin" className="text-sm text-brand-600 hover:underline">
            Back to admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 text-warm-900">
      {/* Nav */}
      <nav className="border-b border-warm-200 bg-white/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm text-warm-600 hover:text-warm-900"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            All submissions
          </Link>
          <span className="text-sm font-medium text-warm-500">Admin</span>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">

        {/* Header */}
        <section className="rounded-2xl border border-warm-200 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-warm-900">
                {center?.center_name ?? "Unknown Center"}
              </h1>
              {submission && (
                <p className="mt-1 text-sm text-warm-500">
                  Requested {formatDate(submission.requested_at)}
                </p>
              )}
              {submission?.completed_at && (
                <p className="mt-0.5 text-sm text-warm-500">
                  Completed {formatDate(submission.completed_at)}
                </p>
              )}
            </div>
            <div>
              {submission?.status === "pending" ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                  Pending
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  Completed
                </span>
              )}
            </div>
          </div>

          {/* Mark as completed */}
          <div className="mt-5 border-t border-warm-100 pt-5">
            {marked ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 font-medium">
                This submission has been marked as completed.
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => void handleMarkCompleted()}
                  disabled={marking}
                  className="rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:from-brand-600 hover:to-brand-700 disabled:opacity-50"
                >
                  {marking ? "Marking..." : "Mark as completed"}
                </button>
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Center Info */}
        {center && (
          <section className="rounded-2xl border border-warm-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-warm-900 mb-4">Center Info</h2>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {center.address && (
                <div>
                  <dt className="text-xs font-medium text-warm-500 uppercase tracking-wide">Address</dt>
                  <dd className="mt-1 text-sm text-warm-900">{center.address}</dd>
                </div>
              )}
              {center.county && (
                <div>
                  <dt className="text-xs font-medium text-warm-500 uppercase tracking-wide">County</dt>
                  <dd className="mt-1 text-sm text-warm-900">{center.county}</dd>
                </div>
              )}
              {center.licensed_capacity != null && (
                <div>
                  <dt className="text-xs font-medium text-warm-500 uppercase tracking-wide">Licensed Capacity</dt>
                  <dd className="mt-1 text-sm text-warm-900">{center.licensed_capacity}</dd>
                </div>
              )}
              {center.enrollment_count != null && (
                <div>
                  <dt className="text-xs font-medium text-warm-500 uppercase tracking-wide">Enrollment</dt>
                  <dd className="mt-1 text-sm text-warm-900">{center.enrollment_count}</dd>
                </div>
              )}
              {center.staff_count != null && (
                <div>
                  <dt className="text-xs font-medium text-warm-500 uppercase tracking-wide">Staff Count</dt>
                  <dd className="mt-1 text-sm text-warm-900">{center.staff_count}</dd>
                </div>
              )}
              {center.ccs_count != null && (
                <div>
                  <dt className="text-xs font-medium text-warm-500 uppercase tracking-wide">CCS Count</dt>
                  <dd className="mt-1 text-sm text-warm-900">{center.ccs_count}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        {/* Generated Documents */}
        {sectionsWithDraft.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-warm-900 mb-3">Generated Documents</h2>
            <div className="space-y-4">
              {sectionsWithDraft.map((sec) => (
                <div
                  key={sec.id}
                  className="rounded-2xl border border-warm-200 bg-white p-5 sm:p-6"
                >
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="font-semibold text-warm-900">
                      {formatSectionType(sec.section_type)}
                    </h3>
                    {sec.status === "verified" ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        Verified
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        Generated
                      </span>
                    )}
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-warm-800 font-sans leading-relaxed">
                    {sec.ai_draft}
                  </pre>
                </div>
              ))}
            </div>
          </section>
        )}

        {sectionsWithDraft.length === 0 && (
          <section className="rounded-2xl border border-warm-200 bg-white p-5 text-sm text-warm-500">
            No generated documents found for this submission.
          </section>
        )}

        {/* Staff Summary */}
        {staff.length > 0 && (
          <section className="rounded-2xl border border-warm-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-warm-900 mb-4">Staff Summary</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-warm-100 text-left">
                    <th className="pb-3 pr-4 text-xs font-medium text-warm-500 uppercase tracking-wide">Name</th>
                    <th className="pb-3 pr-4 text-xs font-medium text-warm-500 uppercase tracking-wide">Role</th>
                    <th className="pb-3 pr-4 text-xs font-medium text-warm-500 uppercase tracking-wide">Credential</th>
                    <th className="pb-3 pr-4 text-xs font-medium text-warm-500 uppercase tracking-wide">CPR Expiry</th>
                    <th className="pb-3 text-xs font-medium text-warm-500 uppercase tracking-wide">Training Hrs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {staff.map((member) => (
                    <tr key={member.id}>
                      <td className="py-3 pr-4 font-medium text-warm-900">{member.name}</td>
                      <td className="py-3 pr-4 text-warm-600">{member.role}</td>
                      <td className="py-3 pr-4 text-warm-600">
                        {credentialLabels[member.credentialType] ?? member.credentialType}
                      </td>
                      <td className="py-3 pr-4 text-warm-600">
                        {member.cprExpiry || "—"}
                      </td>
                      <td className="py-3 text-warm-600">{member.trainingHours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {staff.length === 0 && (
          <section className="rounded-2xl border border-warm-200 bg-white p-5 text-sm text-warm-500">
            No staff data on file for this center.
          </section>
        )}

      </main>
    </div>
  );
}
