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
  wordCount: number;
}

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

function isJsonContent(text: string): boolean {
  if (!text.startsWith("{")) return false;
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

function formatSelfAssessment(json: string): string {
  try {
    const answers = JSON.parse(json) as Record<string, string>;
    const total = Object.keys(answers).length;
    const yes = Object.values(answers).filter((v) => v === "yes").length;
    const no = Object.values(answers).filter((v) => v === "no").length;
    const na = Object.values(answers).filter((v) => v === "na").length;
    return `${total} items answered: ${yes} yes, ${no} no, ${na} N/A`;
  } catch {
    return "In progress";
  }
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Get first clean sentence for preview
function getPreviewSentence(text: string): string {
  const firstSentence = text.split(/[.!?]\s/)[0];
  if (firstSentence && firstSentence.length > 20) {
    return firstSentence.length > 180 ? firstSentence.slice(0, 180) + "..." : firstSentence + ".";
  }
  return text.slice(0, 180) + (text.length > 180 ? "..." : "");
}

// Document type icon paths
const docIcons: Record<string, string> = {
  curriculum_framework: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  parent_engagement: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z",
  cqip: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5",
  staff_binder: "M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.25a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75",
  director_qualifications: "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5",
  self_assessment: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
};

const defaultIcon = "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";

type FilterTab = "all" | "approved" | "draft";

export default function DocumentsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterTab>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
            wordCount: json ? 0 : countWords(draft),
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = async (docId: string, text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(docId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setErrorMessage("Could not copy to clipboard.");
    }
  };

  // Stats
  const approvedCount = documents.filter((d) => d.status === "verified").length;
  const draftCount = documents.filter((d) => d.status !== "verified").length;
  const totalWords = documents.reduce((sum, d) => sum + d.wordCount, 0);

  // Filtered docs
  const filteredDocs = useMemo(() => {
    if (filter === "approved") return documents.filter((d) => d.status === "verified");
    if (filter === "draft") return documents.filter((d) => d.status !== "verified");
    return documents;
  }, [documents, filter]);

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

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 pb-24 sm:pb-6 space-y-4">
        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {documents.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-warm-300 bg-warm-50/50 p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warm-100">
              <svg className="h-6 w-6 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={defaultIcon} />
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
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white border border-warm-100 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
                <p className="text-[11px] text-warm-400 font-medium">Approved</p>
              </div>
              <div className="rounded-xl bg-white border border-warm-100 p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{draftCount}</p>
                <p className="text-[11px] text-warm-400 font-medium">Drafts</p>
              </div>
              <div className="rounded-xl bg-white border border-warm-100 p-3 text-center">
                <p className="text-2xl font-bold text-warm-700">{totalWords.toLocaleString()}</p>
                <p className="text-[11px] text-warm-400 font-medium">Total Words</p>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 bg-warm-100 rounded-lg p-0.5">
              {([
                { key: "all" as const, label: `All (${documents.length})` },
                { key: "approved" as const, label: `Approved (${approvedCount})` },
                { key: "draft" as const, label: `Drafts (${draftCount})` },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    filter === tab.key
                      ? "bg-white text-warm-900 shadow-sm"
                      : "text-warm-500 hover:text-warm-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Document list */}
            <div className="space-y-3">
              {filteredDocs.map((doc) => {
                const isExpanded = expandedIds.has(doc.id);
                const statusLabel = doc.status === "verified" ? "Approved" : "Draft";
                const isCopied = copiedId === doc.id;
                const iconPath = docIcons[doc.sectionType] ?? defaultIcon;

                return (
                  <article key={doc.id} className="rounded-xl border border-warm-200 bg-white overflow-hidden hover:border-warm-300 transition">
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        {/* Document icon */}
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          doc.status === "verified" ? "bg-emerald-50" : "bg-warm-50"
                        }`}>
                          <svg className={`h-4.5 w-4.5 ${doc.status === "verified" ? "text-emerald-500" : "text-warm-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                          </svg>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h2 className="text-sm font-bold text-warm-900">{doc.title}</h2>
                              <p className="mt-0.5 text-[11px] text-warm-400">
                                {formatDate(doc.createdAt)}{doc.wordCount > 0 ? ` · ${doc.wordCount} words` : ""}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                statusLabel === "Approved"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </div>

                          {/* Preview */}
                          {doc.isJson ? (
                            <p className="mt-2 text-xs text-warm-500 bg-warm-50 rounded-lg px-3 py-2">
                              {formatSelfAssessment(doc.aiDraft)}
                            </p>
                          ) : (
                            <p className="mt-2 text-sm text-warm-600 leading-relaxed">
                              {isExpanded
                                ? <span className="whitespace-pre-wrap">{doc.aiDraft}</span>
                                : getPreviewSentence(doc.aiDraft)}
                            </p>
                          )}

                          {/* Actions */}
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {!doc.isJson && (
                              <button
                                type="button"
                                onClick={() => toggleExpanded(doc.id)}
                                className="rounded-lg border border-warm-200 px-2.5 py-1 text-[11px] font-medium text-warm-600 hover:bg-warm-50 transition"
                              >
                                {isExpanded ? "Collapse" : "Read more"}
                              </button>
                            )}
                            {!doc.isJson && (
                              <button
                                type="button"
                                onClick={() => void handleCopy(doc.id, doc.aiDraft)}
                                className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                                  isCopied
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-warm-200 text-warm-600 hover:bg-warm-50"
                                }`}
                              >
                                {isCopied ? "Copied!" : "Copy"}
                              </button>
                            )}
                            <Link
                              href={doc.sectionType === "self_assessment" ? "/trs/self-assessment" : `/trs/${doc.sectionType}`}
                              className="rounded-lg bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-brand-700 transition"
                            >
                              {doc.isJson ? "Open" : "Edit"}
                            </Link>
                            {!doc.isJson && doc.status === "verified" && (
                              <a
                                href={`/api/export-pdf?docType=${doc.sectionType}&applicationId=${doc.id}`}
                                className="rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700 hover:bg-brand-100 transition flex items-center gap-1"
                              >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                PDF
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {filteredDocs.length === 0 && (
                <p className="text-center text-sm text-warm-400 py-8">
                  No {filter === "approved" ? "approved" : "draft"} documents yet.
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
