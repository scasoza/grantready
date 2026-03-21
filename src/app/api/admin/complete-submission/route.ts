import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSubmissionComplete } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { submissionId } = body as { submissionId: string };

    if (!submissionId) {
      return NextResponse.json(
        { error: "Missing submissionId" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the caller is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 1. Update submission status
    const { error: updateErr } = await supabase
      .from("submissions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", submissionId);

    if (updateErr) {
      return NextResponse.json(
        { error: updateErr.message },
        { status: 500 }
      );
    }

    // 2. Look up the center and its owner
    const { data: submission } = await supabase
      .from("submissions")
      .select("center_id")
      .eq("id", submissionId)
      .maybeSingle();

    if (!submission) {
      return NextResponse.json({ ok: true, emailSent: false });
    }

    const { data: center } = await supabase
      .from("centers")
      .select("center_name, user_id")
      .eq("id", (submission as { center_id: string }).center_id)
      .maybeSingle();

    if (!center) {
      return NextResponse.json({ ok: true, emailSent: false });
    }

    const { center_name, user_id } = center as {
      center_name: string;
      user_id: string;
    };

    // 3. Get the director's email from the profiles or auth
    //    Since we can't query auth.users from the anon client,
    //    we look up the user's email via the centers owner's session
    //    or from a profiles table. As a fallback, we query the
    //    user_id from the public schema if available.
    //    The simplest approach: use supabase admin or a profiles table.
    //    For now, we'll try to get it from the auth admin API via service role,
    //    but since we only have anon key, we check if there's a profile table.
    //    Alternative: store email on centers table or use RPC.

    // Try profiles table first
    let directorEmail: string | null = null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user_id)
      .maybeSingle();

    if (profile && (profile as { email: string | null }).email) {
      directorEmail = (profile as { email: string | null }).email;
    }

    // Fallback: check if user_id matches the current admin user
    // (won't normally match, but covers edge cases)
    if (!directorEmail) {
      // Try centers table for an email field
      const { data: centerWithEmail } = await supabase
        .from("centers")
        .select("director_email")
        .eq("id", (submission as { center_id: string }).center_id)
        .maybeSingle();

      if (
        centerWithEmail &&
        (centerWithEmail as { director_email: string | null }).director_email
      ) {
        directorEmail = (centerWithEmail as { director_email: string | null })
          .director_email;
      }
    }

    // 4. Send completion email if we found the email
    if (directorEmail) {
      await sendSubmissionComplete(directorEmail, center_name);
      return NextResponse.json({ ok: true, emailSent: true });
    }

    console.warn(
      `[complete-submission] Could not find email for user_id=${user_id}, skipping email`
    );
    return NextResponse.json({ ok: true, emailSent: false });
  } catch (err) {
    console.error("[complete-submission] Error:", err);
    return NextResponse.json(
      { error: "Failed to complete submission" },
      { status: 500 }
    );
  }
}
