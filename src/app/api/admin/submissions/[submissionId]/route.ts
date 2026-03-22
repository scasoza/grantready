import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseStaffMembers } from "@/lib/staff-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;

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

    // 1. Get submission
    const { data: submission, error: subErr } = await admin
      .from("submissions")
      .select("id, center_id, status, requested_at, completed_at")
      .eq("id", submissionId)
      .maybeSingle();

    if (subErr || !submission) {
      return NextResponse.json(
        { error: subErr?.message ?? "Submission not found" },
        { status: 404 }
      );
    }

    // 2. Get center
    const { data: center } = await admin
      .from("centers")
      .select("id, center_name, address, county, licensed_capacity, enrollment_count, staff_count, ccs_count, user_id")
      .eq("id", submission.center_id)
      .maybeSingle();

    // 3. Get TRS application + sections
    let sections: { id: string; section_type: string; status: string; ai_draft: string | null }[] = [];
    if (center) {
      const { data: app } = await admin
        .from("applications")
        .select("id")
        .eq("center_id", center.id)
        .eq("grant_id", "trs")
        .maybeSingle();

      if (app) {
        const { data: secData } = await admin
          .from("application_sections")
          .select("id, section_type, status, ai_draft")
          .eq("application_id", app.id);
        sections = secData ?? [];
      }

      // 4. Get staff data
      const { data: staffData } = await admin
        .from("center_data")
        .select("data_value")
        .eq("center_id", center.id)
        .eq("data_key", "staff_members")
        .maybeSingle();

      const staff = parseStaffMembers(staffData?.data_value ?? null);

      return NextResponse.json({ submission, center, sections, staff });
    }

    return NextResponse.json({ submission, center: null, sections: [], staff: [] });
  } catch (err) {
    console.error("[admin/submission-detail] Error:", err);
    return NextResponse.json({ error: "Failed to load submission" }, { status: 500 });
  }
}
