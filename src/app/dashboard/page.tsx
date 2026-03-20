"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  trsTasks,
  categoryLabels,
  categoryColors,
  estimateRevenueIncrease,
  type TrsTask,
} from "@/lib/trs-tasks";

type Center = {
  id: string;
  ccs_count?: number | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function actionHref(task: TrsTask) {
  if (!task.action) return null;
  if (task.action.type === "generate-doc" && task.action.docType) {
    return `/apply/trs/${task.action.docType}`;
  }
  if (task.action.type === "staff-tracker") return "/staff";
  if (task.action.type === "room-check") return "/dashboard";
  if (task.action.type === "self-assessment") return "/dashboard";
  if (task.action.type === "link" && task.action.href) return task.action.href;
  return null;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");
  const [center, setCenter] = useState<Center | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadDashboard = async () => {
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

      const { data: completedData } = await supabase
        .from("center_data")
        .select("data_value")
        .eq("center_id", currentCenter.id)
        .eq("data_key", "completed_tasks")
        .maybeSingle();

      if (completedData?.data_value) {
        const rawValue = completedData.data_value;
        try {
          const parsed =
            typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
          if (Array.isArray(parsed)) {
            setCompletedTasks(
              new Set(parsed.filter((id): id is string => typeof id === "string"))
            );
          }
        } catch {
          setCompletedTasks(new Set());
        }
      }

      setLoading(false);
    };

    void loadDashboard();
  }, [router, supabase]);

  const completedCount = completedTasks.size;
  const totalCount = trsTasks.length;
  const progressPct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const revenueProjection = estimateRevenueIncrease(center?.ccs_count ?? 10, 0);

  const taskTitleById = useMemo(() => {
    return Object.fromEntries(trsTasks.map((task) => [task.id, task.title]));
  }, []);

  const pendingTasks = trsTasks.filter((task) => !completedTasks.has(task.id));
  const doneTasks = trsTasks.filter((task) => completedTasks.has(task.id));

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

  const toggleTask = async (task: TrsTask) => {
    const blocked =
      task.dependsOn && task.dependsOn.some((dependencyId) => !completedTasks.has(dependencyId));
    if (blocked) return;

    const next = new Set(completedTasks);
    if (next.has(task.id)) {
      next.delete(task.id);
    } else {
      next.add(task.id);
    }

    setCompletedTasks(next);
    await saveCompletedTasks(next);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 text-warm-900">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">Loading dashboard...</div>
      </div>
    );
  }

  const renderTaskCard = (task: TrsTask, isCompleted: boolean) => {
    const unmetDependencies = (task.dependsOn ?? []).filter(
      (dependencyId) => !completedTasks.has(dependencyId)
    );
    const isBlocked = unmetDependencies.length > 0 && !isCompleted;
    const href = actionHref(task);

    return (
      <div
        key={task.id}
        className={`rounded-2xl border bg-white p-4 transition sm:p-5 ${
          isBlocked ? "border-warm-200 opacity-60" : "border-warm-200"
        } ${isCompleted ? "bg-warm-50/50" : ""}`}
      >
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isCompleted}
            disabled={isBlocked}
            onChange={() => void toggleTask(task)}
            className="mt-1 h-4 w-4 rounded border-warm-300 text-brand-500 focus:ring-brand-500"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3
                  className={`font-semibold ${
                    isCompleted ? "text-warm-500 line-through" : "text-warm-900"
                  }`}
                >
                  {task.title}
                </h3>
                <p className={`mt-1 text-sm ${isCompleted ? "text-warm-400" : "text-warm-500"}`}>
                  {task.context}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-warm-100 px-2 py-1 text-xs text-warm-700">
                  {task.effort}
                </span>
                <span className={`rounded-lg border px-2 py-1 text-xs ${categoryColors[task.category]}`}>
                  {categoryLabels[task.category]}
                </span>
              </div>
            </div>

            {isBlocked && (
              <p className="mt-2 text-xs text-warm-500">
                Requires: {unmetDependencies.map((id) => taskTitleById[id] ?? id).join(", ")}
              </p>
            )}

            {!isBlocked && task.action && href && (
              <div className="mt-3">
                <Link
                  href={href}
                  target={task.action.type === "link" ? "_blank" : undefined}
                  rel={task.action.type === "link" ? "noreferrer" : undefined}
                  onClick={() => {
                    if (task.action?.type === "room-check") {
                      window.alert("Room self-check coming soon");
                    }
                    if (task.action?.type === "self-assessment") {
                      window.alert("Self-assessment auto-fill coming soon");
                    }
                  }}
                  className="inline-flex rounded-lg border border-warm-200 px-3 py-1.5 text-xs font-medium text-warm-700 hover:bg-warm-100"
                >
                  {task.action.label}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-warm-50 text-warm-900">
      <nav className="border-b border-warm-200 bg-white/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-warm-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-sm font-extrabold text-white">
              G
            </span>
            GrantReady
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-warm-600">{userEmail}</span>
            <button
              onClick={() => void handleSignOut()}
              className="rounded-xl bg-brand-500 px-3 py-1.5 text-white hover:bg-brand-600"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-500 to-green-500 p-5 text-white sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">TRS Certification Checklist</h1>
              <p className="mt-1 text-sm text-emerald-50">
                {completedCount} of {totalCount} tasks complete
              </p>
            </div>
            <p className="text-right text-sm sm:text-base">
              Completing TRS certification will increase your revenue by ~
              {formatCurrency(revenueProjection.annualIncrease)}/year
            </p>
          </div>

          <div className="mt-4 h-3 w-full rounded-full bg-white/30">
            <div
              className="h-3 rounded-full bg-white transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-emerald-50">{progressPct}% complete</p>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-semibold text-warm-900">Checklist</h2>
          <div className="mt-3 space-y-3">{pendingTasks.map((task) => renderTaskCard(task, false))}</div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-warm-700">Completed</h2>
          <div className="mt-3 space-y-3">
            {doneTasks.length === 0 ? (
              <p className="rounded-2xl border border-warm-200 bg-white p-4 text-sm text-warm-500">
                No completed tasks yet.
              </p>
            ) : (
              doneTasks.map((task) => renderTaskCard(task, true))
            )}
          </div>
        </section>

        <footer className="mt-10 flex gap-4 text-sm text-warm-500">
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
