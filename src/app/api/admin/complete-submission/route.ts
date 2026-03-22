import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSubmissionComplete } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { submissionId } = body as { submissionId: string };

    if (!submissionId) {
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
    }

    // Verify the caller is the admin (authenticated via anon key + middleware)
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

    // Use service role client to bypass RLS
    const admin = createAdminClient();

    // 1. Update submission status
    const { error: updateErr } = await admin
      .from("submissions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", submissionId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 2. Look up the submission's center and owner
    const { data: submission } = await admin
      .from("submissions")
      .select("center_id")
      .eq("id", submissionId)
      .maybeSingle();

    if (!submission) {
      return NextResponse.json({ ok: true, emailSent: false });
    }

    const { data: center } = await admin
      .from("centers")
      .select("center_name, user_id")
      .eq("id", submission.center_id)
      .maybeSingle();

    if (!center) {
      return NextResponse.json({ ok: true, emailSent: false });
    }

    // 3. Get the director's email from auth.users (service role can read this)
    const { data: authUser } = await admin.auth.admin.getUserById(center.user_id);
    const directorEmail = authUser?.user?.email;

    if (directorEmail) {
      await sendSubmissionComplete(directorEmail, center.center_name ?? "Your Center");
      return NextResponse.json({ ok: true, emailSent: true });
    }

    console.warn(`[complete-submission] No email for user_id=${center.user_id}`);
    return NextResponse.json({ ok: true, emailSent: false });
  } catch (err) {
    console.error("[complete-submission] Error:", err);
    return NextResponse.json({ error: "Failed to complete submission" }, { status: 500 });
  }
}
