"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { trsTasks, categoryLabels, categoryColors, type TrsTask } from "@/lib/trs-tasks";
import { getTaskZone, getAttentionItems, type AttentionItem } from "@/lib/trs-zones";
import { parseStaffMembers, getStaffAlerts } from "@/lib/staff-utils";
import { trsDocTemplates } from "@/lib/trs-documents";

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
        const { data: secData } = await supabase
          .from("application_sections")
          .select("section_type, status, input_hash")
          .eq("application_id", appResult.data.id);
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
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          Verified
        </span>
      );
    }
    if (status && status !== "pending") {
      return (
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          Generated
        </span>
      );
    }
    return (
      <span className="rounded-full bg-warm-100 px-2.5 py-0.5 text-xs font-medium text-warm-600">
        Not started
      </span>
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
    return (
      <div className="min-h-screen bg-warm-50 text-warm-900">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 text-warm-900">
      {/* Nav */}
      <nav className="border-b border-warm-200 bg-white/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-warm-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-sm font-extrabold text-white">
              G
            </span>
            GrantReady
          </Link>
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-warm-600 hidden sm:inline truncate max-w-[200px]">{userEmail}</span>
            <button
              onClick={() => void handleSignOut()}
              className="rounded-xl bg-brand-500 px-4 py-2 text-white hover:bg-brand-600 whitespace-nowrap"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-warm-200 bg-white/95 backdrop-blur-sm sm:hidden">
        <div className="flex justify-around py-2">
          <span className="flex flex-col items-center gap-0.5 text-brand-600 text-xs font-semibold py-1 px-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            Dashboard
          </span>
          <Link href="/staff" className="flex flex-col items-center gap-0.5 text-warm-400 text-xs py-1 px-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Staff
          </Link>
          <Link href="/documents" className="flex flex-col items-center gap-0.5 text-warm-400 text-xs py-1 px-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Documents
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 pb-24 sm:pb-8 space-y-6">
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

        {/* Next step suggestion */}
        {pendingPaperwork.length > 0 && !submission && (
          <Link
            href={`/trs/${pendingPaperwork[0].action?.docType ?? pendingPaperwork[0].id}`}
            className="block rounded-2xl border border-brand-200 bg-brand-50 p-4 hover:bg-brand-100 transition"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Next step</p>
            <p className="mt-1 font-semibold text-warm-900">{pendingPaperwork[0].title}</p>
            <p className="mt-0.5 text-sm text-warm-500">{pendingPaperwork[0].context}</p>
          </Link>
        )}

        {/* Progress */}
        <section className="rounded-2xl border border-warm-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-warm-900">TRS Certification</h1>
              <p className="mt-1 text-sm text-warm-500">
                {totalDone} of {totalTasks} tasks complete
              </p>
            </div>
            <span className="text-2xl font-bold text-brand-600">{progressPct}%</span>
          </div>
          <div className="mt-4 h-3 w-full rounded-full bg-warm-100">
            <div
              className="h-3 rounded-full bg-brand-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {allComplete && !submission && (
            <div className="mt-4">
              <Link
                href="/trs/readiness"
                className="inline-flex rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:from-brand-600 hover:to-brand-700"
              >
                Ready to submit
              </Link>
            </div>
          )}
        </section>

        {/* Zone 1: Needs your attention */}
        {attentionItems.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-warm-900">Needs your attention</h2>
            <div className="mt-3 space-y-3">
              {attentionItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.actionHref}
                  className="block rounded-2xl border border-amber-200 bg-amber-50 p-4 transition hover:border-amber-300"
                >
                  <p className="font-semibold text-amber-900">{item.title}</p>
                  <p className="mt-1 text-sm text-amber-700">{item.message}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Zone 2: Your paperwork */}
        {pendingPaperwork.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-warm-900">Your paperwork</h2>
            <div className="mt-3 space-y-3">
              {pendingPaperwork.map((task) => {
                const href = actionHref(task);
                const card = (
                  <div className="rounded-2xl border border-warm-200 bg-white p-4 transition hover:border-warm-300">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-warm-900">{task.title}</h3>
                        <p className="mt-1 text-sm text-warm-500">{task.context}</p>
                      </div>
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
          </section>
        )}

        {/* Zone 3: Your center prep */}
        {pendingPrep.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-warm-900">Your center prep</h2>
            <div className="mt-3 space-y-5">
              {prepGroups.map((group) => (
                <div key={group.label}>
                  <h3 className="text-sm font-semibold text-warm-600 uppercase tracking-wide mb-2">
                    {group.label}
                  </h3>
                  <div className="space-y-3">
                    {group.tasks.map((task) => {
                      const href = actionHref(task);
                      const isExternal = task.action?.type === "link";
                      return (
                        <div
                          key={task.id}
                          className="rounded-2xl border border-warm-200 bg-white p-4"
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={false}
                              onChange={() => void toggleTask(task.id)}
                              className="mt-0.5 h-5 w-5 rounded border-warm-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-warm-900">{task.title}</h3>
                                  <p className="mt-1 text-sm text-warm-500">{task.context}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="rounded-lg bg-warm-100 px-2 py-1 text-xs text-warm-700">
                                    {task.effort}
                                  </span>
                                  <span
                                    className={`rounded-lg border px-2 py-1 text-xs ${categoryColors[task.category]}`}
                                  >
                                    {categoryLabels[task.category]}
                                  </span>
                                </div>
                              </div>
                              {href && (
                                <div className="mt-3">
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
          </section>
        )}

        {/* Completed section */}
        {(completedPaperwork.length > 0 || completedPrep.length > 0) && (
          <section>
            <button
              type="button"
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-sm font-medium text-warm-500 hover:text-warm-700 py-2 px-1"
            >
              {showCompleted ? "Hide" : "Show"} {totalDone} completed task
              {totalDone !== 1 ? "s" : ""}
            </button>
            {showCompleted && (
              <div className="mt-3 space-y-2">
                {completedPaperwork.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-xl border border-warm-100 bg-warm-50/50 px-4 py-2.5"
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
                    className="flex items-center gap-3 rounded-xl border border-warm-100 bg-warm-50/50 px-4 py-2.5"
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

        {/* Footer links */}
        <footer className="flex gap-6 pt-4 text-sm text-warm-500">
          <Link href="/staff" className="hover:text-warm-700 py-2">
            Staff Tracker
          </Link>
          <Link href="/documents" className="hover:text-warm-700 py-2">
            Documents
          </Link>
        </footer>
      </main>
    </div>
  );
}
