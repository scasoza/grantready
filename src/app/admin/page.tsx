"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  user_id: string;
};

type EnrichedSubmission = SubmissionRow & {
  center_name: string;
  director_email: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<EnrichedSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      // Fetch all submissions ordered by most recent first
      const { data: subRows, error: subErr } = await supabase
        .from("submissions")
        .select("id, center_id, status, requested_at, completed_at")
        .order("requested_at", { ascending: false });

      if (subErr) {
        setError(subErr.message);
        setLoading(false);
        return;
      }

      const rows = (subRows ?? []) as SubmissionRow[];

      if (rows.length === 0) {
        setSubmissions([]);
        setLoading(false);
        return;
      }

      // Fetch centers for all submissions
      const centerIds = [...new Set(rows.map((r) => r.center_id))];
      const { data: centerRows } = await supabase
        .from("centers")
        .select("id, center_name, user_id")
        .in("id", centerIds);

      const centersById = new Map<string, CenterRow>();
      for (const c of (centerRows ?? []) as CenterRow[]) {
        centersById.set(c.id, c);
      }

      // Fetch user emails for each unique user_id via auth — fall back to placeholder
      // Since we only have anon key, we'll fetch profiles/emails by querying auth.users
      // We'll use the user_id from centers and try to get email from a stored source.
      // For MVP: show user_id if email unavailable (anon client can't read auth.users)
      const userIds = [...new Set(
        [...centersById.values()].map((c) => c.user_id).filter(Boolean)
      )];

      // Try to get emails from a profiles table or similar — gracefully degrade
      let emailMap = new Map<string, string>();
      if (userIds.length > 0) {
        // Attempt to get emails stored in a profiles or similar table
        // If it doesn't exist, this silently returns empty
        const { data: profileRows } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", userIds);
        if (profileRows) {
          for (const p of profileRows as { id: string; email: string }[]) {
            emailMap.set(p.id, p.email);
          }
        }
      }

      const enriched: EnrichedSubmission[] = rows.map((row) => {
        const center = centersById.get(row.center_id);
        const userId = center?.user_id ?? "";
        const email = emailMap.get(userId) ?? userId ?? "—";
        return {
          ...row,
          center_name: center?.center_name ?? "Unknown center",
          director_email: email,
        };
      });

      setSubmissions(enriched);
      setLoading(false);
    };

    void load();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 text-warm-900">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <p className="text-warm-500">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-warm-50 text-warm-900">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 text-warm-900">
      {/* Nav */}
      <nav className="border-b border-warm-200 bg-white/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-warm-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-sm font-extrabold text-white">
              G
            </span>
            CareLadder
          </Link>
          <span className="text-sm text-warm-500">Admin</span>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Admin — Pending Submissions</h1>
          <p className="mt-1 text-sm text-warm-500">
            {submissions.length} submission{submissions.length !== 1 ? "s" : ""} total
          </p>
        </div>

        {submissions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-warm-300 bg-warm-50/50 p-8 text-center">
            <p className="text-sm font-medium text-warm-600">No submissions yet</p>
            <p className="mt-1 text-xs text-warm-400">When a director submits their TRS application, it will appear here for you to process.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => (
              <Link
                key={sub.id}
                href={`/admin/${sub.id}`}
                className="block rounded-xl border border-warm-200 bg-white p-5 transition hover:border-warm-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-warm-900 truncate">{sub.center_name}</h2>
                    <p className="mt-0.5 text-sm text-warm-500 truncate">{sub.director_email}</p>
                    <p className="mt-2 text-xs text-warm-400">
                      Requested {formatDate(sub.requested_at)}
                    </p>
                    {sub.completed_at && (
                      <p className="mt-0.5 text-xs text-warm-400">
                        Completed {formatDate(sub.completed_at)}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    {sub.status === "pending" ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                        Pending
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                        Completed
                      </span>
                    )}
                    <span className="text-xs text-warm-400">View details &rarr;</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
