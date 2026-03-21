"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { trsTasks, categoryLabels, categoryColors, type TrsTask } from "@/lib/trs-tasks";
import { getTaskZone, getAttentionItems, type AttentionItem } from "@/lib/trs-zones";
import { parseStaffMembers, getStaffAlerts } from "@/lib/staff-utils";
import { trsDocTemplates } from "@/lib/trs-documents";
import LoadingScreen from "@/components/LoadingScreen";


type Center = {
  id: string;
  ccs_count?: number | null;
};

type SectionStatus = {
  section_type: string;
  status: string;
  input_hash: string | null;
};

type SubmissionRow = {
  status: string;
  requested_at: string;
};

// Derive doc title from docType
function docTitle(docType: string): string {
  return trsDocTemplates.find((t) => t.docType === docType)?.title ?? docType;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [center, setCenter] = useState<Center | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [sections, setSections] = useState<SectionStatus[]>([]);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [submission, setSubmission] = useState<SubmissionRow | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedZone, setExpandedZone] = useState<"attention" | "paperwork" | "prep" | null>(null);

  useEffect(() => {
    const load = async () => {
      // 1. Auth
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserEmail(user.email ?? "");

      // 2. Center
      const { data: centerRows } = await supabase
        .from("centers")
        .select("*")
        .eq("user_id", user.id)
        .limit(1);
      if (!centerRows || centerRows.length === 0) {
        router.replace("/onboarding");
        return;
      }
      const currentCenter = centerRows[0] as Center;
      setCenter(currentCenter);

      // 3-6. Load all data in parallel
      const [completedResult, staffResult, appResult, subResult] = await Promise.all([
        supabase.from("center_data").select("data_value").eq("center_id", currentCenter.id).eq("data_key", "completed_tasks").maybeSingle(),
        supabase.from("center_data").select("data_value").eq("center_id", currentCenter.id).eq("data_key", "staff_members").maybeSingle(),
        supabase.from("applications").select("id").eq("center_id", currentCenter.id).eq("grant_id", "trs").maybeSingle(),
        supabase.from("submissions").select("status, requested_at").eq("center_id", currentCenter.id).order("requested_at", { ascending: false }).limit(1),
      ]);

      // Completed prep tasks
      if (completedResult.data?.data_value) {
        try {
          const raw = completedResult.data.data_value;
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          if (Array.isArray(parsed)) {
            setCompletedTasks(new Set(parsed.filter((id): id is string => typeof id === "string")));
          }
        } catch {
          setCompletedTasks(new Set());
        }
      }

      // Staff members + alerts
      const staffMembers = parseStaffMembers(
        (staffResult.data as { data_value: string } | null)?.data_value ?? null
      );
      const staffAlerts = getStaffAlerts(staffMembers);

      // TRS application + sections
      let sectionRows: SectionStatus[] = [];
      if (appResult.data) {
        // Try with input_hash, fall back without if column doesn't exist
        let secData = null;
        const { data: d1, error: e1 } = await supabase
          .from("application_sections")
          .select("section_type, status, input_hash")
          .eq("application_id", appResult.data.id);
        if (e1?.message?.includes("input_hash")) {
          const { data: d2 } = await supabase
            .from("application_sections")
            .select("section_type, status")
            .eq("application_id", appResult.data.id);
          secData = d2;
        } else {
          secData = d1;
        }
        sectionRows = (secData as SectionStatus[] | null) ?? [];
      }
      setSections(sectionRows);

      // Stale document detection
      const centerJson = JSON.stringify({ ...currentCenter });
      const staleDocs: { docType: string; title: string }[] = [];
      for (const sec of sectionRows) {
        if (sec.status === "verified" && sec.input_hash && sec.input_hash !== centerJson) {
          staleDocs.push({ docType: sec.section_type, title: docTitle(sec.section_type) });
        }
      }

      setAttentionItems(getAttentionItems(staffAlerts, staleDocs));

      // Submission status
      if (subResult.data && subResult.data.length > 0) {
        setSubmission(subResult.data[0] as SubmissionRow);
      }

      setLoading(false);
    };

    void load();
  }, [router, supabase]);

  // ---- Derived data ----

  const sectionStatusMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sections) map.set(s.section_type, s.status);
    return map;
  }, [sections]);

  // Paperwork tasks (Zone 2)
  const paperworkTasks = trsTasks.filter((t) => getTaskZone(t) === "paperwork");
  const pendingPaperwork = paperworkTasks.filter((t) => {
    const docType = t.action?.docType;
    if (!docType) return true;
    return sectionStatusMap.get(docType) !== "verified";
  });
  const completedPaperwork = paperworkTasks.filter((t) => {
    const docType = t.action?.docType;
    if (!docType) return false;
    return sectionStatusMap.get(docType) === "verified";
  });

  // Prep tasks (Zone 3)
  const prepTasks = trsTasks.filter((t) => getTaskZone(t) === "prep");
  const pendingPrep = prepTasks.filter((t) => !completedTasks.has(t.id));
  const completedPrep = prepTasks.filter((t) => completedTasks.has(t.id));

  // Auto-determine which zone to focus on
  const autoFocusZone = attentionItems.length > 0 ? "attention" as const
    : pendingPaperwork.length > 0 ? "paperwork" as const
    : pendingPrep.length > 0 ? "prep" as const
    : null;
  const activeZone = expandedZone ?? autoFocusZone;

  // Progress
  const totalDone = completedPaperwork.length + completedPrep.length;
  const totalTasks = paperworkTasks.length + prepTasks.length;
  const progressPct = totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0;
  const allComplete = totalDone === totalTasks && totalTasks > 0;

  // Group prep tasks
  const prepGroups = useMemo(() => {
    const groups: { label: string; tasks: TrsTask[] }[] = [
      { label: "Staff & Credentials", tasks: [] },
      { label: "Administrative", tasks: [] },
      { label: "Classroom Setup", tasks: [] },
      { label: "Training", tasks: [] },
    ];
    const catIndex: Record<string, number> = { staff: 0, admin: 1, room: 2, training: 3 };
    for (const t of pendingPrep) {
      const idx = catIndex[t.category] ?? 1;
      groups[idx].tasks.push(t);
    }
    return groups.filter((g) => g.tasks.length > 0);
  }, [pendingPrep]);

  // ---- Task toggle ----

  const saveCompletedTasks = async (nextSet: Set<string>) => {
    if (!center) return;
    await supabase.from("center_data").upsert(
      {
        center_id: center.id,
        data_key: "completed_tasks",
        data_value: JSON.stringify(Array.from(nextSet)),
      },
      { onConflict: "center_id,data_key" }
    );
  };

  const toggleTask = async (taskId: string) => {
    const next = new Set(completedTasks);
    if (next.has(taskId)) {
      next.delete(taskId);
    } else {
      next.add(taskId);
    }
    setCompletedTasks(next);
    await saveCompletedTasks(next);
  };

  // ---- Sign out ----

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // ---- Status badge for paperwork ----

  function docStatusBadge(task: TrsTask) {
    const docType = task.action?.docType;
    if (!docType) return null;
    const status = sectionStatusMap.get(docType);
    if (status === "verified") {
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-brand-700">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Done
        </span>
      );
    }
    if (status && status !== "pending") {
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Draft
        </span>
      );
    }
    return (
      <span className="text-xs text-warm-400">Start →</span>
    );
  }

  // ---- Action href helper ----

  function actionHref(task: TrsTask): string | null {
    if (!task.action) return null;
    if (task.action.type === "staff-tracker") return "/staff";
    if (task.action.type === "generate-doc" && task.action.docType) return `/trs/${task.action.docType}`;
    if (task.action.type === "self-assessment" && task.action.docType) return `/trs/${task.action.docType}`;
    if (task.action.type === "link" && task.action.href) return task.action.href;
    return null;
  }

  // ---- Render ----

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-warm-50 text-warm-900">
      {/* Nav */}
      <nav className="border-b border-warm-200/60 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-extrabold text-white">
              C
            </span>
            <span className="text-sm font-bold text-warm-900">CareLadder</span>
          </Link>
          <button
            onClick={() => void handleSignOut()}
            className="text-xs text-warm-400 hover:text-warm-600 transition py-2"
          >
            Sign out
          </button>
        </div>
      </nav>


      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 pb-24 sm:pb-8 space-y-4">
        {/* Submission Banner */}
        {submission?.status === "pending" && (
          <div className="flex items-center gap-3 rounded-xl bg-brand-50 border border-brand-200 p-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-brand-800">Your application is being submitted</p>
              <p className="text-xs text-brand-600">We&apos;ll update you when it&apos;s done.</p>
            </div>
          </div>
        )}
        {submission?.status === "completed" && (
          <div className="flex items-center gap-3 rounded-xl bg-brand-800 p-4 text-white">
            <svg className="h-6 w-6 shrink-0 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold">Application submitted</p>
              <p className="text-xs text-brand-200">Your TRS certification request has been sent to your Workforce Board.</p>
            </div>
          </div>
        )}

        {/* Journey steps */}
        {!submission && (
          <div className="flex items-center gap-1 px-1">
            {[
              { label: "Documents", done: pendingPaperwork.length === 0 && completedPaperwork.length > 0, active: autoFocusZone === "paperwork" || autoFocusZone === "attention" },
              { label: "Center prep", done: pendingPrep.length === 0 && completedPrep.length > 0, active: autoFocusZone === "prep" },
              { label: "Submit", done: !!submission, active: allComplete },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center flex-1">
                {i > 0 && <div className={`h-px flex-1 mx-1 ${s.done || s.active ? "bg-brand-400" : "bg-warm-200"}`} />}
                <div className="flex flex-col items-center gap-1">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                    s.done ? "bg-brand-500 text-white" : s.active ? "bg-brand-100 text-brand-700 ring-2 ring-brand-500" : "bg-warm-100 text-warm-400"
                  }`}>
                    {s.done ? (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : i + 1}
                  </div>
                  <span className={`text-[10px] font-medium ${s.active ? "text-brand-700" : "text-warm-400"}`}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Next step — the ONE thing to do right now */}
        {(() => {
          if (submission) return null;
          // Determine next action
          const nextDoc = pendingPaperwork[0];
          const nextDocHref = nextDoc ? `/trs/${nextDoc.action?.docType ?? nextDoc.id}` : null;

          if (nextDoc && nextDocHref) {
            return (
              <Link
                href={nextDocHref}
                className="animate-fade-up block rounded-xl bg-brand-600 p-5 shadow-md hover:bg-brand-700 transition"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-300">Up next</p>
                <p className="mt-1 text-lg font-bold text-white">{nextDoc.title}</p>
                <p className="mt-1 text-xs text-brand-200">{nextDoc.context}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white">
                  Start now
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </Link>
            );
          }
          return null;
        })()}

        {/* Phase complete celebration */}
        {pendingPaperwork.length === 0 && completedPaperwork.length > 0 && pendingPrep.length > 0 && !submission && (
          <div className="flex items-center gap-2 rounded-lg bg-brand-50 border border-brand-200 px-4 py-2.5">
            <svg className="h-4 w-4 text-brand-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs font-medium text-brand-700">Documents complete — now finish your center prep below</p>
          </div>
        )}

        {/* Compact progress */}
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 rounded-full bg-warm-100">
            <div className="h-1.5 rounded-full bg-brand-500 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-xs font-medium text-warm-400">{totalDone}/{totalTasks}</span>
        </div>

        {allComplete && !submission && (
          <Link
            href="/trs/readiness"
            className="block rounded-xl bg-brand-800 p-5 text-center shadow-lg hover:bg-brand-900 transition"
          >
            <svg className="mx-auto h-8 w-8 text-brand-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
            <p className="text-lg font-bold text-white">Everything looks great</p>
            <p className="mt-1 text-sm text-brand-200">Tap to review your application and submit</p>
          </Link>
        )}

        {/* Zone 1: Needs your attention */}
        {attentionItems.length > 0 && (
          <section>
            <button
              type="button"
              onClick={() => setExpandedZone(activeZone === "attention" ? null : "attention")}
              className="flex items-center gap-2 w-full text-left py-2.5 px-3 rounded-xl bg-white border border-warm-100 shadow-sm mb-3"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">{attentionItems.length}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-warm-900">Needs your attention</h2>
                {activeZone !== "attention" && (
                  <p className="text-xs text-warm-400 truncate">{attentionItems[0]?.message}</p>
                )}
              </div>
              <svg className={`h-4 w-4 text-warm-400 transition-transform ${activeZone === "attention" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {activeZone === "attention" && (
              <div className="space-y-2">
                {attentionItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.actionHref}
                    className="flex items-center gap-3 rounded-lg border-l-3 border-l-amber-400 bg-amber-50/80 px-4 py-3 transition hover:bg-amber-50"
                  >
                    <svg className="h-5 w-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-amber-900">{item.title}</p>
                      <p className="text-xs text-amber-700">{item.message}</p>
                    </div>
                    <svg className="h-4 w-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Zone 2: Your paperwork */}
        {pendingPaperwork.length > 0 && (
          <section>
            <button
              type="button"
              onClick={() => setExpandedZone(activeZone === "paperwork" ? null : "paperwork")}
              className="flex items-center gap-2 w-full text-left py-2.5 px-3 rounded-xl bg-white border border-warm-100 shadow-sm mb-3"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-100 text-brand-700 text-xs font-bold">{pendingPaperwork.length}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-warm-900">Your paperwork</h2>
                {activeZone !== "paperwork" && (
                  <p className="text-xs text-warm-400">{pendingPaperwork.length} document{pendingPaperwork.length !== 1 ? "s" : ""} to generate</p>
                )}
              </div>
              <svg className={`h-4 w-4 text-warm-400 transition-transform ${activeZone === "paperwork" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {activeZone === "paperwork" && (
            <div className="space-y-2">
              {pendingPaperwork.map((task, idx) => {
                const href = actionHref(task);
                const card = (
                  <div className="flex items-center gap-3 rounded-lg border border-warm-100 bg-white px-4 py-3 transition hover:border-warm-300 hover:bg-warm-50/50">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-warm-900">{task.title}</h3>
                      <p className="text-xs text-warm-500 line-clamp-1">{task.context}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {docStatusBadge(task)}
                      <svg className="h-4 w-4 text-warm-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                );
                return href ? (
                  <Link key={task.id} href={href} className="block">
                    {card}
                  </Link>
                ) : (
                  <div key={task.id}>{card}</div>
                );
              })}
            </div>
            )}
          </section>
        )}

        {/* Zone 3: Your center prep */}
        {pendingPrep.length > 0 && (
          <section>
            <button
              type="button"
              onClick={() => setExpandedZone(activeZone === "prep" ? null : "prep")}
              className="flex items-center gap-2 w-full text-left py-2.5 px-3 rounded-xl bg-white border border-warm-100 shadow-sm mb-3"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-warm-200 text-warm-500 text-xs font-bold">{pendingPrep.length}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-warm-700">Center prep</h2>
                {activeZone !== "prep" && (
                  <p className="text-xs text-warm-400">{pendingPrep.length} task{pendingPrep.length !== 1 ? "s" : ""} to check off</p>
                )}
              </div>
              <svg className={`h-4 w-4 text-warm-400 transition-transform ${activeZone === "prep" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {activeZone === "prep" && (
            <div className="mt-3 space-y-4">
              {prepGroups.map((group) => (
                <div key={group.label}>
                  <h3 className="text-xs font-medium text-warm-400 mb-2">
                    {group.label}
                  </h3>
                  <div className="space-y-3">
                    {group.tasks.map((task) => {
                      const href = actionHref(task);
                      const isExternal = task.action?.type === "link";
                      return (
                        <div
                          key={task.id}
                          className="rounded-lg border border-warm-100 bg-white px-4 py-3"
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={false}
                              onChange={() => void toggleTask(task.id)}
                              className="mt-0.5 h-5 w-5 shrink-0 rounded border-warm-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                            />
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-semibold text-warm-900">{task.title}</h3>
                              <p className="mt-0.5 text-xs text-warm-500 line-clamp-2">{task.context}</p>
                              {href && (
                                <div className="mt-2">
                                  <Link
                                    href={href}
                                    target={isExternal ? "_blank" : undefined}
                                    rel={isExternal ? "noreferrer" : undefined}
                                    className="inline-flex rounded-lg border border-warm-200 px-4 py-2 text-sm font-medium text-warm-700 hover:bg-warm-100"
                                  >
                                    {task.action!.label}
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            )}
          </section>
        )}

        {/* Completed section */}
        {(completedPaperwork.length > 0 || completedPrep.length > 0) && (
          <section>
            <button
              type="button"
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 w-full text-left py-2 px-3 rounded-lg hover:bg-warm-100 transition"
            >
              <svg className={`h-4 w-4 text-warm-400 transition-transform ${showCompleted ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              {showCompleted ? "Hide" : "Show"} {totalDone} completed task
              {totalDone !== 1 ? "s" : ""}
            </button>
            {showCompleted && (
              <div className="mt-3 space-y-2">
                {completedPaperwork.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg bg-warm-50/50 px-4 py-2"
                  >
                    <svg className="h-4 w-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-warm-500 line-through flex-1">{task.title}</span>
                    <Link
                      href={`/trs/${task.action?.docType ?? task.id}`}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700 py-1 px-2 shrink-0"
                    >
                      View
                    </Link>
                  </div>
                ))}
                {completedPrep.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg bg-warm-50/50 px-4 py-2"
                  >
                    <input
                      type="checkbox"
                      checked
                      onChange={() => void toggleTask(task.id)}
                      className="h-4 w-4 rounded border-warm-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-warm-500 line-through">{task.title}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </main>
    </div>
  );
}
