import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    // Verify caller is admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const admin = createAdminClient();

    // Get all submissions
    const { data: submissions, error: subErr } = await admin
      .from("submissions")
      .select("id, center_id, status, requested_at, completed_at")
      .order("requested_at", { ascending: false });

    if (subErr) {
      return NextResponse.json({ error: subErr.message }, { status: 500 });
    }

    const rows = submissions ?? [];
    if (rows.length === 0) {
      return NextResponse.json({ submissions: [] });
    }

    // Get centers
    const centerIds = [...new Set(rows.map((r) => r.center_id))];
    const { data: centers } = await admin
      .from("centers")
      .select("id, center_name, user_id")
      .in("id", centerIds);

    const centersById = new Map<string, { center_name: string; user_id: string }>();
    for (const c of centers ?? []) {
      centersById.set(c.id, c);
    }

    // Get user emails via auth admin API
    const userIds = [...new Set([...centersById.values()].map((c) => c.user_id).filter(Boolean))];
    const emailMap = new Map<string, string>();
    for (const uid of userIds) {
      const { data: authUser } = await admin.auth.admin.getUserById(uid);
      if (authUser?.user?.email) {
        emailMap.set(uid, authUser.user.email);
      }
    }

    const enriched = rows.map((row) => {
      const center = centersById.get(row.center_id);
      const userId = center?.user_id ?? "";
      return {
        ...row,
        center_name: center?.center_name ?? "Unknown center",
        director_email: emailMap.get(userId) ?? "—",
      };
    });

    return NextResponse.json({ submissions: enriched });
  } catch (err) {
    console.error("[admin/submissions] Error:", err);
    return NextResponse.json({ error: "Failed to load submissions" }, { status: 500 });
  }
}
