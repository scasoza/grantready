import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendSubmissionConfirmation,
  sendSubmissionComplete,
} from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, centerName } = body as {
      type: "submission_confirmed" | "submission_completed";
      centerName: string;
    };

    if (!type || !centerName) {
      return NextResponse.json(
        { error: "Missing type or centerName" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: "Not authenticated or no email on file" },
        { status: 401 }
      );
    }

    if (type === "submission_confirmed") {
      await sendSubmissionConfirmation(user.email, centerName);
    } else if (type === "submission_completed") {
      await sendSubmissionComplete(user.email, centerName);
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[send-email] Error:", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
