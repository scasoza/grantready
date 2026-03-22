"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { trsTasks, type TrsTask } from "@/lib/trs-tasks";
import { getTaskZone, getAttentionItems, type AttentionItem } from "@/lib/trs-zones";
import { parseStaffMembers, getStaffAlerts } from "@/lib/staff-utils";
import { trsDocTemplates } from "@/lib/trs-documents";
import LoadingScreen from "@/components/LoadingScreen";
import Logo from "@/components/Logo";


type Center = {
  id: string;
  center_name?: string | null;
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

function docTitle(docType: string): string {
  return trsDocTemplates.find((t) => t.docType === docType)?.title ?? docType;
}

// Category icons for prep groups
const groupIcons: Record<string, string> = {
  "Staff & Credentials": "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  "Administrative": "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  "Classroom Setup": "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  "Training": "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
};

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
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeCollapsed, setWelcomeCollapsed] = useState(false);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserEmail(user.email ?? "");

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

      const [completedResult, staffResult, appResult, subResult] = await Promise.all([
        supabase.from("center_data").select("data_value").eq("center_id", currentCenter.id).eq("data_key", "completed_tasks").maybeSingle(),
        supabase.from("center_data").select("data_value").eq("center_id", currentCenter.id).eq("data_key", "staff_members").maybeSingle(),
        supabase.from("applications").select("id").eq("center_id", currentCenter.id).eq("grant_id", "trs").maybeSingle(),
        supabase.from("submissions").select("status, requested_at").eq("center_id", currentCenter.id).order("requested_at", { ascending: false }).limit(1),
      ]);

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

      const staffMembers = parseStaffMembers(
        (staffResult.data as { data_value: string } | null)?.data_value ?? null
      );
      const staffAlerts = getStaffAlerts(staffMembers);

      let sectionRows: SectionStatus[] = [];
      if (appResult.data) {
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

      const centerJson = JSON.stringify({ ...currentCenter });
      const staleDocs: { docType: string; title: string }[] = [];
      for (const sec of sectionRows) {
        if (sec.status === "verified" && sec.input_hash && sec.input_hash !== centerJson) {
          staleDocs.push({ docType: sec.section_type, title: docTitle(sec.section_type) });
        }
      }

      setAttentionItems(getAttentionItems(staffAlerts, staleDocs));

      if (subResult.data && subResult.data.length > 0) {
        setSubmission(subResult.data[0] as SubmissionRow);
      }

      setLoading(false);
    };

    void load();
  }, [router, supabase]);

  // Show onboarding card for first-time users (no submission, not previously dismissed)
  useEffect(() => {
    if (!loading && !submission) {
      const onboarded = localStorage.getItem("careladder_onboarded");
      if (!onboarded) {
        setShowWelcome(true);
      }
    }
  }, [loading, submission]);

  const dismissWelcome = () => {
    localStorage.setItem("careladder_onboarded", "true");
    setShowWelcome(false);
    setWelcomeCollapsed(true);
  };

  const toggleWelcomeExpand = () => {
    if (welcomeCollapsed) {
      setWelcomeCollapsed(false);
      setShowWelcome(true);
    }
  };

  // ---- Derived data ----

  const sectionStatusMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sections) map.set(s.section_type, s.status);
    return map;
  }, [sections]);

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

  const prepTasks = trsTasks.filter((t) => getTaskZone(t) === "prep");
  const pendingPrep = prepTasks.filter((t) => !completedTasks.has(t.id));
  const completedPrep = prepTasks.filter((t) => completedTasks.has(t.id));

  const autoFocusZone = attentionItems.length > 0 ? "attention" as const
    : pendingPaperwork.length > 0 ? "paperwork" as const
    : pendingPrep.length > 0 ? "prep" as const
    : null;
  const activeZone = expandedZone ?? autoFocusZone;

  const totalDone = completedPaperwork.length + completedPrep.length;
  const totalTasks = paperworkTasks.length + prepTasks.length;
  const progressPct = totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0;
  const allComplete = totalDone === totalTasks && totalTasks > 0;

  // Progress milestone message
  const milestoneMsg = useMemo(() => {
    if (allComplete) return null;
    if (progressPct >= 75) return "Almost there — just a few more!";
    if (progressPct >= 50) return "Over halfway done!";
    if (progressPct >= 25) return "Great progress so far";
    return null;
  }, [progressPct, allComplete]);

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

  const saveCompletedTasks = useCallback(async (nextSet: Set<string>) => {
    if (!center) return;
    await supabase.from("center_data").upsert(
      {
        center_id: center.id,
        data_key: "completed_tasks",
        data_value: JSON.stringify(Array.from(nextSet)),
      },
      { onConflict: "center_id,data_key" }
    );
  }, [center, supabase]);

  const toggleTask = async (taskId: string) => {
    const next = new Set(completedTasks);
    if (next.has(taskId)) {
      next.delete(taskId);
    } else {
      next.add(taskId);
      setJustCompleted(taskId);
      setTimeout(() => setJustCompleted(null), 600);
    }
    setCompletedTasks(next);
    await saveCompletedTasks(next);
  };

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

  function actionHref(task: TrsTask): string | null {
    if (!task.action) return null;
    if (task.action.type === "staff-tracker") return "/staff";
    if (task.action.type === "generate-doc" && task.action.docType) return `/trs/${task.action.docType}`;
    if (task.action.type === "self-assessment" && task.action.docType) return `/trs/${task.action.docType}`;
    if (task.action.type === "link" && task.action.href) return task.action.href;
    return null;
  }

  // ---- Greeting ----
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // Don't try to extract name from email — it looks bad for addresses like "inglescomsaulo"

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
            <Logo size={32} />
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
        {/* Welcome banner */}
        {!submission && (
          <div className="rounded-xl bg-brand-800 p-4 sm:p-5">
            <p className="text-sm font-semibold text-white">
              {greeting}
            </p>
            {center?.center_name && (
              <p className="text-xs text-brand-300 mt-0.5">{center.center_name}</p>
            )}
            <p className="text-xs text-brand-200 mt-2">
              {allComplete
                ? "All tasks complete — you're ready to submit!"
                : `${totalDone} of ${totalTasks} tasks done · ${totalTasks - totalDone} remaining`}
            </p>
          </div>
        )}

        {/* First-time onboarding card */}
        {showWelcome && !submission && (
          <div className="rounded-xl bg-brand-800 p-5 sm:p-6 space-y-3">
            <div className="flex items-start justify-between">
              <h2 className="text-base font-bold text-white">Welcome to CareLadder</h2>
              <button
                type="button"
                onClick={dismissWelcome}
                className="text-brand-300 hover:text-white transition p-1 -mr-1 -mt-1"
                aria-label="Dismiss welcome card"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-brand-100 leading-relaxed">
              <strong className="text-white">Texas Rising Star (TRS) certification</strong> gets you higher
              childcare subsidy rates — typically <strong className="text-white">$800–1,400+ more per month</strong>.
            </p>
            <p className="text-sm text-brand-100 leading-relaxed">
              We&apos;ll walk you through every step: generate your documents, prep your center, and submit for you.
              No guesswork, no confusing paperwork.
            </p>
            <p className="text-sm text-brand-200 leading-relaxed">
              Most directors finish in <strong className="text-white">4–8 weeks</strong>, about 20 minutes a week.
            </p>
            <button
              type="button"
              onClick={dismissWelcome}
              className="mt-1 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50 active:scale-[0.98] transition-all"
            >
              Let&apos;s get started
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        )}

        {/* Collapsed onboarding mini-bar */}
        {welcomeCollapsed && !showWelcome && !submission && (
          <button
            type="button"
            onClick={toggleWelcomeExpand}
            className="flex items-center gap-2 w-full rounded-lg bg-brand-50 border border-brand-200 px-4 py-2.5 text-left hover:bg-brand-100 transition"
          >
            <svg className="h-4 w-4 text-brand-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium text-brand-700 flex-1">About TRS certification</span>
            <svg className="h-3.5 w-3.5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {/* Submission Status */}
        {submission?.status === "pending" && (
          <div className="rounded-xl bg-white border border-brand-200 overflow-hidden">
            <div className="bg-brand-800 p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-300/30 border-t-brand-300 shrink-0" />
                <div>
                  <p className="text-base font-bold text-white">We&apos;re preparing your submission</p>
                  <p className="text-xs text-brand-200 mt-0.5">
                    Submitted {submission.requested_at ? new Date(submission.requested_at).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "today"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-warm-800">Documents reviewed and packaged</p>
                    <p className="text-xs text-warm-400">All 6 TRS documents are ready</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 shrink-0 mt-0.5 flex items-center justify-center">
                    <div className="h-3 w-3 animate-pulse rounded-full bg-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-warm-800">Submitting to your Workforce Board</p>
                    <p className="text-xs text-warm-400">We submit the certification request on your behalf</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 shrink-0 mt-0.5 rounded-full bg-warm-200" />
                  <div>
                    <p className="text-sm text-warm-400">Assessment visit scheduled</p>
                    <p className="text-xs text-warm-300">Your Workforce Board will contact you to schedule</p>
                  </div>
                </div>
              </div>
              <div className="bg-brand-50 rounded-lg p-3 border border-brand-100">
                <p className="text-xs text-brand-700">
                  <span className="font-semibold">What happens next:</span> Our team will submit your TRS certification request to your local Workforce Solutions office within 1-2 business days. You&apos;ll receive an email confirmation when it&apos;s done. After that, your Workforce Board will assign a mentor and schedule your assessment visit.
                </p>
              </div>
              <p className="text-[11px] text-warm-400 text-center">
                Questions? Email us at support@careladder.app
              </p>
            </div>
          </div>
        )}
        {submission?.status === "completed" && (
          <div className="rounded-xl bg-white border border-brand-200 overflow-hidden">
            <div className="bg-brand-800 p-5">
              <div className="flex items-center gap-3">
                <svg className="h-8 w-8 shrink-0 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-base font-bold text-white">Application submitted to Workforce Board</p>
                  <p className="text-xs text-brand-200 mt-0.5">
                    Completed {submission.requested_at ? new Date(submission.requested_at).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : ""}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-warm-800">Documents reviewed and packaged</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-warm-800">Certification request submitted</p>
                    <p className="text-xs text-warm-400">Sent to your local Workforce Solutions office</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 shrink-0 mt-0.5 flex items-center justify-center">
                    <div className="h-3 w-3 animate-pulse rounded-full bg-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-warm-800">Waiting for assessment visit</p>
                    <p className="text-xs text-warm-400">Your Workforce Board will contact you to schedule a date — typically within 4-6 weeks</p>
                  </div>
                </div>
              </div>
              <div className="bg-brand-50 rounded-lg p-3 border border-brand-100">
                <p className="text-xs text-brand-700">
                  <span className="font-semibold">Prepare for your visit:</span> Keep all printed documents in a binder near the entrance. Make sure your daily schedules and weekly objectives are posted in each classroom. The assessor will observe classrooms for 1-1.5 hours each and review your documentation.
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/documents"
                  className="flex-1 text-center bg-warm-50 border border-warm-200 text-warm-600 py-2.5 rounded-xl text-xs font-medium transition hover:bg-warm-100"
                >
                  View my documents
                </Link>
                <Link
                  href="/staff"
                  className="flex-1 text-center bg-warm-50 border border-warm-200 text-warm-600 py-2.5 rounded-xl text-xs font-medium transition hover:bg-warm-100"
                >
                  Staff tracker
                </Link>
              </div>
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
                  <span className={`text-xs font-medium ${s.active ? "text-brand-700" : "text-warm-400"}`}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Compact progress */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 rounded-full bg-warm-100 overflow-hidden">
              <div className="h-1.5 rounded-full bg-brand-500 transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-xs font-medium text-warm-400 tabular-nums">{totalDone}/{totalTasks}</span>
          </div>
          {milestoneMsg && (
            <p className="text-xs text-brand-600 font-medium pl-0.5">{milestoneMsg}</p>
          )}
        </div>

        {/* Next step — the ONE thing to do right now */}
        {(() => {
          if (submission) return null;
          const nextDoc = pendingPaperwork[0];
          const nextDocHref = nextDoc ? `/trs/${nextDoc.action?.docType ?? nextDoc.id}` : null;

          if (nextDoc && nextDocHref) {
            return (
              <Link
                href={nextDocHref}
                className="animate-fade-up block rounded-xl bg-brand-600 p-5 shadow-md hover:bg-brand-700 active:scale-[0.98] transition-all"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Up next</p>
                <p className="mt-1 text-lg font-bold text-white">{nextDoc.title}</p>
                <p className="mt-1 text-xs text-brand-200 leading-relaxed">{nextDoc.context}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-xs font-semibold text-white">
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

        {/* All complete CTA */}
        {allComplete && !submission && (
          <Link
            href="/trs/readiness"
            className="block rounded-xl bg-brand-800 p-5 text-center shadow-lg hover:bg-brand-900 active:scale-[0.98] transition-all"
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
              className="flex items-center gap-2 w-full text-left py-2.5 px-3 rounded-xl bg-white border border-warm-100 shadow-sm hover:shadow-md active:scale-[0.99] transition-all mb-3"
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
                    className="flex items-center gap-3 rounded-lg border-l-3 border-l-amber-400 bg-amber-50/80 px-4 py-3 transition hover:bg-amber-50 active:scale-[0.99]"
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
              className="flex items-center gap-2 w-full text-left py-2.5 px-3 rounded-xl bg-white border border-warm-100 shadow-sm hover:shadow-md active:scale-[0.99] transition-all mb-3"
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
                  <div className="flex items-start gap-3 rounded-xl border border-warm-100 bg-white px-4 py-3.5 transition hover:border-warm-300 hover:bg-warm-50/50 active:scale-[0.99]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-warm-900">{task.title}</h3>
                      <p className="text-xs text-warm-500 mt-0.5 leading-relaxed">{task.context}</p>
                      <p className="text-[11px] text-warm-400 mt-1">{task.effort}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      {docStatusBadge(task)}
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
              className="flex items-center gap-2 w-full text-left py-2.5 px-3 rounded-xl bg-white border border-warm-100 shadow-sm hover:shadow-md active:scale-[0.99] transition-all mb-3"
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
            <div className="mt-3 space-y-5">
              {prepGroups.map((group) => (
                <div key={group.label}>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="h-3.5 w-3.5 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={groupIcons[group.label] ?? groupIcons["Administrative"]} />
                    </svg>
                    <h3 className="text-xs font-semibold text-warm-500 uppercase tracking-wide">
                      {group.label}
                    </h3>
                    <span className="text-[10px] text-warm-300 font-medium">{group.tasks.length}</span>
                  </div>
                  <div className="space-y-0.5">
                    {group.tasks.map((task) => {
                      const href = actionHref(task);
                      const isExternal = task.action?.type === "link";
                      const isJustDone = justCompleted === task.id;
                      return (
                        <div
                          key={task.id}
                          className={`flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-warm-50 active:bg-warm-100 transition-all ${
                            isJustDone ? "animate-pulse bg-brand-50" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => void toggleTask(task.id)}
                            className="h-5 w-5 shrink-0 rounded border-warm-300 text-brand-500 focus:ring-brand-500 cursor-pointer mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-warm-800 block">{task.title}</span>
                            <span className="text-xs text-warm-400 block mt-0.5">{task.context}</span>
                            {task.howTo && (
                              <span className="text-xs text-warm-500 block mt-1.5 bg-warm-50 rounded-lg p-2.5 leading-relaxed border border-warm-100">
                                {task.howTo}
                              </span>
                            )}
                            <span className="text-[11px] text-warm-300 block mt-0.5">{task.effort}</span>
                          </div>
                          {href && (
                            <Link
                              href={href}
                              target={isExternal ? "_blank" : undefined}
                              rel={isExternal ? "noreferrer" : undefined}
                              className="text-xs text-brand-600 hover:text-brand-700 font-medium shrink-0 py-1 px-1"
                            >
                              {task.action?.type === "link" ? "Open" : "Go"}
                            </Link>
                          )}
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
              className="flex items-center gap-2 w-full text-left py-2 px-3 rounded-lg hover:bg-warm-100 transition text-sm text-warm-400 font-medium"
            >
              <svg className={`h-4 w-4 transition-transform ${showCompleted ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              {showCompleted ? "Hide" : "Show"} {totalDone} completed task
              {totalDone !== 1 ? "s" : ""}
            </button>
            {showCompleted && (
              <div className="mt-3 space-y-1.5">
                {completedPaperwork.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg bg-warm-50/50 px-4 py-2.5"
                  >
                    <svg className="h-4 w-4 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-warm-400 line-through flex-1">{task.title}</span>
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
                    className="flex items-center gap-3 rounded-lg bg-warm-50/50 px-4 py-2.5"
                  >
                    <input
                      type="checkbox"
                      checked
                      onChange={() => void toggleTask(task.id)}
                      className="h-4 w-4 rounded border-warm-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-warm-400 line-through">{task.title}</span>
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
