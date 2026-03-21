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

      // 3. Completed prep tasks
      const { data: completedData } = await supabase
        .from("center_data")
        .select("data_value")
        .eq("center_id", currentCenter.id)
        .eq("data_key", "completed_tasks")
        .maybeSingle();
      if (completedData?.data_value) {
        try {
          const raw = completedData.data_value;
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          if (Array.isArray(parsed)) {
            setCompletedTasks(new Set(parsed.filter((id): id is string => typeof id === "string")));
          }
        } catch {
          setCompletedTasks(new Set());
        }
      }

      // 4. Staff members + alerts
      const { data: staffData } = await supabase
        .from("center_data")
        .select("data_value")
        .eq("center_id", currentCenter.id)
        .eq("data_key", "staff_members")
        .maybeSingle();
      const staffMembers = parseStaffMembers(
        (staffData as { data_value: string } | null)?.data_value ?? null
      );
      const staffAlerts = getStaffAlerts(staffMembers);

      // 5. TRS application + sections
      const { data: appRow } = await supabase
        .from("applications")
        .select("id")
        .eq("center_id", currentCenter.id)
        .eq("grant_id", "trs")
        .single();

      let sectionRows: SectionStatus[] = [];
      if (appRow) {
        const { data: secData } = await supabase
          .from("application_sections")
          .select("section_type, status, input_hash")
          .eq("application_id", appRow.id);
        sectionRows = (secData as SectionStatus[] | null) ?? [];
      }
      setSections(sectionRows);

      // 5b. Stale document detection
      const centerJson = JSON.stringify({ ...currentCenter });
      const staleDocs: { docType: string; title: string }[] = [];
      for (const sec of sectionRows) {
        if (sec.status === "verified" && sec.input_hash && sec.input_hash !== centerJson) {
          staleDocs.push({ docType: sec.section_type, title: docTitle(sec.section_type) });
        }
      }

      setAttentionItems(getAttentionItems(staffAlerts, staleDocs));

      // 6. Submission status
      const { data: subRows } = await supabase
        .from("submissions")
        .select("status, requested_at")
        .eq("center_id", currentCenter.id)
        .order("requested_at", { ascending: false })
        .limit(1);
      if (subRows && subRows.length > 0) {
        setSubmission(subRows[0] as SubmissionRow);
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
              className="rounded-xl bg-brand-500 px-3 py-1.5 text-white hover:bg-brand-600 whitespace-nowrap"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
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
                              className="mt-1 h-4 w-4 rounded border-warm-300 text-brand-500 focus:ring-brand-500"
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
                                    className="inline-flex rounded-lg border border-warm-200 px-3 py-1.5 text-xs font-medium text-warm-700 hover:bg-warm-100"
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
              className="text-sm font-medium text-warm-500 hover:text-warm-700"
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
                    <span className="text-sm text-warm-500 line-through">{task.title}</span>
                    <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                      Verified
                    </span>
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
        <footer className="flex gap-4 pt-4 text-sm text-warm-500">
          <Link href="/staff" className="hover:text-warm-700">
            Staff Tracker
          </Link>
          <Link href="/documents" className="hover:text-warm-700">
            Documents
          </Link>
        </footer>
      </main>
    </div>
  );
}
