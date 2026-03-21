"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { trsTasks, type TrsTask } from "@/lib/trs-tasks";
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
  const [showAttention, setShowAttention] = useState(true);
  const [expandedPrepGroup, setExpandedPrepGroup] = useState<string | null>(null);
  const [showAllPaperwork, setShowAllPaperwork] = useState(false);

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

  // Progress
  const totalDone = completedPaperwork.length + completedPrep.length;
  const totalTasks = paperworkTasks.length + prepTasks.length;
  const progressPct = totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0;
  const allComplete = totalDone === totalTasks && totalTasks > 0;

  // Estimate time remaining from pending task effort strings
  const estimatedMinutes = useMemo(() => {
    const pending = [...pendingPaperwork, ...pendingPrep];
    let mins = 0;
    for (const t of pending) {
      const m = t.effort.match(/(\d+)/);
      if (m) mins += parseInt(m[1], 10);
    }
    return mins;
  }, [pendingPaperwork, pendingPrep]);

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
      {/* Nav — compact app-style header */}
      <nav className="sticky top-0 z-40 border-b border-warm-200/60 bg-white/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-extrabold text-white">
              G
            </span>
            <div className="hidden sm:block">
              <span className="text-sm font-bold text-warm-900">GrantReady</span>
            </div>
            <div className="sm:hidden">
              <p className="text-sm font-bold text-warm-900">My Dashboard</p>
            </div>
          </div>
          <button
            onClick={() => void handleSignOut()}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-warm-400 hover:text-warm-600 hover:bg-warm-100 transition active:bg-warm-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </nav>


      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 pb-28 sm:pb-8 space-y-5">
        {/* Submission Banner */}
        {submission?.status === "pending" && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            Your application has been submitted &mdash; we&apos;re handling it.
          </div>
        )}
        {submission?.status === "completed" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Your TRS application was submitted to your Workforce Board.
          </div>
        )}

        {/* Hero: Current Step — wizard-style focus card */}
        {!submission && (
          <section className="animate-fade-up">
            {/* Step indicator — connected dots on mobile, pills on desktop */}
            <div className="flex items-center mb-4 px-1">
              {["Paperwork", "Center Prep", "Submit"].map((label, i) => {
                const stepDone = i === 0 ? pendingPaperwork.length === 0 : i === 1 ? pendingPrep.length === 0 : !!submission;
                const stepActive = i === 0 ? pendingPaperwork.length > 0 : i === 1 ? pendingPaperwork.length === 0 && pendingPrep.length > 0 : allComplete;
                return (
                  <div key={label} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        stepDone ? "bg-brand-500 text-white" : stepActive ? "bg-brand-600 text-white ring-2 ring-brand-200 ring-offset-1" : "bg-warm-200 text-warm-500"
                      }`}>
                        {stepDone ? (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span>{i + 1}</span>
                        )}
                      </div>
                      <span className={`text-[10px] font-medium leading-tight ${
                        stepDone ? "text-brand-600" : stepActive ? "text-brand-700 font-semibold" : "text-warm-400"
                      }`}>{label}</span>
                    </div>
                    {i < 2 && (
                      <div className={`h-0.5 flex-1 mx-2 mb-4 rounded ${stepDone ? "bg-brand-400" : "bg-warm-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Primary action card */}
            {totalDone === 0 ? (
              /* First visit — welcome + start */
              <Link
                href={pendingPaperwork.length > 0 ? `/trs/${pendingPaperwork[0].action?.docType ?? pendingPaperwork[0].id}` : "/staff"}
                className="block rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white shadow-lg active:scale-[0.98] transition-transform"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">Step 1 of {totalTasks}</p>
                <h2 className="mt-1 text-lg font-bold leading-snug">
                  {pendingPaperwork.length > 0 ? pendingPaperwork[0].title : "Get started"}
                </h2>
                <p className="mt-1.5 text-sm text-brand-200 leading-relaxed">
                  {pendingPaperwork.length > 0 ? pendingPaperwork[0].context : "Set up your center for TRS certification."}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm">
                  Start here
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </Link>
            ) : pendingPaperwork.length > 0 ? (
              /* In progress — next step */
              <Link
                href={`/trs/${pendingPaperwork[0].action?.docType ?? pendingPaperwork[0].id}`}
                className="block rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white shadow-lg active:scale-[0.98] transition-transform"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">Up next</p>
                <h2 className="mt-1 text-lg font-bold leading-snug">{pendingPaperwork[0].title}</h2>
                <p className="mt-1 text-sm text-brand-200">{pendingPaperwork[0].context}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm">
                    Continue
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <span className="text-xs text-brand-300">{pendingPaperwork[0].effort}</span>
                </div>
              </Link>
            ) : pendingPrep.length > 0 ? (
              /* Paperwork done, prep remaining */
              <div className="rounded-2xl bg-gradient-to-br from-warm-700 to-warm-900 p-5 text-white shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-wider text-warm-300">Paperwork complete — now prep your center</p>
                <h2 className="mt-1 text-lg font-bold leading-snug">
                  {prepGroups.length > 0 ? prepGroups[0].tasks[0]?.title : "Center prep tasks"}
                </h2>
                <p className="mt-1 text-sm text-warm-300">{pendingPrep.length} tasks remaining</p>
                <div className="mt-3 text-xs text-warm-400">Scroll down to check off tasks as you go</div>
              </div>
            ) : allComplete ? (
              /* All done — submit */
              <Link
                href="/trs/readiness"
                className="block rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white shadow-lg active:scale-[0.98] transition-transform animate-pulse-ring"
              >
                <div className="flex items-center gap-2 mb-2">
                  <svg className="h-5 w-5 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">All tasks complete</p>
                </div>
                <h2 className="text-lg font-bold">Ready to submit your application</h2>
                <p className="mt-1 text-sm text-emerald-200">Everything looks good. Review and submit to your Workforce Board.</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/25 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm">
                  Review &amp; submit
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </Link>
            ) : null}
          </section>
        )}

        {/* Progress ring + breakdown */}
        <section className="animate-fade-up animate-delay-100 rounded-2xl bg-white p-4 border border-warm-200/80 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="#e2e8f0" strokeWidth="4.5" />
                <circle cx="28" cy="28" r="24" fill="none" stroke="#0d9488" strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${2 * Math.PI * 24 * (1 - progressPct / 100)}`}
                  className="transition-all duration-700"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-brand-700">{progressPct}%</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-warm-900">{totalDone} of {totalTasks} tasks</p>
              <div className="flex gap-3 mt-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  <span className="text-[11px] text-warm-500">{completedPaperwork.length}/{paperworkTasks.length} docs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-warm-400" />
                  <span className="text-[11px] text-warm-500">{completedPrep.length}/{prepTasks.length} prep</span>
                </div>
              </div>
              {estimatedMinutes > 0 && !allComplete && (
                <p className="text-[11px] text-warm-400 mt-1">
                  ~{estimatedMinutes >= 60 ? `${Math.round(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m` : `${estimatedMinutes} min`} estimated remaining
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Zone 1: Needs your attention — prominent alert cards */}
        {attentionItems.length > 0 && (
          <section className="animate-fade-up animate-delay-200">
            <button
              type="button"
              onClick={() => setShowAttention(!showAttention)}
              className="flex items-center gap-2 mb-3 w-full text-left py-1"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">{attentionItems.length}</span>
              <h2 className="text-sm font-bold text-warm-900 flex-1">Needs your attention</h2>
              <svg className={`h-4 w-4 text-warm-400 transition-transform ${showAttention ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showAttention && (
              <div className="space-y-2">
                {attentionItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.actionHref}
                    className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 transition active:scale-[0.98] hover:bg-amber-100/60"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                      <svg className="h-4.5 w-4.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-amber-900">{item.title}</p>
                      <p className="text-xs text-amber-700 mt-0.5">{item.message}</p>
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

        {/* Zone 2: Your paperwork — card-style with effort + status */}
        {pendingPaperwork.length > 0 && (
          <section className="animate-fade-up animate-delay-200">
            <div className="flex items-center gap-2 mb-3 px-1">
              <svg className="h-4.5 w-4.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-sm font-bold text-warm-900 flex-1">Paperwork</h2>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">{pendingPaperwork.length} left</span>
            </div>
            <div className="space-y-2">
              {(showAllPaperwork ? pendingPaperwork : pendingPaperwork.slice(0, 3)).map((task, idx) => {
                const href = actionHref(task);
                const isNext = idx === 0;
                const card = (
                  <div className={`rounded-xl border bg-white px-4 py-3.5 transition active:scale-[0.98] ${
                    isNext ? "border-brand-200 shadow-sm" : "border-warm-100"
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        isNext ? "bg-brand-600 text-white" : "bg-warm-100 text-warm-500"
                      }`}>
                        {completedPaperwork.length + idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-warm-900">{task.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {docStatusBadge(task)}
                          <span className="text-[11px] text-warm-400">· {task.effort}</span>
                        </div>
                      </div>
                      <svg className={`h-4 w-4 shrink-0 ${isNext ? "text-brand-400" : "text-warm-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
              {pendingPaperwork.length > 3 && !showAllPaperwork && (
                <button
                  type="button"
                  onClick={() => setShowAllPaperwork(true)}
                  className="w-full rounded-xl border border-dashed border-warm-200 py-2.5 text-xs font-medium text-warm-500 active:bg-warm-100"
                >
                  Show {pendingPaperwork.length - 3} more
                </button>
              )}
            </div>
          </section>
        )}

        {/* Zone 3: Center prep — accordion groups with category icons */}
        {pendingPrep.length > 0 && (
          <section className="animate-fade-up animate-delay-300">
            <div className="flex items-center gap-2 mb-3 px-1">
              <svg className="h-4.5 w-4.5 text-warm-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <h2 className="text-sm font-bold text-warm-900 flex-1">Center Prep</h2>
              <span className="rounded-full bg-warm-100 px-2 py-0.5 text-xs font-semibold text-warm-500">{pendingPrep.length} left</span>
            </div>
            <div className="space-y-2">
              {prepGroups.map((group, gi) => {
                const isExpanded = expandedPrepGroup === group.label || (expandedPrepGroup === null && gi === 0);
                const groupIcon: Record<string, string> = {
                  "Staff & Credentials": "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
                  "Administrative": "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
                  "Classroom Setup": "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
                  "Training": "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
                };
                return (
                  <div key={group.label} className="rounded-xl border border-warm-100 bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedPrepGroup(isExpanded ? "__none__" : group.label)}
                      className="flex items-center gap-3 w-full px-4 py-3.5 text-left"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warm-100">
                        <svg className="h-4 w-4 text-warm-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={groupIcon[group.label] ?? groupIcon["Administrative"]} />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-warm-900">{group.label}</h3>
                        <p className="text-xs text-warm-400">{group.tasks.length} task{group.tasks.length !== 1 ? "s" : ""}</p>
                      </div>
                      <svg className={`h-4 w-4 text-warm-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-warm-100 divide-y divide-warm-50">
                        {group.tasks.map((task) => {
                          const href = actionHref(task);
                          const isExternal = task.action?.type === "link";
                          return (
                            <div key={task.id} className="px-4 py-3.5">
                              <div className="flex items-start gap-3">
                                <button
                                  type="button"
                                  onClick={() => void toggleTask(task.id)}
                                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-warm-300 transition hover:border-brand-400 active:border-brand-500 active:bg-brand-50"
                                  aria-label={`Mark "${task.title}" complete`}
                                >
                                  <svg className="h-4 w-4 text-warm-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-sm font-medium text-warm-900">{task.title}</h4>
                                  <p className="mt-0.5 text-xs text-warm-500 leading-relaxed">{task.context}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[11px] text-warm-400">{task.effort}</span>
                                    {href && (
                                      <Link
                                        href={href}
                                        target={isExternal ? "_blank" : undefined}
                                        rel={isExternal ? "noreferrer" : undefined}
                                        className="inline-flex items-center gap-1 rounded-lg bg-warm-100 px-3 py-1.5 text-xs font-medium text-warm-700 active:bg-warm-200"
                                      >
                                        {task.action!.label}
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Completed section — collapsible with visual polish */}
        {totalDone > 0 && (
          <section>
            <button
              type="button"
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 w-full text-left py-2 px-1"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium text-warm-600 flex-1">
                {totalDone} completed
              </span>
              <svg className={`h-4 w-4 text-warm-400 transition-transform ${showCompleted ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showCompleted && (
              <div className="mt-2 rounded-xl border border-warm-100 bg-white divide-y divide-warm-50 overflow-hidden">
                {completedPaperwork.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-warm-500 flex-1">{task.title}</span>
                    <Link
                      href={`/trs/${task.action?.docType ?? task.id}`}
                      className="text-xs font-medium text-brand-600 rounded-lg px-2.5 py-1 active:bg-brand-50"
                    >
                      View
                    </Link>
                  </div>
                ))}
                {completedPrep.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <button
                      type="button"
                      onClick={() => void toggleTask(task.id)}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-500 active:bg-brand-600"
                      aria-label={`Uncheck "${task.title}"`}
                    >
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <span className="text-sm text-warm-500">{task.title}</span>
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
