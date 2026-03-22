"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { trsDocTemplates } from "@/lib/trs-documents";
import LoadingScreen from "@/components/LoadingScreen";

type SectionStatus = "pending" | "input_given" | "draft_generated" | "verified";

interface ApplicationRow {
  id: number;
  grant_id: string | number | null;
}

interface ApplicationSectionRow {
  id: string;
  application_id: number;
  section_type: string;
  ai_draft: string | null;
  status: SectionStatus | null;
  created_at?: string | null;
}

interface DocumentItem {
  id: string;
  sectionType: string;
  title: string;
  grantName: string;
  createdAt: string | null;
  status: SectionStatus | null;
  aiDraft: string;
  isJson: boolean;
}

// Get proper title from trsDocTemplates, fall back to formatted section_type
function getDocTitle(sectionType: string): string {
  const template = trsDocTemplates.find((t) => t.docType === sectionType);
  if (template) return template.title;
  return sectionType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) return "Unknown date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown date";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Check if content is JSON (self-assessment answers)
function isJsonContent(text: string): boolean {
  if (!text.startsWith("{")) return false;
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

// Format self-assessment JSON into readable summary
function formatSelfAssessment(json: string): string {
  try {
    const answers = JSON.parse(json) as Record<string, string>;
    const total = Object.keys(answers).length;
    const yes = Object.values(answers).filter((v) => v === "yes").length;
    const no = Object.values(answers).filter((v) => v === "no").length;
    const na = Object.values(answers).filter((v) => v === "na").length;
    return `Self-assessment completed: ${total} items answered (${yes} yes, ${no} no, ${na} N/A)`;
  } catch {
    return "Self-assessment in progress";
  }
}

export default function DocumentsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadDocuments = async () => {
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
        setDocuments([]);
        setLoading(false);
        return;
      }

      const { data: appRows, error: appError } = await supabase
        .from("applications")
        .select("id,grant_id")
        .eq("center_id", center.id);

      if (appError) {
        setErrorMessage(appError.message);
        setLoading(false);
        return;
      }

      const applications = (appRows ?? []) as ApplicationRow[];
      if (applications.length === 0) {
        setDocuments([]);
        setLoading(false);
        return;
      }

      const applicationIds = applications.map((app) => app.id);
      const grantNameByApplicationId = new Map<number, string>();
      applications.forEach((app) => {
        if (String(app.grant_id) === "trs") {
          grantNameByApplicationId.set(app.id, "TRS Certification");
        } else {
          grantNameByApplicationId.set(app.id, String(app.grant_id ?? "Document"));
        }
      });

      const { data: sectionRows, error: sectionError } = await supabase
        .from("application_sections")
        .select("id,application_id,section_type,ai_draft,status,created_at")
        .in("application_id", applicationIds)
        .not("ai_draft", "is", null)
        .neq("ai_draft", "");

      if (sectionError) {
        setErrorMessage(sectionError.message);
        setLoading(false);
        return;
      }

      const mapped = ((sectionRows ?? []) as ApplicationSectionRow[])
        .map((row) => {
          const draft = row.ai_draft ?? "";
          const json = isJsonContent(draft);
          return {
            id: row.id,
            sectionType: row.section_type,
            title: getDocTitle(row.section_type),
            grantName: grantNameByApplicationId.get(row.application_id) ?? "Document",
            createdAt: row.created_at ?? null,
            status: row.status,
            aiDraft: draft,
            isJson: json,
          };
        })
        .sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });

      setDocuments(mapped);
      setLoading(false);
    };

    void loadDocuments();
  }, [router, supabase]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopy = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setErrorMessage("Could not copy to clipboard. Please try again.");
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-warm-50 text-warm-900">
      <nav className="sticky top-0 z-40 bg-brand-700 shadow-md">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="text-brand-200 hover:text-white transition p-2 -m-2" aria-label="Back to dashboard">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-white">Documents</h1>
            <p className="text-xs text-brand-200">{documents.length} generated</p>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 pb-24 sm:pb-6">
        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {documents.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-warm-300 bg-warm-50/50 p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warm-100">
              <svg className="h-6 w-6 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-warm-700">Your documents will show up here</p>
            <p className="mt-1 text-xs text-warm-500">Head to your dashboard and generate your first TRS document — it takes about 2 minutes.</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {documents.map((doc) => {
              const isExpanded = expandedIds.has(doc.id);
              const statusLabel = doc.status === "verified" ? "Approved" : "Draft";
              const displayText = doc.isJson
                ? formatSelfAssessment(doc.aiDraft)
                : doc.aiDraft;
              const previewText = displayText.slice(0, 200);

              return (
                <article key={doc.id} className="rounded-xl border border-warm-200 bg-white overflow-hidden">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-warm-900">{doc.title}</h2>
                        <p className="mt-0.5 text-xs text-warm-400">
                          {doc.grantName} · Created {formatDate(doc.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          statusLabel === "Approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-warm-700 leading-relaxed whitespace-pre-wrap">
                      {isExpanded && !doc.isJson
                        ? displayText
                        : `${previewText}${displayText.length > 200 ? "..." : ""}`}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {!doc.isJson && (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(doc.id)}
                          className="rounded-lg border border-warm-200 px-3 py-1.5 text-xs font-medium text-warm-600 hover:bg-warm-50 transition"
                        >
                          {isExpanded ? "Collapse" : "View full"}
                        </button>
                      )}
                      {!doc.isJson && (
                        <button
                          type="button"
                          onClick={() => void handleCopy(doc.aiDraft)}
                          className="rounded-lg border border-warm-200 px-3 py-1.5 text-xs font-medium text-warm-600 hover:bg-warm-50 transition"
                        >
                          Copy
                        </button>
                      )}
                      <Link
                        href={doc.sectionType === "self_assessment" ? "/trs/self-assessment" : `/trs/${doc.sectionType}`}
                        className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition"
                      >
                        {doc.isJson ? "Open" : "Edit"}
                      </Link>
                      {!doc.isJson && doc.status === "verified" && (
                        <a
                          href={`/api/export-pdf?docType=${doc.sectionType}&applicationId=${doc.id}`}
                          className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 transition"
                        >
                          PDF
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
