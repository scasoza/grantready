"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { grants } from "@/lib/grants";
import { createClient } from "@/lib/supabase/client";
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
  grantName: string;
  createdAt: string | null;
  status: SectionStatus | null;
  aiDraft: string;
}

function formatSectionType(value: string) {
  return value
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
        const grant = grants.find((item) => String(item.id) === String(app.grant_id));
        grantNameByApplicationId.set(app.id, grant?.name ?? "Unknown Grant");
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
        .map((row) => ({
          id: row.id,
          sectionType: row.section_type,
          grantName: grantNameByApplicationId.get(row.application_id) ?? "Unknown Grant",
          createdAt: row.created_at ?? null,
          status: row.status,
          aiDraft: row.ai_draft ?? "",
        }))
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
      <nav className="sticky top-0 z-40 border-b border-warm-200/40 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="text-warm-400 hover:text-warm-600 transition p-2 -m-2" aria-label="Back to dashboard">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-warm-900">Documents</h1>
            <p className="text-xs text-warm-400">{documents.length} generated</p>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {documents.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-warm-200 bg-white p-6">
            <p className="text-warm-800">
              No documents yet. Start working on your TRS roadmap to generate documents.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {documents.map((document) => {
              const isExpanded = expandedIds.has(document.id);
              const statusLabel = document.status === "verified" ? "Approved" : "Draft";
              const previewText = document.aiDraft.slice(0, 150);

              return (
                <article key={document.id} className="rounded-2xl border border-warm-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-warm-900">
                        {formatSectionType(document.sectionType)}
                      </h2>
                      <p className="mt-1 text-sm text-warm-700">{document.grantName}</p>
                      <p className="mt-1 text-xs text-warm-500">
                        Created {formatDate(document.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusLabel === "Approved"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm text-warm-800">
                    {isExpanded
                      ? document.aiDraft
                      : `${previewText}${document.aiDraft.length > 150 ? "..." : ""}`}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(document.id)}
                      className="rounded-xl border border-warm-200 px-4 py-2 text-sm font-medium text-warm-800 hover:bg-warm-100"
                    >
                      {isExpanded ? "Collapse" : "View full"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCopy(document.aiDraft)}
                      className="rounded-xl border border-warm-200 px-4 py-2 text-sm font-medium text-warm-800 hover:bg-warm-100"
                    >
                      Copy
                    </button>
                    <Link
                      href={`/trs/${document.sectionType}`}
                      className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
                    >
                      Edit
                    </Link>
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
